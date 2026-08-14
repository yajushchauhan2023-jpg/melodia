"use client";

export default function BillingError({ reset }: { reset: () => void }) {
  return (
    <main className="shell">
      <section className="hero notice card">
        <p className="eyebrow">Billing unavailable</p>
        <h1>We could not load your billing details.</h1>
        <p>Please try again. If the issue continues, the billing portal can still be opened after your account syncs.</p>
        <button className="button" onClick={reset}>Try again</button>
      </section>
    </main>
  );
}
