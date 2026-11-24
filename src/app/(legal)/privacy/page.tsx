import { APP_NAME, SUPPORT_EMAIL } from "@/lib/brand";

export const metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p>Last updated: [date]. {APP_NAME} is run by [company name, address]. Contact: {SUPPORT_EMAIL}.</p>

      <h2>What we collect</h2>
      <ul>
        <li>Account: your email, name, and a hashed password (or your Google account id if you sign in with Google).</li>
        <li>Your content: the decks, outlines, notes and images links you create.</li>
        <li>Billing: your plan and Stripe customer id. We never see or store card numbers.</li>
        <li>Shared-link analytics: for decks you share, how many cards each visit saw and for how long, under a random id made for that one visit. No cookies, no names, no IP addresses stored.</li>
        <li>Security: session cookies, and short-lived rate-limit counters held in memory.</li>
      </ul>

      <h2>Who processes it for us</h2>
      <ul>
        <li>Anthropic (AI writing): the text you ask it to work on, when you generate or rewrite.</li>
        <li>Stripe (payments).</li>
        <li>Resend (sign-in, verification and billing emails).</li>
        <li>Unsplash (photo search): your search words, when you search photos.</li>
        <li>Google (only if you choose Google sign-in).</li>
        <li>[Hosting provider] and [database provider], where the app and your data live.</li>
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell your data or use it for advertising.</li>
        <li>We do not use your decks to train AI models, and we use AI providers under terms that do not either.</li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li>Delete your account any time in Settings. It deletes every deck and its analytics straight away, and cancels any subscription.</li>
        <li>Ask for a copy of your data or a correction at {SUPPORT_EMAIL}.</li>
        <li>Decks in the trash are deleted for good after 30 days.</li>
      </ul>

      <h2>Cookies</h2>
      <p>One cookie keeps you signed in. If you use Google sign-in, two more last ten minutes while you sign in. All are strictly necessary. No analytics, advertising or third-party tracking cookies.</p>
    </>
  );
}
