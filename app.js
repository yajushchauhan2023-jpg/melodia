import {
  applyEliteLocks,
  initSharedUi,
  personalizeHome
} from "./scripts/shared.js";

const currentPage = window.location.pathname.split("/").pop() || "index.html";

const routeModules = {
  "index.html": ["./scripts/home.js"],
  "login.html": ["./scripts/auth.js"],
  "signup.html": ["./scripts/auth.js"],
  "learn.html": ["./scripts/learn.js"],
  "instruments.html": ["./scripts/instruments.js"],
  "tutor.html": ["./scripts/tutor.js"],
  "decoder.html": ["./scripts/decoder.js"],
  "pricing.html": ["./scripts/pricing.js"],
  "dashboard.html": ["./scripts/dashboard.js"],
  "teachers.html": ["./scripts/elite.js"]
};

initSharedUi(currentPage);
personalizeHome(currentPage);
applyEliteLocks();

Promise.all((routeModules[currentPage] || []).map((modulePath) => import(modulePath)))
  .then((modules) => modules.forEach((module) => module.init?.()))
  .catch(() => {
    const toast = document.getElementById("toast");
    if (toast) toast.textContent = "This page is ready, but one interaction could not load.";
  });
