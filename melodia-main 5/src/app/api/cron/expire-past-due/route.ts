import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiredEnv } from "@/lib/env";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (token !== requiredEnv("CRON_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 7 * 86_400_000);
  const result = await prisma.user.updateMany({
    where: {
      subscriptionStatus: "past_due",
      updatedAt: { lt: cutoff }
    },
    data: {
      subscriptionStatus: "expired"
    }
  });

  return NextResponse.json({ expired: result.count });
}
