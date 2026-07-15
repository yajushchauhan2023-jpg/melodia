import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Create a personalized Melodia learning path by choosing your instrument, skill level, goals, and weekly practice time for focused music progress. Start today.",
  alternates: { canonical: "/onboarding" }
};

export default function OnboardingPage() {
  return (
    <main id="maincontent" className="shell">
      <section className="hero">
        <p className="eyebrow">Onboarding</p>
        <h1>Your trial is active. Let’s build your first music path.</h1>
        <p>This is where Melodia asks for instrument, level, goal, and weekly practice time after checkout succeeds.</p>
        <a className="button" href="/dashboard">Continue to dashboard</a>
      </section>
    </main>
  );
}
