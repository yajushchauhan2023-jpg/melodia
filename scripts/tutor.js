import { showToast, storage } from "./shared.js";

const lessonConfig = {
  piano: {
    label: "Piano",
    title: "Piano fingering guide",
    items: ["C major scale", "Two-hand rhythm", "Sight-reading drill"],
    lesson: "piano"
  },
  guitar: {
    label: "Guitar",
    title: "Guitar chord placement",
    items: ["G chord shape", "Clean chord changes", "Strumming pattern"],
    lesson: "guitar"
  },
  violin: {
    label: "Violin",
    title: "Violin bowing direction",
    items: ["Open strings", "Bowing direction", "First finger guide"],
    lesson: "violin"
  },
  vocals: {
    label: "Vocals",
    title: "Vocal pitch tracker",
    items: ["Breathing warmup", "Pitch matching", "Phrase control"],
    lesson: "vocals"
  },
  voice: {
    label: "Voice",
    title: "Vocal pitch tracker",
    items: ["Breathing warmup", "Pitch matching", "Phrase control"],
    lesson: "vocals"
  },
  drums: {
    label: "Drums",
    title: "Drum rhythm control",
    items: ["Quarter-note pulse", "Basic rock groove", "Fill timing"],
    lesson: "piano"
  },
  flute: {
    label: "Flute",
    title: "Flute tone and breath guide",
    items: ["Breath support", "First notes", "Smooth note changes"],
    lesson: "vocals"
  },
  ukulele: {
    label: "Ukulele",
    title: "Ukulele chord placement",
    items: ["C chord shape", "F to G change", "Simple song pattern"],
    lesson: "guitar"
  },
  saxophone: {
    label: "Saxophone",
    title: "Saxophone tone and fingering",
    items: ["Mouthpiece tone", "First notes", "Smooth phrase control"],
    lesson: "vocals"
  }
};

export function init() {
  personalizeRoadmap();

  document.querySelectorAll(".roadmap-item[data-lesson]").forEach((button) => {
    button.addEventListener("click", () => selectLesson(button));
  });

  document.querySelectorAll(".piano button").forEach((key) => {
    key.addEventListener("click", () => {
      key.classList.add("active-key");
      setTimeout(() => key.classList.remove("active-key"), 520);
    });
  });

  document.getElementById("playExample")?.addEventListener("click", () => {
    showToast("Playback example queued with highlighted notes.");
  });

  document.getElementById("chatForm")?.addEventListener("submit", submitChat);
  document.getElementById("uploadZone")?.addEventListener("click", () => {
    showToast("Analysis complete: timing strong, pitch improving, retry measure 4.");
  });
}

function personalizeRoadmap() {
  const config = lessonConfig[getSelectedInstrumentKey()] || lessonConfig.piano;
  const roadmap = document.querySelector(".roadmap");
  const title = document.getElementById("roadmapTitle");
  if (!roadmap || !title) return;

  title.textContent = `${config.label} roadmap`;
  const buttons = config.items.map((item, index) => (
    `<button class="roadmap-item${index === 0 ? " active" : ""}" data-lesson="${config.lesson}" data-title="${config.title}">${config.label}: ${item}</button>`
  ));
  buttons.push('<button class="roadmap-item">Mini quiz</button>');
  roadmap.innerHTML = `<h2 id="roadmapTitle">${config.label} roadmap</h2>${buttons.join("")}`;
  selectLesson(roadmap.querySelector("[data-lesson]"));
}

function getSelectedInstrumentKey() {
  const saved = storage.get("melodiaSelectedInstrument") || readProfileInstrument() || "Piano";
  return saved.toLowerCase().replace(/\s+/g, "");
}

function readProfileInstrument() {
  try {
    return JSON.parse(storage.get("melodiaProfile") || "null")?.instrument;
  } catch {
    return null;
  }
}

function selectLesson(button) {
  if (!button) return;
  document.querySelectorAll(".roadmap-item").forEach((item) => item.classList.remove("active"));
  document.querySelectorAll(".lesson-visual").forEach((view) => view.classList.remove("active"));
  button.classList.add("active");
  const lesson = button.dataset.lesson;
  document.getElementById(`${lesson}Lesson`)?.classList.add("active");
  const titles = {
    piano: "Piano fingering guide",
    guitar: "Guitar chord placement",
    violin: "Violin bowing direction",
    vocals: "Vocal pitch tracker"
  };
  document.getElementById("lessonTitle").textContent = button.dataset.title || titles[lesson];
}

function submitChat(event) {
  event.preventDefault();
  const input = document.getElementById("chatText");
  const value = input.value.trim();
  if (!value) return;
  addBubble(value, "user");
  input.value = "";
  setTimeout(() => {
    addBubble("Nice goal. I’ll give you a short drill: play the tricky measure slowly three times, clap it once, then record one full pass for feedback.", "ai");
  }, 420);
}

function addBubble(text, type) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${type}`;
  bubble.textContent = text;
  const log = document.getElementById("chatLog");
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
}
