"use client";

import { useState } from "react";
import type { BillingPlan } from "@/lib/plans";

async function openUrl(endpoint: string, body?: unknown) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (data.url) window.location.href = data.url;
  if (data.error) alert(data.error);
}

export function BillingActions({ currentPlan }: { currentPlan: BillingPlan }) {
  const [loading, setLoading] = useState<string | null>(null);
  const targetPlan = currentPlan === "elite" ? "pro" : "elite";

  async function run(name: string, action: () => Promise<void>) {
    setLoading(name);
    await action();
    setLoading(null);
  }

  return (
    <div className="actions">
      <button className="button secondary" disabled={loading === "portal"} onClick={() => run("portal", () => openUrl("/api/billing/portal"))}>
        Manage billing portal
      </button>
      <button className="button" disabled={loading === "change"} onClick={() => run("change", () => openUrl("/api/billing/change-plan", { plan: targetPlan }))}>
        {currentPlan === "elite" ? "Downgrade to Pro" : "Upgrade to Elite"}
      </button>
      <button className="button danger" disabled={loading === "cancel"} onClick={() => run("cancel", () => openUrl("/api/billing/cancel"))}>
        Cancel anytime
      </button>
    </div>
  );
}
