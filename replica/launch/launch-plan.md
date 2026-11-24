# Launch plan

## Before launch (2–4 weeks)

- **Waitlist / beta list.** Put a "Get early access" email form on the landing page during the beta (Resend audience or a simple table), invite in batches of 20.
- **Analytics.** Privacy-friendly page analytics (Plausible or similar) on the landing page only; product events to count: sign-up, outline drafted, deck generated, free outline-only deck, out-of-credits shown, upgrade, cancel. Add the processor to `/privacy`.
- **Error tracking.** Sentry (or similar) on server and client, with PII scrubbing; alert on any 5xx and on generation failures.
- **Cost watch.** Log tokens per generation (`usage` from the Claude response) next to credits charged; check the per-credit estimate in `pricing.md` after the first 100 decks.
- **Manual checklist** in `replica/test-plan.md` done with real keys (Claude, Stripe, Resend, Google).
- **Name checks** in `replica/brand.md` run, and a lawyer's trademark search before buying the domain.

## Where unhappy users of AI deck tools talk

Read first, post only where self-promotion is allowed, always say you built it.

- Hacker News: "Ask HN" threads about AI presentation tools (the research found several, e.g. https://news.ycombinator.com/item?id=49532226 and Show HN threads for other deck makers).
- App Store reviews of AI deck apps: the complaints there are the ones we fixed (credits running out mid-deck, text size, export).
- Reddit: subreddits for consultants, teachers, startups and presentations (not researched in this session; search "AI presentation tool credits", "AI slides alternative" and read the rules first).

## The launch post

**Show HN / Product Hunt**, leading with the fix, not with the category:

> Fairdeck – AI decks that show the price first and never lock your work
>
> I kept seeing people run out of credits halfway through an AI-generated deck, with the rest held until they paid. Fairdeck shows the exact credit cost before you generate, and if you are out, it lays out your own outline as a deck for free. It also has one switch for text size across the whole deck (including the PowerPoint export) and design notes the AI follows. Free to start, no card. Built with Next.js, Postgres and Claude. Happy to answer anything about the streaming card generation.

Do not name or compare to other products in the post or ads; a comparison page is a question for a lawyer.

## First 10 users, by hand

1. Five people who make decks every week (consultants, teachers, founders) from your own network: watch them make one deck on a call, say nothing, note where they hesitate.
2. Three people who already pay for an AI deck tool: ask what made them pay and what still annoys them.
3. Two people who use PowerPoint daily: send them the export and ask what they had to fix.

Write each session up in `replica/feedback-beta.md` (their words, with permission), and turn repeats into rows in `replica/features.csv`.

## Store listing (later, if a mobile wrapper ships)

`replica/launch/listing.json` passes `listing.py` (0 errors, 0 warnings). Still to prepare at upload time: screenshots at the sizes App Store Connect and Play Console ask for, privacy labels and the data safety form (from `/privacy`), support URL, age rating, and review notes with a demo account (`npm run db:seed` creates demo@example.com).
