import { NextResponse } from "next/server";
import { q } from "@/server/db";

// Daily housekeeping, called by Vercel Cron (vercel.json) with
// Authorization: Bearer $CRON_SECRET. Safe to run twice.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  const results: Record<string, number | string> = {};
  const jobs: Array<[string, () => Promise<unknown[]>]> = [
    ["purgedDecks", () => q`delete from decks where archived_at < now() - interval '30 days' returning id`],
    ["expiredSessions", () => q`delete from sessions where expires_at < now() returning id`],
    ["expiredTokens", () => q`delete from email_tokens where expires_at < now() - interval '1 day' returning id`],
    ["oldStripeEvents", () => q`delete from stripe_events where processed_at < now() - interval '90 days' returning id`],
  ];
  for (const [name, run] of jobs) {
    // one job failing does not stop the others; the failure is logged and retried tomorrow
    try { results[name] = (await run()).length; }
    catch (e) { results[name] = "failed"; console.error(`cron ${name} failed`, String(e).slice(0, 300)); }
  }
  return NextResponse.json({ ok: true, results });
}
