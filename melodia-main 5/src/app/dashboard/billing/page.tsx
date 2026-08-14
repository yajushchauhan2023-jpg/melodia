import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BillingActions } from "@/components/billing/BillingActions";
import { prisma } from "@/lib/prisma";
import { trialDaysRemaining } from "@/lib/subscriptions";

export default async function BillingDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/pricing");

  const daysLeft = trialDaysRemaining(user.trialEndsAt);
  const trialProgress = user.trialEndsAt ? Math.min(100, Math.max(0, ((30 - daysLeft) / 30) * 100)) : 100;
  const nextBillingDate = user.trialEndsAt || null;
  const currentPlan = user.currentPlan === "elite" ? "elite" : "pro";

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Billing dashboard</p>
        <h1>Manage your Melodia subscription.</h1>
        <p>{daysLeft > 0 ? `${daysLeft} days left in your free trial.` : "Your subscription billing is active."}</p>
      </section>
      <section className="grid dashboard-grid">
        <article className="card">
          <h2>Current billing</h2>
          <div className="billing-row"><span>Current plan</span><strong>{user.currentPlan}</strong></div>
          <div className="billing-row"><span>Status</span><strong>{user.subscriptionStatus}</strong></div>
          <div className="billing-row"><span>Trial days remaining</span><strong>{daysLeft}</strong></div>
          <div className="billing-row"><span>Next billing date</span><strong>{nextBillingDate ? nextBillingDate.toLocaleDateString() : "Not scheduled"}</strong></div>
          <div style={{ marginTop: 18 }}>
            <div className="progress"><span style={{ width: `${trialProgress}%` }} /></div>
            <p>{daysLeft > 0 ? `${daysLeft} days left in your free trial` : "Trial complete"}</p>
          </div>
          <BillingActions currentPlan={currentPlan} />
        </article>
        <article className="card">
          <h2>Access rules</h2>
          <p>Premium routes stay unlocked while the user is trialing or active.</p>
          <p>If payment fails, the account becomes past_due, warning email is sent, and premium access expires after the 7-day grace period cron marks it expired.</p>
        </article>
      </section>
    </main>
  );
}
