import { z } from "zod";
import { route, body, rateLimit } from "@/server/http";
import { HttpError, requireUser } from "@/server/auth";
import { ensureCustomer, getStripe, priceId } from "@/server/billing";
import { appUrl } from "@/server/email";

export const POST = route(async (req) => {
  const u = await requireUser();
  rateLimit(`checkout:${u.id}`, 10, 60_000);
  const { plan, period } = await body(req, z.object({ plan: z.enum(["plus", "pro"]), period: z.enum(["monthly", "yearly"]).default("monthly") }));
  const s = getStripe();
  const price = priceId(plan, period);
  if (!s || !price) throw new HttpError(501, "Payments are not switched on yet.", "not_configured");
  if (u.plan === plan) throw new HttpError(409, "You are already on this plan. Use Manage billing to change it.");
  const customer = await ensureCustomer(s, u.id, u.email);
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: u.id,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { userId: u.id } },
    metadata: { userId: u.id, plan },
    allow_promotion_codes: true,
    success_url: `${appUrl()}/settings?upgraded=1#plans`,
    cancel_url: `${appUrl()}/settings#plans`,
  });
  return { url: session.url };
});
