import { applyEliteLocks, showToast, storage } from "./shared.js";

export function init() {
  document.querySelectorAll("[data-billing-action]").forEach((button) => {
    button.addEventListener("click", () => runBillingAction(button.dataset.billingAction));
  });
}

function runBillingAction(action) {
  const status = document.getElementById("billingStatus");
  const statusText = document.getElementById("statusText");
  const accessText = document.getElementById("accessText");
  const message = document.getElementById("billingMessage");
  const plan = document.getElementById("dashboardPlan");
  const price = document.getElementById("monthlyPrice");

  if (action === "portal") {
    message.textContent = "Stripe Billing Portal opened: update card, download invoices, or manage subscription.";
    showToast("Opening billing portal.");
  }

  if (action === "upgrade") {
    plan.textContent = "Elite";
    price.textContent = "$39.99";
    storage.set("melodiaSubscription", "elite");
    applyEliteLocks();
    message.textContent = "Pro to Elite upgrades are prorated instantly through Stripe.";
    showToast("Plan upgraded to Elite.");
  }

  if (action === "cancel") {
    storage.set("melodiaSubscription", "none");
    status.textContent = "canceled";
    status.className = "billing-status canceled";
    statusText.textContent = "Canceled";
    accessText.textContent = "Unlocked until trial ends";
    message.textContent = "Trial canceled. No charge will happen after day 30.";
    showToast("Trial canceled. No charge scheduled.");
  }
}
