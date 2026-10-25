(function () {
  const user = (() => { try { return JSON.parse(localStorage.getItem("melodiaUser")); } catch { return null; } })();
  const links = [["teachers.html", "Find a Teacher"], ["how-it-works.html", "How It Works"], ["become-teacher.html", "Become a Teacher"]];
  const here = location.pathname.split("/").pop() || "index.html";
  const hdr = document.getElementById("siteHeader");
  if (hdr) hdr.outerHTML = `<header class="nav-shell"><a class="brand" href="./index.html"><span class="brand-mark">♪</span><span>Melodia</span></a>
    <button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mainNav">☰</button>
    <nav class="desktop-nav" id="mainNav" aria-label="Main navigation">${links.map(([h, t]) => `<a href="./${h}" ${h === here ? 'aria-current="page"' : ""}>${t}</a>`).join("")}
    <span class="nav-auth">${user ? `<a href="./dashboard.html">Dashboard</a><button type="button" class="link-btn" id="logout">Log out</button>` : `<a href="./login.html">Log In</a><a class="nav-cta" href="./signup.html">Sign Up</a>`}</span></nav></header>`;
  const ftr = document.getElementById("siteFooter");
  if (ftr) ftr.outerHTML = `<footer class="site-footer"><div><a class="brand" href="./index.html"><span class="brand-mark">♪</span><span>Melodia</span></a><p>Connecting students with music teachers.</p></div>
    <div><h4>Learn</h4><a href="./teachers.html">Find a Teacher</a><a href="./how-it-works.html">How It Works</a></div><div><h4>Teach</h4><a href="./become-teacher.html">Become a Teacher</a></div><div><h4>Melodia</h4><a href="./about.html">About</a></div><p class="legal">Sample teachers, reviews and testimonials on this site are fictional demo data.</p></footer>`;
  const btn = document.querySelector(".menu-btn"), nav = document.getElementById("mainNav");
  if (btn) btn.onclick = () => { const o = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", o); };
  const out = document.getElementById("logout"); if (out) out.onclick = () => { localStorage.removeItem("melodiaUser"); location.href = "./index.html"; };
  addEventListener("scroll", () => document.body.classList.toggle("scrolled", scrollY > 8), { passive: true });
  // Demo-only sign-in until Clerk is wired to these pages.
  document.querySelectorAll("form[data-auth]").forEach(f => f.addEventListener("submit", e => {
    e.preventDefault(); const d = new FormData(f);
    localStorage.setItem("melodiaUser", JSON.stringify({ name: d.get("name") || String(d.get("email")).split("@")[0], role: d.get("role") || "student" }));
    location.href = "./dashboard.html";
  }));
})();
