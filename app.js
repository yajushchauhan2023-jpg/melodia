const currentPage = window.location.pathname.split("/").pop() || "index.html";
const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      document.documentElement.dataset[key] = value;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      delete document.documentElement.dataset[key];
    }
  }
};
const isLoggedIn = () => storage.get("melodiaLoggedIn") === "true";
const getSubscription = () => storage.get("melodiaSubscription") || "none";
const hasEliteAccess = () => ["trial", "elite"].includes(getSubscription());

document.addEventListener("submit", (event) => {
  if (event.defaultPrevented) return;
  if (event.target?.id === "loginForm") {
    handleAuthSubmit(event, "login");
  }
  if (event.target?.id === "signupForm") {
    handleAuthSubmit(event, "signup");
  }
});

const notes = ["♪", "♬", "♩", "♫"];
const notesField = document.querySelector(".notes-field");
const state = {
  step: 0,
  instrument: "",
  level: "",
  goal: "",
  time: ""
};

const mockBackend = {
  stack: {
    frontend: "Next.js",
    backend: "Node.js",
    database: "PostgreSQL",
    auth: "Clerk",
    payments: "Stripe",
    storage: "Cloudinary",
    realtime: "WebSockets",
    audio: "TensorFlow audio models",
    decoder: "OCR + symbolic music parsing",
    tutor: "LLM orchestration with coaching memory",
    scheduling: "Calendar integration",
    video: "LiveKit"
  },
  instruments: [
    ["Piano", "Beginner friendly", "8-12 months", "piano-img"],
    ["Guitar", "Beginner friendly", "6-10 months", "guitar-img"],
    ["Violin", "Focused", "12-18 months", "violin-img"],
    ["Drums", "Energetic", "6-9 months", "drums-img"],
    ["Flute", "Gentle", "8-12 months", "flute-img"],
    ["Ukulele", "Easy start", "3-6 months", "ukulele-img"],
    ["Vocals", "All levels", "Ongoing", "vocals-img"],
    ["Saxophone", "Expressive", "10-14 months", "saxophone-img"]
  ]
};

if (notesField) {
  for (let index = 0; index < 18; index += 1) {
    const note = document.createElement("span");
    note.className = "floating-note";
    note.textContent = notes[index % notes.length];
    note.style.left = `${Math.random() * 100}%`;
    note.style.top = `${Math.random() * 100}%`;
    note.style.setProperty("--speed", `${4 + Math.random() * 5}s`);
    notesField.appendChild(note);
  }
}

updateSessionChrome();
personalizeHome();
applyEliteLocks();

window.addEventListener("scroll", () => {
  document.body.classList.toggle("scrolled", window.scrollY > 12);
});

window.addEventListener("pointermove", (event) => {
  const x = (event.clientX / window.innerWidth - 0.5) * 18;
  const y = (event.clientY / window.innerHeight - 0.5) * 18;
  document.querySelectorAll(".floating-note").forEach((note, index) => {
    const strength = (index % 4) + 1;
    note.style.setProperty("--mx", `${x * strength * 0.1}px`);
    note.style.setProperty("--my", `${y * strength * 0.1}px`);
  });
});

document.addEventListener("click", (event) => {
  const eliteTarget = event.target.closest("[data-elite-service]");
  if (eliteTarget && !hasEliteAccess()) {
    event.preventDefault();
    showToast("Elite feature locked. Start a free trial or choose Elite to unlock it.");
    setTimeout(() => {
      window.location.href = "pricing.html";
    }, 700);
    return;
  }

  const startButton = event.target.closest("[data-start]");
  if (!startButton) return;
  state.instrument = startButton.dataset.start;
  showToast(`${state.instrument} learning flow opened with roadmap, coach, and feedback.`);
  window.location.href = "tutor.html";
});

document.querySelectorAll(".login-btn").forEach((button) => {
  button.addEventListener("click", () => {
    window.location.href = "login.html";
  });
});

