import type { Metadata } from "next";
import { BillingActions } from "@/components/billing/BillingActions";

export const metadata: Metadata = {
  title: "Payment Failed",
  description: "Update Melodia billing securely to restore AI lessons, sheet decoding, teacher tools, saved progress, practice feedback, and premium access today.",
  alternates: { canonical: "/payment-failed" }
};

export default function PaymentFailedPage() {
  return (
    <main id="maincontent" className="shell">
      <section className="hero notice card">
        <p className="eyebrow">Payment failed</p>
        <h1>Your music journey is paused.</h1>
        <p>Update your payment method to restore premium access instantly. We keep your progress, lessons, and achievements ready for you.</p>
        <BillingActions currentPlan="pro" />
      </section>
    </main>
  );
}
