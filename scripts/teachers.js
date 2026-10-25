(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const money = n => "KSh " + n.toLocaleString("en-KE");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = d => d.toLocaleString("en-KE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const booked = () => { try { return JSON.parse(localStorage.getItem("melodia_demo_bookings") || "[]"); } catch { return []; } };
  const isTaken = (tid, iso) => booked().some(b => b.teacherId === tid && b.start === iso);
  const nextSlot = t => window.slotsFor(t).find(s => !isTaken(t.id, s.toISOString()));
  const photo = t => t.photo ? `<div class="teacher-photo ${t.photo}" role="img" aria-label="${esc(t.name)}"></div>` : `<div class="teacher-photo teacher-initials" aria-hidden="true">${esc(t.name.split(" ").map(w => w[0]).join(""))}</div>`;

  /* ---------- Discovery page ---------- */
  const list = $("#teacherList");
  if (list) {
    const PAGE = 6; let page = 1;
    const f = { q: $("#fq"), inst: $("#finst"), fmt: $("#ffmt"), price: $("#fprice"), rate: $("#frate"), sort: $("#fsort") };
    const render = () => {
      const q = f.q.value.trim().toLowerCase();
      let r = window.TEACHERS.filter(t =>
        (!q || (t.name + " " + t.instruments.join(" ")).toLowerCase().includes(q)) &&
        (!f.inst.value || t.instruments.includes(f.inst.value)) &&
        (!f.fmt.value || t.formats.includes(f.fmt.value)) &&
        (!f.price.value || t.price <= +f.price.value) &&
        (!f.rate.value || t.rating >= +f.rate.value));
      const s = f.sort.value;
      r.sort((a, b) => s === "price" ? a.price - b.price : s === "rating" ? b.rating - a.rating : (b.rating * Math.log(b.reviews + 1)) - (a.rating * Math.log(a.reviews + 1)));
      const pages = Math.max(1, Math.ceil(r.length / PAGE)); page = Math.min(page, pages);
      $("#resultCount").textContent = `${r.length} teacher${r.length === 1 ? "" : "s"} found`;
      if (!r.length) { list.innerHTML = `<div class="empty-state card"><h3>No teachers match yet</h3><p>Try a different instrument, a higher price limit, or clear your filters.</p><button type="button" id="clearF" class="secondary-action">Clear filters</button></div>`; $("#clearF").onclick = () => { Object.values(f).forEach(e => e.id !== "fsort" && (e.value = "")); render(); }; $("#pager").innerHTML = ""; return; }
      list.innerHTML = r.slice((page - 1) * PAGE, page * PAGE).map(t => { const n = nextSlot(t); return `<article class="teacher-card card">${photo(t)}<h3>${esc(t.name)}</h3><p>${esc(t.instruments.join(", "))}</p><p class="teacher-bio">${esc(t.bio)}</p><div class="teacher-meta"><span>★ ${t.rating} (${t.reviews})</span><span>${t.years} yrs</span><span>${esc(t.formats.join(" / "))}</span></div><p class="price-line"><strong>${money(t.price)}</strong> / 60 min</p><p class="next-slot">${n ? "Next: " + fmt(n) : "No open slots"}</p><a class="primary-action" href="./teacher.html?id=${t.id}">View profile</a></article>`; }).join("");
      $("#pager").innerHTML = pages > 1 ? Array.from({ length: pages }, (_, i) => `<button type="button" class="${i + 1 === page ? "active" : ""}" data-p="${i + 1}" aria-label="Page ${i + 1}">${i + 1}</button>`).join("") : "";
    };
    Object.values(f).forEach(e => e.addEventListener("input", () => { page = 1; render(); }));
    $("#pager").addEventListener("click", e => { const p = e.target.dataset.p; if (p) { page = +p; render(); } });
    const qs = new URLSearchParams(location.search);
    if (qs.get("inst")) f.inst.value = qs.get("inst"); if (qs.get("fmt")) f.fmt.value = qs.get("fmt");
    render();
  }
  const feat = $("#featuredTeachers");
  if (feat) feat.innerHTML = window.TEACHERS.slice(0, 3).map(t => { const n = nextSlot(t); return `<article class="teacher-card card">${photo(t)}<h3>${esc(t.name)}</h3><p>${esc(t.instruments.join(", "))}</p><div class="teacher-meta"><span>★ ${t.rating}</span><span>${money(t.price)}/hr</span></div><p class="next-slot">${n ? "Next: " + fmt(n) : "No open slots"}</p><a class="primary-action" href="./teacher.html?id=${t.id}">View profile</a></article>`; }).join("");

  /* ---------- Profile + booking ---------- */
  const prof = $("#teacherProfile");
  if (prof) {
    const t = window.TEACHERS.find(x => x.id === new URLSearchParams(location.search).get("id"));
    if (!t) { prof.innerHTML = `<div class="empty-state card"><h3>Teacher not found</h3><a class="primary-action" href="./teachers.html">Back to teachers</a></div>`; return; }
    document.title = `Melodia | ${t.name}`;
    let chosen = null, fmtSel = t.formats[0];
    const draw = () => {
      const slots = window.slotsFor(t).filter(s => !isTaken(t.id, s.toISOString()));
      prof.innerHTML = `<div class="profile-grid"><section class="card">${photo(t)}<h1>${esc(t.name)}</h1><p>${esc(t.instruments.join(", "))} · ★ ${t.rating} (${t.reviews} demo reviews)</p><p>${esc(t.bio)}</p><div class="teacher-meta"><span>${t.years} years</span><span>${esc(t.languages.join(", "))}</span><span>${esc(t.formats.join(" / "))}</span></div><h3>Qualifications</h3><p>${esc(t.qualifications)}</p><div class="video-preview">Intro video placeholder</div><p class="demo-note">Demo profile: fictional teacher, credentials and reviews. Not verified.</p></section>
      <aside class="card booking-panel"><h3>Book a lesson</h3><p><strong>${money(t.price)}</strong> / 60 min</p>
      <label>Lesson format<select id="bfmt">${t.formats.map(x => `<option ${x === fmtSel ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <div class="slot-grid" role="radiogroup" aria-label="Available times">${slots.length ? slots.map(s => `<button type="button" class="slot ${chosen === s.toISOString() ? "selected" : ""}" role="radio" aria-checked="${chosen === s.toISOString()}" data-s="${s.toISOString()}">${fmt(s)}</button>`).join("") : "<p>No open slots right now.</p>"}</div>
      <p class="policy">Free cancellation up to 24 hours before the lesson. Times shown in your local time.</p>
      <p class="policy">Example split: Melodia 15% (${money(Math.round(t.price * .15))}), teacher ${money(t.price - Math.round(t.price * .15))}. Illustrative only.</p>
      <button type="button" class="primary-action" id="bookBtn" ${chosen ? "" : "disabled"}>Confirm booking (demo)</button>
      <p class="policy" id="bookMsg" role="status"></p></aside></div>`;
      $("#bfmt").onchange = e => { fmtSel = e.target.value; };
      prof.querySelectorAll(".slot").forEach(b => b.onclick = () => { chosen = b.dataset.s; draw(); });
      $("#bookBtn").onclick = () => {
        if (!chosen || isTaken(t.id, chosen)) { $("#bookMsg").textContent = "That time was just taken. Please choose another."; chosen = null; return draw(); }
        const all = booked(); all.push({ teacherId: t.id, start: chosen, format: fmtSel, status: "pending_payment", demo: true });
        localStorage.setItem("melodia_demo_bookings", JSON.stringify(all));
        chosen = null; draw(); $("#bookMsg").textContent = "Slot held (demo). Payment is not connected yet, so nothing was charged.";
      };
    };
    draw();
  }
})();
