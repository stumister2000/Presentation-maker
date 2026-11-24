import "server-only";
import Stripe from "stripe";
import { q, tx, type Q } from "./db";
import { PLAN_LIMITS, type Plan } from "./queries";
import { appUrl, emails, sendEmail } from "./email";

// Stripe Checkout + Customer Portal + webhooks. Prices are created by the owner
// in their own Stripe account; their IDs come from env. Subscription state
// lives in our database, written only by verified webhooks.

let stripe: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return (stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY));
}

type Period = "monthly" | "yearly";
const PRICE_ENV: Record<"plus" | "pro", Record<Period, string>> = {
  plus: { monthly: "STRIPE_PRICE_PLUS_MONTHLY", yearly: "STRIPE_PRICE_PLUS_YEARLY" },
  pro: { monthly: "STRIPE_PRICE_PRO_MONTHLY", yearly: "STRIPE_PRICE_PRO_YEARLY" },
};
export const priceId = (plan: "plus" | "pro", period: Period) => process.env[PRICE_ENV[plan][period]] ?? null;

/** One-off credit pack (Stripe one-time price). */
export const CREDIT_PACK = { credits: 500, priceEnv: "STRIPE_PRICE_CREDITS_500" } as const;
export const packPriceId = () => process.env[CREDIT_PACK.priceEnv] ?? null;

function planForPrice(id: string | undefined): { plan: "plus" | "pro"; period: Period } | null {
  for (const plan of ["plus", "pro"] as const) for (const period of ["monthly", "yearly"] as const) if (id && priceId(plan, period) === id) return { plan, period };
  return null;
}

export async function ensureCustomer(s: Stripe, userId: string, email: string): Promise<string> {
  const [u] = await q<{ stripe_customer_id: string | null }>`select stripe_customer_id from users where id = ${userId}`;
  if (u?.stripe_customer_id) return u.stripe_customer_id;
  const c = await s.customers.create({ email, metadata: { userId } }, { idempotencyKey: `customer-${userId}` });
  await q`update users set stripe_customer_id = ${c.id} where id = ${userId} and stripe_customer_id is null`;
  return c.id;
}

const ACTIVE = new Set(["active", "trialing", "past_due"]);

async function syncSubscription(t: Q, sub: Stripe.Subscription) {
  const userId = sub.metadata.userId;
  const item = sub.items.data[0];
  const mapped = planForPrice(item?.price.id);
  if (!userId || !mapped) return;
  const periodEnd = new Date((item.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000);
  await t`
    insert into subscriptions (user_id, stripe_subscription_id, plan, status, current_period_end)
    values (${userId}, ${sub.id}, ${mapped.plan}, ${sub.status}, ${periodEnd})
    on conflict (stripe_subscription_id) do update set plan = excluded.plan, status = excluded.status,
      current_period_end = excluded.current_period_end, updated_at = now()`;
  // the user's plan is their best active subscription, else free
  const [best] = await t<{ plan: Plan }>`
    select plan from subscriptions where user_id = ${userId} and status in ('active', 'trialing', 'past_due')
    order by case plan when 'pro' then 0 else 1 end limit 1`;
  await t`update users set plan = ${best?.plan ?? "free"}, updated_at = now() where id = ${userId}`;
}

async function grantPlanCredits(t: Q, userId: string, plan: "plus" | "pro", period: Period, refId: string) {
  const amount = PLAN_LIMITS[plan].monthlyCredits * (period === "yearly" ? 12 : 1);
  // unique (reason, ref_id) makes a redelivered invoice a no-op
  const rows = await t`insert into credit_ledger (user_id, delta, reason, ref_id) values (${userId}, ${amount}, 'plan_refill', ${refId})
    on conflict do nothing returning id`;
  if (rows.length) await t`update users set credits = credits + ${amount} where id = ${userId}`;
}

/** Handles one verified event exactly once. Returns false if it was already processed. */
export async function handleEvent(s: Stripe, event: Stripe.Event): Promise<boolean> {
  // fetch anything we need from Stripe before opening the transaction
  let sub: Stripe.Subscription | null = null;
  let invoiceUser: { userId: string; email: string | null } | null = null;
  let packFor: string | null = null;
  if (event.type === "checkout.session.completed") {
    const cs = event.data.object;
    if (cs.mode === "subscription" && typeof cs.subscription === "string") sub = await s.subscriptions.retrieve(cs.subscription);
    if (cs.mode === "payment" && cs.payment_status === "paid" && cs.metadata?.kind === "credit_pack" && cs.metadata.userId) packFor = cs.metadata.userId;
  } else if (event.type.startsWith("customer.subscription.")) {
    sub = event.data.object as Stripe.Subscription;
  } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const inv = event.data.object as Stripe.Invoice;
    const subRef = inv.parent?.subscription_details?.subscription;
    if (subRef) sub = typeof subRef === "string" ? await s.subscriptions.retrieve(subRef) : subRef;
    if (sub?.metadata.userId) invoiceUser = { userId: sub.metadata.userId, email: inv.customer_email };
  }

  return tx(async (t) => {
    const fresh = await t`insert into stripe_events (id, type) values (${event.id}, ${event.type}) on conflict do nothing returning id`;
    if (!fresh.length) return false;
    if (sub) await syncSubscription(t, sub);
    if (packFor) {
      const ref = (event.data.object as Stripe.Checkout.Session).id;
      const rows = await t`insert into credit_ledger (user_id, delta, reason, ref_id) values (${packFor}, ${CREDIT_PACK.credits}, 'purchase', ${ref})
        on conflict do nothing returning id`;
      if (rows.length) await t`update users set credits = credits + ${CREDIT_PACK.credits} where id = ${packFor}`;
    }
    if (event.type === "invoice.paid" && sub && invoiceUser) {
      const mapped = planForPrice(sub.items.data[0]?.price.id);
      if (mapped) await grantPlanCredits(t, invoiceUser.userId, mapped.plan, mapped.period, (event.data.object as Stripe.Invoice).id ?? event.id);
    }
    if (event.type === "invoice.payment_failed" && invoiceUser?.email) {
      await sendEmail({ to: invoiceUser.email, ...emails.paymentFailed(`${appUrl()}/settings#plans`) }).catch((e) => console.error("payment-failed email", String(e)));
    }
    return true;
  });
}

/** Cancels every live subscription for a user, used before account deletion. */
export async function cancelAll(userId: string) {
  const s = getStripe();
  if (!s) return;
  const subs = await q<{ stripe_subscription_id: string }>`select stripe_subscription_id from subscriptions where user_id = ${userId} and status in ('active', 'trialing', 'past_due')`;
  for (const x of subs) await s.subscriptions.cancel(x.stripe_subscription_id).catch((e) => console.error("cancel failed", String(e)));
}
