"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const ACTIONS = { approve: "approved", reject: "rejected", suspend: "suspended" } as const;

// Role is re-checked on the server for every decision; hiding the buttons is not the control.
export async function reviewApplication(formData: FormData) {
  const admin = await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "") as keyof typeof ACTIONS;
  const note = String(formData.get("note") ?? "").slice(0, 500) || null;
  if (!id || !(action in ACTIONS)) throw new Error("Invalid request");
  const status = ACTIONS[action];
  const profile = await prisma.teacherProfile.findUnique({ where: { id } });
  if (!profile) throw new Error("Not found");
  await prisma.$transaction([
    prisma.teacherProfile.update({ where: { id }, data: { status, reviewNote: note, reviewedAt: new Date(), reviewedBy: admin.id } }),
    // Only approved teachers hold the teacher role; rejection/suspension removes it.
    prisma.user.update({ where: { id: profile.userId }, data: { role: status === "approved" ? "teacher" : "student" } }),
  ]);
  revalidatePath("/admin");
}
