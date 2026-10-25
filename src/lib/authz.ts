import { auth, currentUser } from "@clerk/nextjs/server";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }

/** Signed-in user, mirrored into our DB on first sight. Role always comes from the database. */
export async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new HttpError(401, "Sign in required");
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return existing;
  const cu = await currentUser();
  const email = cu?.emailAddresses[0]?.emailAddress;
  if (!email) throw new HttpError(400, "Account has no email");
  return prisma.user.create({ data: { id: userId, email } });
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new HttpError(403, "Not allowed");
  return user;
}
