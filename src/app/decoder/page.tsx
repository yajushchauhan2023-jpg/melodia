import { requirePremiumAccess } from "@/lib/access";
import { DecoderExperience } from "@/components/decoder/DecoderExperience";

export default async function DecoderPage() {
  await requirePremiumAccess();

  return (
    <main className="shell decoder-page">
      <section className="hero">
        <p className="eyebrow">Premium sheet decoder</p>
        <h1>Turn a photo of sheet music into something you can play.</h1>
        <p>Upload a photo or PDF of any sheet music and Melodia will read the notation, then let you play it back, view piano notes or guitar tabs, and export it.</p>
      </section>
      <DecoderExperience />
    </main>
  );
}
