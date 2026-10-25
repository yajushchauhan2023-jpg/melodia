import { redirect } from "next/navigation";
import { requirePremiumAccess } from "@/lib/access";
import { getLessonPlan } from "@/lib/curriculum";
import { TutorChat } from "@/components/tutor/TutorChat";
import { AdvanceLessonButton } from "@/components/tutor/AdvanceLessonButton";

export default async function TutorPage() {
  const user = await requirePremiumAccess();

  if (!user || !user.instrument || !user.level || !user.goal) {
    redirect("/onboarding");
  }

  const plan = getLessonPlan(user.instrument, user.level, user.goal);
  const lessonIndex = Math.min(user.lessonIndex, plan.length - 1);
  const currentLesson = plan[lessonIndex];
  const nextLesson = plan[lessonIndex + 1] ?? null;

  return (
    <main className="shell tutor-shell">
      <section className="hero tutor-hero">
        <p className="eyebrow">Coach</p>
        <h1>Your Coach</h1>
        <p>{user.instrument} · {user.level} · {user.goal}</p>
      </section>

      <TutorChat instrument={user.instrument} />

      <div className="tutor-lower-grid">
        <div className="card">
          <h3>Lesson roadmap</h3>
          <ol className="lesson-roadmap">
            {plan.map((stage) => (
              <li key={stage.order} className={stage.order === lessonIndex ? "current" : stage.order < lessonIndex ? "done" : ""}>
                <span className="lesson-roadmap-marker">
                  {stage.order < lessonIndex ? "✓" : stage.order + 1}
                </span>
                <span>{stage.title}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <h3>Interactive lesson</h3>
          <p className="lesson-current-title">Lesson {lessonIndex + 1}: {currentLesson.title}</p>
          <p>{currentLesson.description}</p>
          {nextLesson && (
            <p className="lesson-next-note">
              <strong>Next up:</strong> {nextLesson.title}
            </p>
          )}
          <AdvanceLessonButton isLastLesson={!nextLesson} />
        </div>
      </div>
    </main>
  );
}
