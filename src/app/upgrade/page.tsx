import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upgrade",
  description: "Choose a Melodia plan to restore AI lessons, sheet music decoding, teacher tools, progress tracking, practice feedback, and premium access today.",
  alternates: { canonical: "/upgrade" }
};

export default function UpgradePage() {
  return (
    <main id="maincontent" className="shell">
      <section className="hero">
        <p className="eyebrow">Premium required</p>
        <h1>Upgrade to continue your music journey.</h1>
        <p>Your premium access is paused. Choose a plan to restore lessons, sheet decoding, AI feedback, and teacher tools.</p>
        <a className="button" href="/pricing">View plans</a>
      </section>
    </main>
  );
}
