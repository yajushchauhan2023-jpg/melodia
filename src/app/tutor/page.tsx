import type { Metadata } from "next";
import { requirePremiumAccess } from "@/lib/access";

export const metadata: Metadata = {
  title: "AI Tutor",
  description: "Practice with the Melodia AI tutor using interactive lessons, warm chat guidance, custom drills, quizzes, mistake correction, and helpful feedback. Start today.",
  alternates: { canonical: "/tutor" }
};

export default async function TutorPage() {
  await requirePremiumAccess();

  return (
    <main id="maincontent" className="shell">
      <section className="hero">
        <p className="eyebrow">Premium AI tutor</p>
        <h1>Your personal Melodia tutor is unlocked.</h1>
        <p>This premium route is available only while the subscription status is trialing or active.</p>
      </section>
    </main>
  );
}
