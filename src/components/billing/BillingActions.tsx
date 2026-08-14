"use client";

import { useState } from "react";
import type { BillingPlan } from "@/lib/plans";

async function postJson(endpoint: string, body?: unknown) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  return (await res.json()) as { url?: string; error?: string; ok?: boolean; accessEndsAt?: string; applied?: string };
}

export function BillingActions({ currentPlan }: { currentPlan: BillingPlan }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const targetPlan = currentPlan === "elite" ? "pro" : "elite";

  async function handlePortal() {
    if (loading) return;
    setLoading("portal");
    setError(null);
    setConfirmation(null);
    const data = await postJson("/api/billing/portal");
    if (data.url) window.location.href = data.url;
    else {
      setLoading(null);
      setError(data.error || "Could not open the billing portal.");
    }
  }

  async function handleChangePlan() {
    if (loading) return;
    setLoading("change");
    setError(null);
    setConfirmation(null);
    const data = await postJson("/api/billing/change-plan", { plan: targetPlan });
    setLoading(null);
    if (data.error) {
      setError(data.error);
      return;
    }
    setConfirmation(
      data.applied === "immediate_prorated_upgrade"
        ? `Plan updated to ${targetPlan === "elite" ? "Elite" : "Pro"}. Your new plan is active now.`
        : `Plan updated. You'll move to ${targetPlan === "elite" ? "Elite" : "Pro"} at your next billing cycle.`
    );
  }

  async function handleCancel() {
    if (loading) return;
    setLoading("cancel");
    setError(null);
    setConfirmation(null);
    const data = await postJson("/api/billing/cancel");
    setLoading(null);
    if (data.error) {
      setError(data.error);
      return;
    }
    const endDate = data.accessEndsAt
      ? new Date(data.accessEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : null;
    setConfirmation(endDate ? `Your subscription will end on ${endDate}. You'll keep access until then.` : "Your subscription has been canceled.");
  }

  return (
    <div>
      <div className="actions">
        <button className="button secondary" disabled={loading === "portal"} onClick={handlePortal}>
          {loading === "portal" ? "Opening..." : "Manage billing portal"}
        </button>
        <button className="button" disabled={loading === "change"} onClick={handleChangePlan}>
          {loading === "change" ? "Updating..." : currentPlan === "elite" ? "Downgrade to Pro" : "Upgrade to Elite"}
        </button>
        <button className="button danger" disabled={loading === "cancel"} onClick={handleCancel}>
          {loading === "cancel" ? "Canceling..." : "Cancel anytime"}
        </button>
      </div>
      {error && <p className="inline-message error">{error}</p>}
      {confirmation && <p className="inline-message success">{confirmation}</p>}
    </div>
  );
}
