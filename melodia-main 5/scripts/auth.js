import { handleAuthSubmit, showToast, storage } from "./shared.js";

export function init() {
  document.addEventListener("submit", (event) => {
    if (event.defaultPrevented) return;
    if (event.target?.id === "loginForm") handleAuthSubmit(event, "login");
    if (event.target?.id === "signupForm") handleAuthSubmit(event, "signup");
    if (event.target?.id === "questionnaireForm") saveQuestionnaire(event);
  });
}

function saveQuestionnaire(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const profile = {
    instrument: formData.get("instrument"),
    level: formData.get("level"),
    purpose: formData.get("purpose"),
    time: formData.get("time"),
    style: formData.get("style")
  };
  storage.set("melodiaProfile", JSON.stringify(profile));
  storage.set("melodiaSelectedInstrument", profile.instrument);
  storage.set("melodiaOnboarded", "true");
  showToast("Your Melodia home page is ready.");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 700);
}
