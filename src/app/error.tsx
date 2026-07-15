"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="maincontent" className="shell">
      <section className="hero notice card">
        <p className="eyebrow">Something went wrong</p>
        <h1>Melodia needs a quick refresh.</h1>
        <p>Your progress is safe. Try again, or return to the dashboard when you are ready.</p>
        <div className="actions">
          <button className="button" type="button" onClick={reset}>Try again</button>
          <a className="button secondary" href="/dashboard">Open dashboard</a>
        </div>
      </section>
    </main>
  );
}
