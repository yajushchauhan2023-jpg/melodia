import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { stripe } from "./stripe";

export async function getOrCreateBillingUser() {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) throw new Error("Unauthorized");

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("Clerk user has no email address");

  const existing = await prisma.user.findUnique({ where: { id: clerkUser.id } });
  if (existing?.stripeCustomerId) return existing;

  const customer = await stripe.customers.create({
    email,
    name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || undefined,
    metadata: { clerkUserId: clerkUser.id }
  });

  return prisma.user.upsert({
    where: { id: clerkUser.id },
    create: {
      id: clerkUser.id,
      email,
      stripeCustomerId: customer.id
    },
    update: {
      email,
      stripeCustomerId: customer.id
    }
  });
}
