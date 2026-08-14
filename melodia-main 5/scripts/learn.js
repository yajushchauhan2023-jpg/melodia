import { confetti, showToast } from "./shared.js";

const state = {
  step: 0,
  instrument: "",
  level: "",
  goal: "",
  time: ""
};

export function init() {
  document.querySelectorAll("[data-choice-group] button").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.closest("[data-choice-group]");
      group.querySelectorAll("button").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      state[group.dataset.choiceGroup] = button.textContent;
    });
  });

  document.getElementById("nextStep")?.addEventListener("click", advanceStep);
}

function advanceStep() {
  const steps = [...document.querySelectorAll(".step")];
  const dots = [...document.querySelectorAll(".step-dots span")];
  const nextStep = document.getElementById("nextStep");
  const required = ["instrument", "level", "goal", "time"][state.step];
  if (!state[required]) {
    showToast("Choose an option to continue.");
    return;
  }

  if (state.step < steps.length - 1) {
    state.step += 1;
    steps.forEach((step, index) => step.classList.toggle("active", index === state.step));
    dots.forEach((dot, index) => dot.classList.toggle("on", index === state.step));
    nextStep.textContent = state.step === steps.length - 1 ? "Generate Path" : "Next";
    return;
  }

  document.getElementById("learningPath").innerHTML = `
    <span class="path-dot"></span>
    <div>
      <strong>${state.level} ${state.instrument} path for ${state.goal}</strong>
      <small>${state.time} weekly plan: two guided lessons, one feedback checkpoint, a mini quiz, and a song milestone.</small>
    </div>
  `;
  confetti();
  showToast("Your custom Melodia path is ready.");
}
