import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/");
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { teacherProfile: true } });
  return (
    <main className="shell"><section className="hero"><p className="eyebrow">Profile</p><h1>Your account</h1></section>
      <div className="card"><p>Email: <strong>{user?.email}</strong></p><p>Role: <strong>{user?.role ?? "student"}</strong></p>
        {user?.teacherProfile && <p>Teacher application: <strong>{user.teacherProfile.status}</strong></p>}</div></main>
  );
}
