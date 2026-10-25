import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { appUrl, requiredEnv } from "@/lib/env";
import { emails } from "@/emails/templates";
import { planFromPriceId } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendLifecycleEmailOnce } from "@/lib/lifecycle-email";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, requiredEnv("STRIPE_WEBHOOK_SECRET"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object);
      break;
    case "customer.subscription.trial_will_end":
      await handleTrialWillEnd(event.data.object);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.customer || !session.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
  const clerkUserId = session.metadata?.clerkUserId || subscription.metadata.clerkUserId;
  if (!clerkUserId) return;

  const email = session.customer_details?.email;
  const priceId = subscription.items.data[0]?.price.id;
  const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

  const user = await prisma.user.upsert({
    where: { id: clerkUserId },
    create: {
      id: clerkUserId,
      email: email || `${clerkUserId}@unknown.local`,
      stripeCustomerId: String(session.customer),
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: "trialing",
      trialEndsAt,
      currentPlan: planFromPriceId(priceId)
    },
    update: {
      email: email || undefined,
      stripeCustomerId: String(session.customer),
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: "trialing",
      trialEndsAt,
      currentPlan: planFromPriceId(priceId),
      canceledAt: null
    }
  });

  if (user.email) {
    const template = emails.welcome();
    await sendLifecycleEmailOnce(user.id, user.email, "welcome_day_1", template.subject, template.html);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  const status = mapStripeStatus(subscription.status);
  const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

  await prisma.user.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      subscriptionStatus: status,
      trialEndsAt,
      currentPlan: planFromPriceId(priceId),
      canceledAt: subscription.cancel_at_period_end ? new Date() : null
    }
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subscription.id } });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "canceled",
      canceledAt: new Date()
    }
  });

  const template = emails.canceled();
  await sendLifecycleEmailOnce(user.id, user.email, "subscription_canceled", template.subject, template.html);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subscriptionId } });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "active" }
  });

  const template = emails.paymentSuccess();
  await sendLifecycleEmailOnce(user.id, user.email, `payment_success_${invoice.id}`, template.subject, template.html);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subscriptionId } });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "past_due" }
  });

  const template = emails.paymentFailed(appUrl);
  await sendLifecycleEmailOnce(user.id, user.email, `payment_failed_${invoice.id}`, template.subject, template.html);
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subscription.id } });
  if (!user) return;

  const template = emails.trialEndingSoon(3, appUrl);
  await sendLifecycleEmailOnce(user.id, user.email, "trial_ending_stripe_3_days", template.subject, template.html);
}

function mapStripeStatus(status: Stripe.Subscription.Status) {
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled") return "canceled";
  return "expired";
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const invoiceWithSubscription = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
  const subscription = invoiceWithSubscription.subscription;
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}
