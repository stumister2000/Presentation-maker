// Plan copy and prices shown in the app and on the landing page.
// Server-side limits live in src/server/queries.ts (PLAN_LIMITS). Rationale: replica/launch/pricing.md.
export interface PlanInfo {
  key: "free" | "plus" | "pro";
  name: string;
  forWho: string;
  monthly: number;
  yearly: number; // total per year: two months free
  credits: string;
  features: string[];
}

export const DAILY_FREE_FLOOR = 25; // free plan tops back up to this each day (enough for a 5-card deck)
export const CREDIT_PACK_INFO = { credits: 500, price: 5 };

export const PLANS: PlanInfo[] = [
  { key: "free", name: "Free", forWho: "For trying it properly", monthly: 0, yearly: 0, credits: `400 credits to start, topped back up to ${DAILY_FREE_FLOOR} every day`,
    features: ["Up to 10 cards per deck", "All themes and templates", "Share links, PDF and PowerPoint export", "Out of credits? Build from your outline, free", "Small “Made with Fairdeck” badge on shared decks"] },
  { key: "plus", name: "Solo", forWho: "For people who present every month", monthly: 8, yearly: 80, credits: "1,000 credits every month",
    features: ["Up to 20 cards per deck", "No badge on shared decks", "Buy extra credit packs any time", "Everything in Free"] },
  { key: "pro", name: "Pro", forWho: "For people who present every week", monthly: 20, yearly: 200, credits: "2,500 credits every month",
    features: ["Up to 40 cards per deck", "Everything in Solo", "Email support within one business day"] },
];
