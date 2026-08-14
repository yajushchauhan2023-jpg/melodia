import { showToast, storage } from "./shared.js";

const instruments = [
  ["Piano", "Beginner friendly", "8-12 months", "piano-img", "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80"],
  ["Guitar", "Beginner friendly", "6-10 months", "guitar-img", "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80"],
  ["Violin", "Focused", "12-18 months", "violin-img", "https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?auto=format&fit=crop&w=800&q=80"],
  ["Drums", "Energetic", "6-9 months", "drums-img", "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=800&q=80"],
  ["Flute", "Gentle", "8-12 months", "flute-img", "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=800&q=80"],
  ["Ukulele", "Easy start", "3-6 months", "ukulele-img", "https://images.unsplash.com/photo-1519677584237-752f8853252e?auto=format&fit=crop&w=800&q=80"],
  ["Vocals", "All levels", "Ongoing", "vocals-img", "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80"],
  ["Saxophone", "Expressive", "10-14 months", "saxophone-img", "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=800&q=80"]
];

export function init() {
  const grid = document.getElementById("instrumentGrid");
  if (grid) renderInstruments(grid);

  document.addEventListener("click", (event) => {
    const startButton = event.target.closest("[data-start]");
    if (!startButton) return;
    storage.set("melodiaSelectedInstrument", startButton.dataset.start);
    showToast(`${startButton.dataset.start} learning flow opened with roadmap, tutor, and feedback.`);
    window.location.href = "tutor.html";
  });
}

function renderInstruments(grid) {
  grid.innerHTML = instruments.map(([name, difficulty, time, imageClass, imageUrl]) => `
    <article class="instrument-tile card">
      <div class="instrument-image ${imageClass}" role="img" aria-label="${name} photography">
        <img src="${imageUrl}" alt="${name}" loading="lazy" />
      </div>
      <div class="body">
        <h2>${name}</h2>
        <div class="instrument-meta"><span>${difficulty}</span><span>${time}</span></div>
        <button type="button" data-start="${name}">Start ${name}</button>
      </div>
    </article>
  `).join("");
}
