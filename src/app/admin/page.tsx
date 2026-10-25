import { notFound } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { reviewApplication } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try { await requireRole("admin"); } catch { notFound(); }
  const apps = await prisma.teacherProfile.findMany({ orderBy: { createdAt: "asc" }, include: { user: { select: { email: true } } } });
  const pending = apps.filter(a => a.status === "pending");
  const decided = apps.filter(a => a.status !== "pending");
  return (
    <main className="shell">
      <section className="hero"><p className="eyebrow">Admin</p><h1>Teacher applications</h1><p>{pending.length} awaiting review.</p></section>
      <div className="grid">
        {pending.length === 0 && <div className="card"><p>No pending applications.</p></div>}
        {pending.map(a => (
          <article className="card" key={a.id}>
            <h3>{a.displayName} <span className="badge">{a.status}</span></h3>
            <p>{a.user.email} · {a.instruments.join(", ")} · {a.yearsExperience} yrs · KSh {a.hourlyPrice}/hr · {a.formats.join(" / ")}</p>
            <p><strong>Qualifications:</strong> {a.qualifications}</p><p>{a.bio}</p>
            <form action={reviewApplication} className="actions">
              <input type="hidden" name="id" value={a.id} />
              <input name="note" placeholder="Note (optional)" maxLength={500} />
              <button className="button" name="action" value="approve">Approve</button>
              <button className="button danger" name="action" value="reject">Reject</button>
            </form>
          </article>
        ))}
        {decided.length > 0 && <h2>Decided</h2>}
        {decided.map(a => (
          <article className="card" key={a.id}>
            <h3>{a.displayName} <span className="badge">{a.status}</span></h3>
            <p>{a.user.email}{a.reviewNote ? ` · ${a.reviewNote}` : ""}</p>
            <form action={reviewApplication} className="actions"><input type="hidden" name="id" value={a.id} />
              {a.status === "approved" ? <button className="button danger" name="action" value="suspend">Suspend</button> : <button className="button secondary" name="action" value="approve">Approve</button>}
            </form>
          </article>
        ))}
      </div>
    </main>
  );
}
