import { NextRequest, NextResponse } from "next/server";
import { appUrl, requiredEnv } from "@/lib/env";
import { emails } from "@/emails/templates";
import { sendLifecycleEmailOnce } from "@/lib/lifecycle-email";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (token !== requiredEnv("CRON_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const users = await prisma.user.findMany({
    where: {
      subscriptionStatus: "trialing",
      trialEndsAt: { not: null }
    }
  });

  let sent = 0;
  for (const user of users) {
    if (!user.trialEndsAt) continue;
    const daysLeft = Math.ceil((user.trialEndsAt.getTime() - now) / 86_400_000);

    if (daysLeft === 5) {
      const template = emails.trialEndingSoon(5, appUrl);
      const result = await sendLifecycleEmailOnce(user.id, user.email, "trial_day_25", template.subject, template.html);
      if (result.sent) sent += 1;
    }

    if (daysLeft === 1) {
      const template = emails.trialEndingSoon(1, appUrl);
      const result = await sendLifecycleEmailOnce(user.id, user.email, "trial_day_29", template.subject, template.html);
      if (result.sent) sent += 1;
    }
  }

  return NextResponse.json({ sent });
}
