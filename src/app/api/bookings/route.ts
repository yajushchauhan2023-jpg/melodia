import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { splitPrice } from "@/lib/commission";

// Creates a pending booking. Authorisation, validation and the price all come from the server.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { teacherId, startsAt, format, idempotencyKey } = body ?? {};
  const start = new Date(startsAt);
  if (typeof teacherId !== "string" || typeof format !== "string" || typeof idempotencyKey !== "string" || idempotencyKey.length < 8 || isNaN(+start)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (+start < Date.now() + 60 * 60 * 1000) {
    return NextResponse.json({ error: "Lessons must be booked at least 1 hour ahead" }, { status: 400 });
  }

  const teacher = await prisma.teacherProfile.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.status !== "approved" || !teacher.formats.includes(format)) {
    return NextResponse.json({ error: "Teacher unavailable" }, { status: 404 });
  }

  // Slot must fall inside the teacher's declared availability (teacher-local time).
  const local = new Date(start.toLocaleString("en-US", { timeZone: teacher.timezone }));
  const mins = local.getHours() * 60 + local.getMinutes();
  const slots = await prisma.availability.findMany({ where: { teacherId, weekday: local.getDay() } });
  if (!slots.some(a => mins >= a.startMin && mins + 60 <= a.endMin)) {
    return NextResponse.json({ error: "Time not available" }, { status: 409 });
  }

  const money = splitPrice(teacher.hourlyPrice);
  try {
    const booking = await prisma.booking.create({
      data: { teacherId, studentId: userId, startsAt: start, format, idempotencyKey, ...money },
    });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const existing = await prisma.booking.findUnique({ where: { idempotencyKey } });
      if (existing && existing.studentId === userId) return NextResponse.json({ booking: existing }); // safe retry
      return NextResponse.json({ error: "That time was just taken" }, { status: 409 });
    }
    throw e;
  }
}
