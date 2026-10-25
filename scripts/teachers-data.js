// DEMO DATA: fictional teachers, ratings and reviews for development only.
window.MELODIA_DEMO = true;
window.TEACHERS = [
  { id: "t1", name: "Ari Lin", instruments: ["Piano", "Music Theory"], formats: ["Online", "In person"], price: 1800, rating: 4.9, reviews: 42, years: 8, languages: ["English", "Mandarin"], photo: "teacher-one", qualifications: "BMus Piano Performance; ABRSM Grade 8 examiner prep", bio: "Patient, structured piano teaching for beginners through exam candidates. Lessons mix repertoire, technique and theory.", days: [1, 2, 4], hours: [9, 10, 15, 16] },
  { id: "t2", name: "Maya Sol", instruments: ["Guitar"], formats: ["Online", "In person"], price: 1500, rating: 4.8, reviews: 31, years: 6, languages: ["English", "Spanish"], photo: "teacher-two", qualifications: "Diploma in Contemporary Music; 6 years teaching", bio: "Acoustic and electric guitar, rhythm and songwriting. Learn songs you love from week one.", days: [2, 3, 5], hours: [11, 14, 17, 18] },
  { id: "t3", name: "Grace Wanjiku", instruments: ["Voice"], formats: ["Online", "In person"], price: 1600, rating: 4.7, reviews: 24, years: 10, languages: ["English", "Swahili"], photo: "", qualifications: "Choral director; vocal pedagogy certificate", bio: "Vocal coach for choir, gospel and pop singers. Breath, pitch and confidence on stage.", days: [1, 3, 5], hours: [10, 13, 16] },
  { id: "t4", name: "Daniel Okoye", instruments: ["Violin"], formats: ["In person"], price: 2000, rating: 4.9, reviews: 18, years: 12, languages: ["English"], photo: "", qualifications: "Orchestra violinist; MMus Strings", bio: "Classical and folk violin for children and adults, with careful attention to posture and tone.", days: [2, 4], hours: [9, 12, 15] },
  { id: "t5", name: "Sam Mutua", instruments: ["Drums"], formats: ["Online", "In person"], price: 1200, rating: 4.6, reviews: 15, years: 5, languages: ["English", "Swahili"], photo: "", qualifications: "Session drummer; 5 years teaching", bio: "Groove, fills and reading charts. Great for beginners who want to play in a band quickly.", days: [1, 4, 6], hours: [14, 16, 18] }
];
// Build concrete slots for the next 14 days (local time shown; store UTC + teacher timezone in production).
window.slotsFor = function (t) {
  const out = [], now = new Date();
  for (let d = 1; d <= 14; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    if (!t.days.includes(day.getDay())) continue;
    t.hours.forEach(h => { const s = new Date(day); s.setHours(h, 0, 0, 0); out.push(s); });
  }
  return out;
};