document.querySelectorAll(".profile-trigger").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const dropdown = trigger.closest(".profile-menu")?.querySelector(".profile-dropdown");
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains("open");
    document.querySelectorAll(".profile-dropdown.open").forEach((open) => open.classList.remove("open"));
    document.querySelectorAll(".profile-trigger[aria-expanded='true']").forEach((open) => open.setAttribute("aria-expanded", "false"));
    if (!isOpen) {
      dropdown.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
    }
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".profile-menu")) return;
  document.querySelectorAll(".profile-dropdown.open").forEach((open) => open.classList.remove("open"));
  document.querySelectorAll(".profile-trigger[aria-expanded='true']").forEach((open) => open.setAttribute("aria-expanded", "false"));
});

document.querySelectorAll(".logout-btn").forEach((button) => {
  button.addEventListener("click", () => {
    storage.remove("melodiaLoggedIn");
    showToast("Logged out.");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 500);
  });
});

const loginForm = document.getElementById("loginForm");
if (loginForm) loginForm.addEventListener("submit", (event) => {
  handleAuthSubmit(event, "login");
});

const signupForm = document.getElementById("signupForm");
if (signupForm) signupForm.addEventListener("submit", (event) => {
  handleAuthSubmit(event, "signup");
});

const questionnaireForm = document.getElementById("questionnaireForm");
if (questionnaireForm) questionnaireForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(questionnaireForm);
  const profile = {
    instrument: formData.get("instrument"),
    level: formData.get("level"),
    purpose: formData.get("purpose"),
    time: formData.get("time"),
    style: formData.get("style")
  };
  storage.set("melodiaProfile", JSON.stringify(profile));
  storage.set("melodiaOnboarded", "true");
  showToast("Your Melodia home page is ready.");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 700);
});

const TUTOR_STAGES = {
  Beginner: [
    { title: "Posture, hold, and first sounds", note: "Get comfortable holding your {instrument} and produce your first clean, confident sounds." },
    { title: "Reading your first notes", note: "Learn to recognize and play the first five notes on {instrument}." },
    { title: "Simple rhythms", note: "Practice steady beats and basic rhythm patterns on {instrument}." },
    { title: "Your first short piece", note: "Put it all together and play a short beginner piece on {instrument}." },
    { title: "Mini quiz", note: "A quick check-in on everything you've covered so far on {instrument}." }
  ],
  Intermediate: [
    { title: "Expanding your range", note: "Extend the notes and positions you're comfortable with on {instrument}." },
    { title: "Chords & harmony basics", note: "Start combining notes into chords and simple harmony on {instrument}." },
    { title: "Rhythm variety", note: "Practice syncopation and mixed rhythm patterns on {instrument}." },
    { title: "Learning a full song", note: "Work through a complete intermediate-level song on {instrument}." },
    { title: "Mini quiz", note: "A quick check-in on everything you've covered so far on {instrument}." }
  ],
  Advanced: [
    { title: "Advanced technique refinement", note: "Sharpen speed, precision, and tone control on {instrument}." },
    { title: "Improvisation basics", note: "Start improvising within a scale or chord progression on {instrument}." },
    { title: "Complex rhythms & meter changes", note: "Tackle odd meters and layered rhythms on {instrument}." },
    { title: "Performance-ready polish", note: "Refine a performance-ready piece on {instrument} down to the last detail." },
    { title: "Mini quiz", note: "A quick check-in on everything you've covered so far on {instrument}." }
  ]
};
const TUTOR_VISUALS = { Piano: "piano", Guitar: "guitar", Violin: "violin", Vocals: "vocals" };

function renderTutorRoadmap() {
  const roadmapList = document.getElementById("roadmapList");
  if (!roadmapList) return;

  const profile = readProfile();
  const instrument = profile?.instrument || "Piano";
  const level = TUTOR_STAGES[profile?.level] ? profile.level : "Beginner";
  const stages = TUTOR_STAGES[level].map((stage) => ({
    title: stage.title,
    note: stage.note.replaceAll("{instrument}", instrument)
  }));

  const visualKey = TUTOR_VISUALS[instrument];
  document.querySelectorAll(".lesson-visual").forEach((view) => view.classList.remove("active"));
  if (visualKey) {
    document.getElementById(`${visualKey}Lesson`)?.classList.add("active");
  } else {
    document.getElementById("genericLesson")?.classList.add("active");
  }

  roadmapList.innerHTML = stages.map((stage, index) => `
    <button class="roadmap-item${index === 0 ? " active" : ""}" data-index="${index}">${instrument}: ${stage.title}</button>
  `).join("");

  const setActiveStage = (index) => {
    document.querySelectorAll(".roadmap-item").forEach((item) => item.classList.remove("active"));
    roadmapList.children[index]?.classList.add("active");
    document.getElementById("lessonTitle").textContent = `${instrument}: ${stages[index].title}`;
    const noteEls = document.querySelectorAll(".lesson-visual.active .lesson-note, #genericLesson .lesson-note");
    noteEls.forEach((el) => { el.textContent = stages[index].note; });
  };

  roadmapList.querySelectorAll(".roadmap-item").forEach((button) => {
    button.addEventListener("click", () => setActiveStage(Number(button.dataset.index)));
  });

  setActiveStage(0);
}
renderTutorRoadmap();

