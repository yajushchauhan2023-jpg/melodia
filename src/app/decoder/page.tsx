import type { Metadata } from "next";
import { requirePremiumAccess } from "@/lib/access";

export const metadata: Metadata = {
  title: "Sheet Music Decoder",
  description: "Upload sheet music to Melodia and translate notation into readable notes, playback, tempo controls, instrument adaptation, and fingering guidance. Start today.",
  alternates: { canonical: "/decoder" }
};

export default async function DecoderPage() {
  await requirePremiumAccess();

  return (
    <main id="maincontent" className="shell">
      <section className="hero">
        <p className="eyebrow">Premium sheet decoder</p>
        <h1>Upload sheet music and decode it with Melodia.</h1>
        <p>This premium route redirects to the upgrade page unless the user is trialing or active.</p>
      </section>
    </main>
  );
}
