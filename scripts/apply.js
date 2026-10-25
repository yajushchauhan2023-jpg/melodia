(function () {
  const f = document.getElementById("applyForm"), st = document.getElementById("applyStatus");
  f.addEventListener("submit", async e => {
    e.preventDefault(); const d = new FormData(f); const say = (m, ok) => { st.textContent = m; st.className = "form-status wide " + (ok ? "ok" : "err"); };
    const instruments = d.getAll("instruments"), formats = d.getAll("formats");
    if (!instruments.length || !formats.length) return say("Choose at least one instrument and one lesson format.");
    if (!d.get("terms")) return say("Please accept the teacher terms.");
    const photo = d.get("photo");
    if (photo && photo.size && (!["image/jpeg", "image/png"].includes(photo.type) || photo.size > 2 * 1024 * 1024)) return say("Photo must be a JPG or PNG under 2 MB.");
    const body = { displayName: d.get("displayName"), instruments, formats, yearsExperience: +d.get("years"), hourlyPrice: +d.get("price"),
      languages: String(d.get("languages")).split(",").map(s => s.trim()).filter(Boolean), qualifications: d.get("qualifications"), bio: d.get("bio") };
    say("Submitting…", true);
    try {
      const r = await fetch("/api/teacher/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) say("Application received. Status: pending review. We will notify you once an administrator has reviewed it.", true);
      else say(r.status === 401 ? "Please sign in before applying." : j.error || "Could not submit your application.");
    } catch { say("Could not reach the server. Your application was not submitted."); }
  });
})();
