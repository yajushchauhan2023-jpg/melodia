import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { hasPremiumAccess } from "./subscriptions";

export async function requirePremiumAccess() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!hasPremiumAccess(user)) redirect("/upgrade");

  return user;
}
