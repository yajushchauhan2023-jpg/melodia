"use client";

import { useState } from "react";
import type { BillingPlan } from "@/lib/plans";

export function CheckoutButton({ plan, children }: { plan: BillingPlan; children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) window.location.href = data.url;
    else {
      setLoading(false);
      alert(data.error || "Could not start checkout");
    }
  }

  return (
    <button className="button" disabled={loading} onClick={startCheckout}>
      {loading ? "Opening checkout..." : children}
    </button>
  );
}
