import { requirePremiumAccess } from "@/lib/access";

export default async function TutorPage() {
  await requirePremiumAccess();

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Premium AI tutor</p>
        <h1>Your personal Melodia tutor is unlocked.</h1>
        <p>This premium route is available only while the subscription status is trialing or active.</p>
      </section>
    </main>
  );
}
