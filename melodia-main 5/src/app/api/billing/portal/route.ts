import { NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { getOrCreateBillingUser } from "@/lib/stripe-customers";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const user = await getOrCreateBillingUser();
  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`
  });

  return NextResponse.json({ url: portal.url });
}
