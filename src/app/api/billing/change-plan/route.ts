import { NextRequest, NextResponse } from "next/server";
import { Plan } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { isUpgrade } from "@/lib/subscriptions";
import { priceIdForPlan, type BillingPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetPlan = (body.plan === "elite" ? "elite" : "pro") as BillingPlan;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
  const item = subscription.items.data[0];
  if (!item) return NextResponse.json({ error: "Subscription has no items" }, { status: 400 });

  const targetPrice = priceIdForPlan(targetPlan);
  const currentPlan = user.currentPlan as Plan;
  const upgradeNow = isUpgrade(currentPlan, targetPlan);

  const updated = await stripe.subscriptions.update(subscription.id, {
    items: [{ id: item.id, price: targetPrice }],
    proration_behavior: upgradeNow ? "always_invoice" : "none",
    billing_cycle_anchor: upgradeNow ? "now" : undefined,
    metadata: {
      clerkUserId: user.id,
      plan: targetPlan
    }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentPlan: targetPlan,
      stripeSubscriptionId: updated.id
    }
  });

  return NextResponse.json({
    ok: true,
    applied: upgradeNow ? "immediate_prorated_upgrade" : "downgrade_next_cycle"
  });
}
