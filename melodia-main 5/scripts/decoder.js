import { confetti, showToast } from "./shared.js";

export function init() {
  document.getElementById("decodeButton")?.addEventListener("click", () => {
    const scanBox = document.getElementById("scanBox");
    scanBox.classList.add("scanning");
    showToast("Reading your music...");
    setTimeout(() => {
      scanBox.classList.remove("scanning");
      document.getElementById("letterNotes").textContent = "C D E G | A G E C";
      showToast("Decoded into notes, playback, tempo, adaptation, and fingering.");
      confetti();
    }, 1600);
  });

  document.getElementById("tempo")?.addEventListener("input", (event) => {
    document.getElementById("tempoValue").textContent = `${event.target.value} BPM`;
  });
}
