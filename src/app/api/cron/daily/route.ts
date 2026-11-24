import { NextResponse } from "next/server";
import { q } from "@/server/db";
import { DAILY_FREE_FLOOR } from "@/lib/plans";

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
    // free plan: top back up to the daily floor, once per user per day (unique ledger ref makes it idempotent)
    ["freeTopUps", () => q`
      with due as (
        select id, ${DAILY_FREE_FLOOR}::int - credits as delta from users where plan = 'free' and credits < ${DAILY_FREE_FLOOR}::int
      ), logged as (
        insert into credit_ledger (user_id, delta, reason, ref_id)
        select id, delta, 'plan_refill', 'daily-' || to_char(now() at time zone 'utc', 'YYYY-MM-DD') || '-' || id from due
        on conflict do nothing returning user_id, delta
      )
      update users u set credits = u.credits + l.delta from logged l where u.id = l.user_id returning u.id`],
    ["oldStripeEvents", () => q`delete from stripe_events where processed_at < now() - interval '90 days' returning id`],
  ];
  for (const [name, run] of jobs) {
    // one job failing does not stop the others; the failure is logged and retried tomorrow
    try { results[name] = (await run()).length; }
    catch (e) { results[name] = "failed"; console.error(`cron ${name} failed`, String(e).slice(0, 300)); }
  }
  return NextResponse.json({ ok: true, results });
}
