import type { Metadata } from "next";
import { plans } from "@/lib/plans";
import { CheckoutButton } from "@/components/billing/CheckoutButton";

export const metadata: Metadata = {
  title: "Plans and Free Trial",
  description: "Compare Melodia Free Trial, Pro, and Elite plans with 30 days free, secure billing, AI lessons, sheet decoding, feedback, and teacher support. Start today.",
  alternates: { canonical: "/pricing" }
};

export default function PricingPage() {
  return (
    <main id="maincontent" className="shell">
      <section className="hero">
        <p className="eyebrow">Subscription</p>
        <h1>Start with 30 days completely free.</h1>
        <p>Choose a plan, add your payment method, and keep premium access after your trial unless you cancel.</p>
      </section>
      <section className="grid pricing-grid">
        <article className="card">
          <span className="badge">30-day trial</span>
          <h2>Free Trial</h2>
          <div className="price">$0</div>
          <p>Full premium access for 30 days. Requires a card. Cancel during trial and you will not be charged.</p>
        </article>
        {Object.values(plans).map((plan) => (
          <article className="card" key={plan.id}>
            {plan.id === "elite" && <span className="badge">Best for live coaching</span>}
            <h2>{plan.name}</h2>
            <div className="price">{plan.price}</div>
            <p>Monthly after the 30-day free trial.</p>
            <ul className="features">
              {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
            <CheckoutButton plan={plan.id}>Start {plan.name} trial</CheckoutButton>
          </article>
        ))}
      </section>
    </main>
  );
}