document.querySelectorAll(".piano button").forEach((key) => {
  key.addEventListener("click", () => {
    key.classList.add("active-key");
    setTimeout(() => key.classList.remove("active-key"), 520);
  });
});

const playExample = document.getElementById("playExample");
if (playExample) playExample.addEventListener("click", () => {
  showToast("Playback example queued with highlighted notes.");
});

const chatForm = document.getElementById("chatForm");
if (chatForm) chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("chatText");
  const value = input.value.trim();
  if (!value) return;
  addBubble(value, "user");
  input.value = "";
  setTimeout(() => {
    addBubble("Nice goal. I’ll give you a short drill: play the tricky measure slowly three times, clap it once, then record one full pass for feedback.", "ai");
  }, 420);
});

function addBubble(text, type) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${type}`;
  bubble.textContent = text;
  const log = document.getElementById("chatLog");
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
}

const uploadZone = document.getElementById("uploadZone");
if (uploadZone) uploadZone.addEventListener("click", () => {
  showToast("Analysis complete: timing strong, pitch improving, retry measure 4.");
});

const decodeButton = document.getElementById("decodeButton");
if (decodeButton) decodeButton.addEventListener("click", () => {
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

const tempo = document.getElementById("tempo");
if (tempo) tempo.addEventListener("input", (event) => {
  document.getElementById("tempoValue").textContent = `${event.target.value} BPM`;
});

document.querySelectorAll("[data-checkout-plan]").forEach((button) => {
  button.addEventListener("click", () => {
    const plan = button.dataset.checkoutPlan === "elite" ? "Elite" : "Pro";
    const price = plan === "Elite" ? "$39.99/mo after trial" : "$14.99/mo after trial";
    document.getElementById("checkoutTitle").textContent = `${plan} trial checkout`;
    document.getElementById("checkoutCopy").textContent = "Stripe Checkout collects the card now, charges $0 today, and starts monthly billing after 30 days unless canceled.";
    document.getElementById("checkoutAmount").textContent = "$0 today";
    document.getElementById("completeCheckout").textContent = `Start ${plan} Trial`;
    document.getElementById("completeCheckout").dataset.plan = plan;
    showToast(`${plan} selected: ${price}.`);
    document.getElementById("checkoutDemo").scrollIntoView({ behavior: "smooth" });
  });
});

const completeCheckout = document.getElementById("completeCheckout");
if (completeCheckout) completeCheckout.addEventListener("click", () => {
  const plan = completeCheckout.dataset.plan || "Pro";
  storage.set("melodiaLoggedIn", "true");
  storage.set("melodiaSubscription", plan.toLowerCase() === "elite" ? "elite" : "trial");
  showToast(`${plan} trial started. Redirecting to billing dashboard...`);
  setTimeout(() => {
    window.location.href = `dashboard.html?trial=${plan.toLowerCase()}`;
  }, 900);
});

document.querySelectorAll("[data-billing-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.billingAction;
    const status = document.getElementById("billingStatus");
    const statusText = document.getElementById("statusText");
    const accessText = document.getElementById("accessText");
    const message = document.getElementById("billingMessage");
    const plan = document.getElementById("dashboardPlan");
    const price = document.getElementById("monthlyPrice");

    if (action === "portal") {
      message.textContent = "Stripe Billing Portal opened: update card, download invoices, or manage subscription.";
      showToast("Opening billing portal preview.");
    }

    if (action === "upgrade") {
      plan.textContent = "Elite";
      price.textContent = "$39.99";
      storage.set("melodiaSubscription", "elite");
      applyEliteLocks();
      message.textContent = "Upgrade preview: Pro to Elite is prorated instantly in the production Stripe flow.";
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

  });
});

function updateSessionChrome() {
  const loggedIn = isLoggedIn();
  const profile = readProfile();
  const displayName = profile?.instrument ? `${profile.instrument} student` : "Melodia student";
  const initial = displayName.charAt(0).toUpperCase();

  document.querySelectorAll(".session-chrome").forEach((chrome) => {
    chrome.classList.toggle("logged-in", loggedIn);
  });
  document.querySelectorAll(".profile-avatar").forEach((avatar) => {
    avatar.textContent = initial;
  });
  document.querySelectorAll(".profile-dropdown-name").forEach((name) => {
    name.textContent = displayName;
  });
}

function handleAuthSubmit(event, mode) {
  event.preventDefault();
  storage.set("melodiaLoggedIn", "true");
  if (mode === "signup") {
    storage.set("melodiaSubscription", "trial");
  } else if (!storage.get("melodiaSubscription")) {
    storage.set("melodiaSubscription", "none");
  }
  if (storage.get("melodiaOnboarded") === "true") {
    showToast(mode === "signup" ? "Account created. Welcome back!" : "Welcome back!");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  } else {
    openQuestionnaire();
  }
}

function openQuestionnaire() {
  const modal = document.getElementById("questionnaireModal");
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function personalizeHome() {
  if (currentPage !== "index.html") return;
  const profile = readProfile();
  if (!profile) return;

  const headline = document.getElementById("homeHeadline");
  const subtext = document.getElementById("homeSubtext");
  const lessonTitle = document.getElementById("homeLessonTitle");
  const lessonHint = document.getElementById("homeLessonHint");

  if (headline) headline.textContent = `${profile.level} ${profile.instrument} lessons built around you`;
  if (subtext) {
    subtext.textContent = `Melodia has adapted your home page for ${profile.instrument.toLowerCase()} practice, ${profile.purpose.toLowerCase()}, and ${profile.time || "steady weekly"} practice.`;
  }
  if (lessonTitle) lessonTitle.textContent = `Today: ${profile.instrument} ${profile.style || "practice"} path`;
  if (lessonHint) {
    lessonHint.textContent = `Coaching focus: ${profile.purpose}. Start with a short warmup and one confidence-building drill.`;
  }
}

function applyEliteLocks() {
  const locked = !hasEliteAccess();
  document.querySelectorAll(".elite-feature").forEach((feature) => {
    feature.classList.toggle("locked", locked);
  });
  document.querySelectorAll(".lock-icon").forEach((icon) => {
    icon.style.display = locked ? "inline-flex" : "none";
  });
}

function readProfile() {
  try {
    return JSON.parse(storage.get("melodiaProfile") || "null");
  } catch {
    return null;
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function confetti() {
  const burst = document.createElement("div");
  burst.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:25;overflow:hidden;";
  document.body.appendChild(burst);
  for (let index = 0; index < 30; index += 1) {
    const piece = document.createElement("span");
    piece.textContent = index % 3 === 0 ? "♪" : "";
    piece.style.cssText = `
      position:absolute;
      left:${46 + Math.random() * 8}%;
      top:54%;
      width:${8 + Math.random() * 8}px;
      height:${8 + Math.random() * 8}px;
      border-radius:${index % 2 ? "50%" : "4px"};
      background:${["#4169e1", "#ff7a59", "#f8c64d", "#76d7b6"][index % 4]};
      color:#4169e1;
      font-size:18px;
      transform:translate(-50%,-50%);
      transition:transform 900ms ease, opacity 900ms ease;
    `;
    burst.appendChild(piece);
    requestAnimationFrame(() => {
      piece.style.transform = `translate(${(Math.random() - 0.5) * 680}px, ${-100 - Math.random() * 300}px) rotate(${Math.random() * 440}deg)`;
      piece.style.opacity = "0";
    });
  }
  setTimeout(() => burst.remove(), 1000);
}
