import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn how Melodia combines AI tutoring, sheet music decoding, live teachers, practice feedback, and progress tracking for modern music education. Start today.",
  alternates: { canonical: "/about" }
};

export default function AboutPage() {
  return (
    <main id="maincontent" className="shell">
      <section className="hero">
        <p className="eyebrow">About Melodia billing</p>
        <h1>Production-safe subscriptions for a music learning SaaS.</h1>
        <p>Stripe Checkout collects payment details, Billing manages renewals, webhooks keep PostgreSQL in sync, Clerk protects routes, and Resend handles customer lifecycle emails.</p>
      </section>
    </main>
  );
}
