import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [user, clerkUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    currentUser()
  ]);

  const hasLessonPlan = Boolean(user?.instrument && user.level && user.goal && user.weeklyTime);

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Profile</p>
        <h1>Your profile</h1>
        <p>Everything Melodia knows about how you learn.</p>
      </section>
      <section className="dashboard-grid">
        <div className="card">
          <h3>Account</h3>
          <p>{clerkUser?.primaryEmailAddress?.emailAddress ?? user?.email ?? "—"}</p>
        </div>
        <div className="card">
          <h3>Learning profile</h3>
          {hasLessonPlan ? (
            <>
              <p>Instrument: <strong>{user!.instrument}</strong></p>
              <p>Level: <strong>{user!.level}</strong></p>
              <p>Goal: <strong>{user!.goal}</strong></p>
              <p>Weekly time: <strong>{user!.weeklyTime}</strong></p>
            </>
          ) : (
            <p>You haven't set up a lesson plan yet.</p>
          )}
        </div>
      </section>
      <div className="actions">
        <a className="button" href="/onboarding">{hasLessonPlan ? "Update lesson plan" : "Build my lesson plan"}</a>
        <a className="button secondary" href="/tutor">Go to Coach</a>
      </div>
    </main>
  );
}
