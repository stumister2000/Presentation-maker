import { route } from "@/server/http";
import { HttpError, requireUser } from "@/server/auth";
import { getStripe } from "@/server/billing";
import { appUrl } from "@/server/email";
import { getUser } from "@/server/queries";

/** Stripe's hosted portal: change card, switch plan, cancel in one click. */
export const POST = route(async () => {
  const u = await requireUser();
  const s = getStripe();
  const row = await getUser(u.id);
  if (!s) throw new HttpError(501, "Payments are not switched on yet.", "not_configured");
  if (!row?.stripe_customer_id) throw new HttpError(404, "No billing account yet.");
  const session = await s.billingPortal.sessions.create({ customer: row.stripe_customer_id, return_url: `${appUrl()}/settings#plans` });
  return { url: session.url };
});
