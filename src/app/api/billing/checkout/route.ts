import { NextRequest, NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { priceIdForPlan, type BillingPlan } from "@/lib/plans";
import { getOrCreateBillingUser } from "@/lib/stripe-customers";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const plan = (body.plan === "elite" ? "elite" : "pro") as BillingPlan;
  const user = await getOrCreateBillingUser();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user.stripeCustomerId!,
    line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
    payment_method_collection: "always",
    subscription_data: {
      trial_period_days: 30,
      metadata: {
        clerkUserId: user.id,
        plan
      }
    },
    metadata: {
      clerkUserId: user.id,
      plan
    },
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    allow_promotion_codes: true
  });

  return NextResponse.json({ url: session.url });
}
