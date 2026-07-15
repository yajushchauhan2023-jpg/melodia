import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Track your Melodia music progress, practice streak, weekly hours, accuracy score, recent lessons, achievements, bookings, and billing details. Start today.",
  alternates: { canonical: "/dashboard" }
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <main id="maincontent" className="shell">
      <section className="hero">
        <p className="eyebrow">Dashboard</p>
        <h1>Your Melodia progress and billing in one place.</h1>
        <p>Track music practice progress, manage your trial, update payment details, and change plans anytime.</p>
        <div className="actions">
          <a className="button" href="/dashboard/billing">Manage billing</a>
          <a className="button secondary" href="/pricing">Compare plans</a>
        </div>
      </section>
    </main>
  );
}
