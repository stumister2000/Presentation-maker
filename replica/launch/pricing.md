# Pricing

Date: 2026-11-24.

## What the market charges

| product | page | read on | free plan | paid plans |
| --- | --- | --- | --- | --- |
| The original | https://gamma.app/pricing | **not read**: blocked from this session | — | — |
| Alternative 1 (pick one) | its /pricing page | not read | — | — |
| Alternative 2 (pick one) | its /pricing page | not read | — | — |

No competitor prices are filled in because none could be read from here, and
none are guessed. Before launch, open each pricing page in a browser, fill
the table with the date you read it, and check the tiers below still make
sense against it. Prices change, so the date matters.

## What reviewers said about price and billing

From `replica/feedback.md` (29 reviews, 2 sources; all thin):

- **Credits running out mid-deck**, with the deck held until you pay: 2 reviews, 1 source (App Store), including the only 1-star review in the sample.
- **Free credits that never come back**: 1 review, 1 source ("Waiting for your free credits to reload as we’ve done everywhere else isn’t an option with this one either.").
- Nobody in the sample complained about the price level itself, only about walls and surprises.

So the fixes are about **shape and honesty**, not about being cheapest.

## The model

- **Free plan, no trial clock.** 400 credits to start, topped back up to 25 every day. Enough to make a real deck and come back tomorrow.
- **Flat per person, no seats.** No surprise per-seat jumps because there are no seats.
- **Monthly or yearly**, yearly = two months free.
- **Credit packs** for anyone who needs a burst without changing plan.
- **Never a wall in the middle of work**: with zero credits you can still build the deck from your own outline, free.

| tier | for | price | credits | limits |
| --- | --- | --- | --- | --- |
| Free | trying it properly | $0 | 400 at sign-up, then a daily top-up to 25 | 10 cards per deck, small badge on shared links |
| Solo | people who present every month | $8 / month or $80 / year | 1,000 per month | 20 cards per deck, no badge |
| Pro | people who present every week | $20 / month or $200 / year | 2,500 per month | 40 cards per deck, email support in one business day |
| Pack | anyone | $5 one-off | 500, never expire | — |

### Why these numbers (estimate, check with real usage)

- Cost per credit, estimated from Claude Opus 5.5 list prices ($4 input / $20 output per million tokens): a 10-card deck (40 credits) ≈ 3k input + 6.5k output tokens ≈ $0.15, so **1 credit ≈ $0.0037**.
- Worst case at full use: Solo 1,000 credits ≈ $3.70 of AI on $8 (46%); Pro 2,500 ≈ $9.25 on $20 (46%); pack 500 ≈ $1.85 on $5 (37%). Stripe fees come on top.
- Free: sign-up 400 ≈ $1.50 per account; the daily top-up costs at most ≈ $0.09 a day per active free user. Watch this number first after launch.
- If margins are thinner than this in your logs, the levers are, in order: fewer credits per tier, a lower AI effort level for outlines, or a different model via `AI_MODEL`. Changing the model is your call; it trades output quality for cost.

## Billing complaints, fixed in the product

- [x] Cost shown before every generation ("Uses 25 of 400").
- [x] Out of credits → build from outline, free (fix 1, test X1-H1).
- [x] Daily free top-up (cron `freeTopUps`, test in `backend.spec.ts`).
- [x] Cancel in one click via the Stripe Customer Portal; plan stays to the end of the period.
- [x] Payment failed → plain email with a link to fix the card (`invoice.payment_failed`).
- [ ] Renewal reminder email before yearly renewals: turn on Stripe's "upcoming renewal" email in the Stripe dashboard (Settings → Customer emails).

## Stripe products to create (you create them, in test mode first)

| product | price | type | env var |
| --- | --- | --- | --- |
| Fairdeck Solo | $8.00 USD / month | recurring | `STRIPE_PRICE_PLUS_MONTHLY` |
| Fairdeck Solo | $80.00 USD / year | recurring | `STRIPE_PRICE_PLUS_YEARLY` |
| Fairdeck Pro | $20.00 USD / month | recurring | `STRIPE_PRICE_PRO_MONTHLY` |
| Fairdeck Pro | $200.00 USD / year | recurring | `STRIPE_PRICE_PRO_YEARLY` |
| 500 credits | $5.00 USD | one-time | `STRIPE_PRICE_CREDITS_500` |

(Internal plan keys stay `plus` and `pro`; only the names shown to people changed.)
Customer Portal: allow cancel at period end, switching between Solo and Pro, and card updates.
