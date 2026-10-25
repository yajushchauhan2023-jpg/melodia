import { NextResponse } from "next/server";
import { HttpError, requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const INSTRUMENTS = ["Piano", "Guitar", "Voice", "Violin", "Drums", "Music Theory"];
const FORMATS = ["Online", "In person"];
const str = (v: unknown, min: number, max: number) => typeof v === "string" && v.trim().length >= min && v.length <= max ? v.trim() : null;
const list = (v: unknown, allowed?: string[]) => Array.isArray(v) && v.length > 0 && v.length <= 10 && v.every(x => typeof x === "string" && (!allowed || allowed.includes(x))) ? (v as string[]) : null;

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const b = await req.json().catch(() => null);
    const data = {
      displayName: str(b?.displayName, 2, 80), bio: str(b?.bio, 20, 1200), qualifications: str(b?.qualifications, 5, 1000),
      instruments: list(b?.instruments, INSTRUMENTS), formats: list(b?.formats, FORMATS), languages: list(b?.languages),
      hourlyPrice: Number.isInteger(b?.hourlyPrice) && b.hourlyPrice >= 200 && b.hourlyPrice <= 50000 ? (b.hourlyPrice as number) : null,
      yearsExperience: Number.isInteger(b?.yearsExperience) && b.yearsExperience >= 0 && b.yearsExperience <= 70 ? (b.yearsExperience as number) : null,
    };
    if (Object.values(data).some(v => v === null)) return NextResponse.json({ error: "Please check the form and try again" }, { status: 400 });
    const clean = data as Required<{ [K in keyof typeof data]: NonNullable<(typeof data)[K]> }>;

    const existing = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });
    if (existing && existing.status !== "rejected") return NextResponse.json({ error: `You already have an application (${existing.status})` }, { status: 409 });
    // Always created as pending: verification is an explicit admin decision.
    const profile = existing
      ? await prisma.teacherProfile.update({ where: { id: existing.id }, data: { ...clean, status: "pending", reviewNote: null, reviewedAt: null } })
      : await prisma.teacherProfile.create({ data: { ...clean, userId: user.id, status: "pending" } });
    return NextResponse.json({ status: profile.status }, { status: 201 });
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("teacher apply failed"); // no personal data in logs
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
