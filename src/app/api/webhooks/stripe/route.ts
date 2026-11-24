import { NextResponse } from "next/server";
import { getStripe, handleEvent } from "@/server/billing";

/** Signature-verified, idempotent. A failure returns 500 so Stripe retries; the event row is rolled back. */
export async function POST(req: Request) {
  const s = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return NextResponse.json({ error: "not configured" }, { status: 501 });
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event;
  try {
    event = s.webhooks.constructEvent(raw, sig ?? "", secret);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  try {
    const processed = await handleEvent(s, event);
    return NextResponse.json({ received: true, duplicate: !processed });
  } catch (e) {
    console.error("stripe webhook failed", event.type, String(e).slice(0, 300));
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
}
