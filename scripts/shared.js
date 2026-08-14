export const storage = {
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

export const isLoggedIn = () => storage.get("melodiaLoggedIn") === "true";
export const getSubscription = () => storage.get("melodiaSubscription") || "none";
export const hasEliteAccess = () => ["trial", "elite"].includes(getSubscription());

export function initSharedUi(currentPage) {
  initFloatingNotes();
  updateSessionChrome();
  highlightCurrentPage(currentPage);
  initLoginButtons();
  initEliteRedirects();

  window.addEventListener("scroll", () => {
    document.body.classList.toggle("scrolled", window.scrollY > 12);
  });
}

function initFloatingNotes() {
  const notesField = document.querySelector(".notes-field");
  if (!notesField) return;
  const notes = ["♪", "♬", "♩", "♫"];

  for (let index = 0; index < 18; index += 1) {
    const note = document.createElement("span");
    note.className = "floating-note";
    note.textContent = notes[index % notes.length];
    note.style.left = `${Math.random() * 100}%`;
    note.style.top = `${Math.random() * 100}%`;
    note.style.setProperty("--speed", `${4 + Math.random() * 5}s`);
    notesField.appendChild(note);
  }

  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 18;
    const y = (event.clientY / window.innerHeight - 0.5) * 18;
    document.querySelectorAll(".floating-note").forEach((note, index) => {
      const strength = (index % 4) + 1;
      note.style.setProperty("--mx", `${x * strength * 0.1}px`);
      note.style.setProperty("--my", `${y * strength * 0.1}px`);
    });
  });
}

function initLoginButtons() {
  document.querySelectorAll(".login-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (isLoggedIn()) {
        storage.remove("melodiaLoggedIn");
        showToast("Logged out.");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 500);
        return;
      }
      window.location.href = "login.html";
    });
  });
}

function initEliteRedirects() {
  document.addEventListener("click", (event) => {
    const eliteTarget = event.target.closest("[data-elite-service]");
    if (!eliteTarget || hasEliteAccess()) return;
    event.preventDefault();
    showToast("Elite feature locked. Start a free trial or choose Elite to unlock it.");
    setTimeout(() => {
      window.location.href = "pricing.html";
    }, 700);
  });
}

export function updateSessionChrome() {
  document.querySelectorAll(".login-btn").forEach((button) => {
    button.textContent = isLoggedIn() ? "Logout" : "Login";
  });
}

function highlightCurrentPage(currentPage) {
  const page = currentPage || "index.html";
  document.querySelectorAll(".desktop-nav a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    link.classList.toggle("active", href.endsWith(page));
  });
}

export function handleAuthSubmit(event, mode) {
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
  const firstField = modal.querySelector("select, input, button");
  firstField?.focus();
}

export function personalizeHome(currentPage) {
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
    lessonHint.textContent = `AI focus: ${profile.purpose}. Start with a short warmup and one confidence-building drill.`;
  }
}

export function applyEliteLocks() {
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

export function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

export function confetti() {
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
