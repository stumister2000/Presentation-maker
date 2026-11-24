import { APP_NAME, SUPPORT_EMAIL } from "@/lib/brand";

export const metadata = { title: "Terms" };

export default function Terms() {
  return (
    <>
      <h1>Terms of service</h1>
      <p>Last updated: [date]. These terms are between you and [company name] for your use of {APP_NAME}.</p>

      <h2>Your content</h2>
      <p>What you make is yours. You give us only the permission we need to store it, show it to you and to people you share it with, and send it to our AI provider when you ask for AI writing.</p>

      <h2>AI output</h2>
      <p>AI writing can be wrong. Check facts, figures and quotes before you present them. You are responsible for what you publish.</p>

      <h2>Plans, credits and cancelling</h2>
      <ul>
        <li>Prices are shown before you pay. Plans renew monthly or yearly until you cancel.</li>
        <li>Cancel in Settings in one click. Your plan stays active to the end of the paid period.</li>
        <li>Monthly plan credits reset each period. Purchased credit packs do not expire.</li>
        <li>Refunds: [policy, e.g. within 14 days if you have used fewer than 100 credits].</li>
      </ul>

      <h2>Fair use</h2>
      <p>No unlawful, harmful or infringing content, no attempts to break the service or other people’s accounts, no automated bulk use outside a published API.</p>

      <h2>Contact</h2>
      <p>{SUPPORT_EMAIL}</p>
    </>
  );
}
