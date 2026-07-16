import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const hasExistingProfile = Boolean(user?.instrument && user.level && user.goal && user.weeklyTime);

  return (
    <main className="shell">
      <section className="hero onboarding-hero">
        <p className="eyebrow">{hasExistingProfile ? "Update your plan" : "Onboarding"}</p>
        <h1>{hasExistingProfile ? "Update your lesson plan" : "Let's build your lesson plan"}</h1>
        <p>Answer four quick questions and Melodia builds your personal roadmap.</p>
      </section>
      <section>
        <OnboardingWizard hasExistingProfile={hasExistingProfile} />
      </section>
    </main>
  );
}
