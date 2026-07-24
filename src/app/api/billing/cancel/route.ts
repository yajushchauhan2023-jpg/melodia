import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { mapStripeStatus } from "@/lib/subscriptions";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: true
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      canceledAt: new Date(),
      subscriptionStatus: mapStripeStatus(subscription.status)
    }
  });

  const periodEnd = subscription.items.data[0]?.current_period_end;

  return NextResponse.json({
    ok: true,
    accessEndsAt: periodEnd ? new Date(periodEnd * 1000).toISOString() : null
  });
}
