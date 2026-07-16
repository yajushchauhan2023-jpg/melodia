import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { INSTRUMENTS, LEVELS, GOALS, WEEKLY_TIMES } from "@/lib/curriculum";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { instrument, level, goal, weeklyTime } = body ?? {};

  if (
    !INSTRUMENTS.includes(instrument) ||
    !LEVELS.includes(level) ||
    !GOALS.includes(goal) ||
    !WEEKLY_TIMES.includes(weeklyTime)
  ) {
    return NextResponse.json({ error: "Invalid lesson plan answers" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        instrument,
        level,
        goal,
        weeklyTime,
        lessonIndex: 0,
        lessonPlanUpdatedAt: new Date()
      }
    });
  } catch {
    return NextResponse.json({ error: "Your account isn't fully set up yet. Please try again in a moment." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
