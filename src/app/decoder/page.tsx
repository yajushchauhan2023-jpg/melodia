import { requirePremiumAccess } from "@/lib/access";

export default async function DecoderPage() {
  await requirePremiumAccess();

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Premium sheet decoder</p>
        <h1>Upload sheet music and decode it with Melodia.</h1>
        <p>This premium route redirects to the upgrade page unless the user is trialing or active.</p>
      </section>
    </main>
  );
}
