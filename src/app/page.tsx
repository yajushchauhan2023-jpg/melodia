import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Learn music smarter with Melodia, your personal AI tutor for instruments, sheet music decoding, practice feedback, progress tracking, and live teachers online.",
  alternates: { canonical: "/" }
};

export default function HomePage() {
  return (
    <main id="maincontent" className="shell">
      <section className="hero">
        <p className="eyebrow">Stripe Billing system</p>
        <h1>Melodia subscriptions are ready for a 30-day premium trial.</h1>
        <p>Users collect a card upfront, receive full premium access for 30 days, then convert automatically unless they cancel.</p>
        <div className="actions">
          <a className="button" href="/pricing">View plans</a>
          <a className="button secondary" href="/dashboard/billing">Open billing dashboard</a>
        </div>
      </section>
    </main>
  );
}
