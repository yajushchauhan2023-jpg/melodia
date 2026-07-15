import { BillingActions } from "@/components/billing/BillingActions";

export default function PaymentFailedPage() {
  return (
    <main className="shell">
      <section className="hero notice card">
        <p className="eyebrow">Payment failed</p>
        <h1>Your music journey is paused.</h1>
        <p>Update your payment method to restore premium access instantly. We keep your progress, lessons, and achievements ready for you.</p>
        <BillingActions currentPlan="pro" />
      </section>
    </main>
  );
}
