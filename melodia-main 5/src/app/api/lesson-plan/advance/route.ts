import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getLessonPlan } from "@/lib/curriculum";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.instrument || !user.level || !user.goal) {
    return NextResponse.json({ error: "No lesson plan yet" }, { status: 400 });
  }

  const plan = getLessonPlan(user.instrument, user.level, user.goal);
  const nextIndex = Math.min(user.lessonIndex + 1, plan.length - 1);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { lessonIndex: nextIndex }
  });

  return NextResponse.json({ ok: true, lessonIndex: updated.lessonIndex });
}
