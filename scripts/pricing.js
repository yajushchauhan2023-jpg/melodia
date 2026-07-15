import { showToast, storage } from "./shared.js";

export function init() {
  document.querySelectorAll("[data-checkout-plan]").forEach((button) => {
    button.addEventListener("click", () => selectPlan(button));
  });

  document.getElementById("completeCheckout")?.addEventListener("click", startTrial);
}

function selectPlan(button) {
  const plan = button.dataset.checkoutPlan === "elite" ? "Elite" : "Pro";
  const price = plan === "Elite" ? "$39.99/mo after trial" : "$14.99/mo after trial";
  document.getElementById("checkoutTitle").textContent = `${plan} trial checkout`;
  document.getElementById("checkoutCopy").textContent = "Secure checkout collects your payment method, charges $0 today, and starts monthly billing after 30 days unless canceled.";
  document.getElementById("checkoutAmount").textContent = "$0 today";
  document.getElementById("completeCheckout").textContent = `Start ${plan} Trial`;
  document.getElementById("completeCheckout").dataset.plan = plan;
  showToast(`${plan} selected: ${price}.`);
  document.getElementById("checkoutPanel").scrollIntoView({ behavior: "smooth" });
}

function startTrial() {
  const completeCheckout = document.getElementById("completeCheckout");
  const plan = completeCheckout.dataset.plan || "Pro";
  storage.set("melodiaLoggedIn", "true");
  storage.set("melodiaSubscription", plan.toLowerCase() === "elite" ? "elite" : "trial");
  showToast(`${plan} trial started. Redirecting to billing dashboard...`);
  setTimeout(() => {
    window.location.href = `dashboard.html?trial=${plan.toLowerCase()}`;
  }, 900);
}
