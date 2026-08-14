import { Plan, SubscriptionStatus, User } from "@prisma/client";
import type Stripe from "stripe";

export const premiumStatuses: SubscriptionStatus[] = ["trialing", "active"];

export function hasPremiumAccess(user?: Pick<User, "subscriptionStatus"> | null) {
  return Boolean(user && premiumStatuses.includes(user.subscriptionStatus));
}

export function trialDaysRemaining(trialEndsAt?: Date | null) {
  if (!trialEndsAt) return 0;
  const ms = trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function isUpgrade(from: Plan, to: Plan) {
  return from === "pro" && to === "elite";
}

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled") return "canceled";
  return "expired";
}
