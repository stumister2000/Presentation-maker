// Plan copy and prices shown in the app and on the landing page.
// Server-side limits live in src/server/queries.ts (PLAN_LIMITS).
export interface PlanInfo { key: "free" | "plus" | "pro"; name: string; monthly: number; yearlyPerMonth: number; credits: string; features: string[] }

export const CREDIT_PACK_INFO = { credits: 500, price: 5 };

export const PLANS: PlanInfo[] = [
  { key: "free", name: "Free", monthly: 0, yearlyPerMonth: 0, credits: "400 credits to start",
    features: ["Up to 10 cards per generation", "All themes and templates", "Share links and PDF export", "Small “Made with” badge on shared decks"] },
  { key: "plus", name: "Plus", monthly: 8, yearlyPerMonth: 6, credits: "1,000 credits every month",
    features: ["Up to 20 cards per generation", "No badge on shared decks", "PowerPoint export", "View analytics"] },
  { key: "pro", name: "Pro", monthly: 16, yearlyPerMonth: 12, credits: "4,000 credits every month",
    features: ["Up to 40 cards per generation", "Everything in Plus", "Priority generation", "Email support within one business day"] },
];
