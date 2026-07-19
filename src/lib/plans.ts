import { requiredEnv } from "./env";

export type BillingPlan = "pro" | "elite";

export const plans = {
  pro: {
    id: "pro",
    name: "Pro",
    price: "$14.99",
    monthlyCents: 1499,
    stripePriceId: () => requiredEnv("STRIPE_PRO_PRICE_ID"),
    features: ["Unlimited coaching", "Advanced sheet decoder", "Performance analysis", "Personalized plans"]
  },
  elite: {
    id: "elite",
    name: "Elite",
    price: "$39.99",
    monthlyCents: 3999,
    stripePriceId: () => requiredEnv("STRIPE_ELITE_PRICE_ID"),
    features: ["Everything in Pro", "Live human classes", "Priority scheduling", "Exam coaching", "Teacher messaging"]
  }
} as const;

export function planFromPriceId(priceId?: string | null): BillingPlan {
  if (priceId === plans.elite.stripePriceId()) return "elite";
  return "pro";
}

export function priceIdForPlan(plan: BillingPlan) {
  return plans[plan].stripePriceId();
}
