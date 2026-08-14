import { prisma } from "./prisma";
import { sendEmail } from "./email";

export async function sendLifecycleEmailOnce(userId: string, email: string, type: string, subject: string, html: string) {
  const existing = await prisma.emailLog.findUnique({
    where: { userId_type: { userId, type } }
  });
  if (existing) return { skipped: true };

  await sendEmail(email, subject, html);
  await prisma.emailLog.create({
    data: { userId, type }
  });

  return { sent: true };
}
