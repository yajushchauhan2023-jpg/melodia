"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INSTRUMENTS, LEVELS, GOALS, WEEKLY_TIMES } from "@/lib/curriculum";

type Answers = {
  instrument: string | null;
  level: string | null;
  goal: string | null;
  weeklyTime: string | null;
};

const STEPS = [
  { key: "instrument", label: "Choose your instrument", options: INSTRUMENTS },
  { key: "level", label: "Choose your skill level", options: LEVELS },
  { key: "goal", label: "Choose your goal", options: GOALS },
  { key: "weeklyTime", label: "Weekly time commitment", options: WEEKLY_TIMES }
] as const;

export function OnboardingWizard({ hasExistingProfile }: { hasExistingProfile: boolean }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ instrument: null, level: null, goal: null, weeklyTime: null });
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const currentValue = answers[step.key as keyof Answers];

  function selectOption(value: string) {
    setAnswers((prev) => ({ ...prev, [step.key]: value }));
  }

  function goNext() {
    if (!currentValue) return;
    if (!isLastStep) {
      setStepIndex((i) => i + 1);
      return;
    }
    if (hasExistingProfile) {
      setShowConfirm(true);
    } else {
      void submit();
    }
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/lesson-plan/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push("/tutor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="onboarding-panel card">
      <div className="step-dots">
        {STEPS.map((s, i) => (
          <span key={s.key} className={i === stepIndex ? "on" : ""} />
        ))}
      </div>
      <h3>{step.label}</h3>
      <div className="choice-grid">
        {step.options.map((option) => (
          <button
            key={option}
            type="button"
            className={currentValue === option ? "choice selected" : "choice"}
            onClick={() => selectOption(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {error && <p className="onboarding-error">{error}</p>}
      <div className="onboarding-footer">
        <button className="button secondary" type="button" onClick={goBack} disabled={stepIndex === 0 || saving}>
          Back
        </button>
        <button className="button" type="button" onClick={goNext} disabled={!currentValue || saving}>
          {isLastStep ? (saving ? "Saving..." : "Finish") : "Next"}
        </button>
      </div>

      {showConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card card">
            <h3>Update your lesson plan?</h3>
            <p>Are you sure you want to update your lesson plan? If you do, all previous progress will be lost.</p>
            <div className="onboarding-footer">
              <button className="button secondary" type="button" onClick={() => setShowConfirm(false)} disabled={saving}>
                Cancel
              </button>
              <button className="button danger" type="button" onClick={() => void submit()} disabled={saving}>
                {saving ? "Updating..." : "Yes, update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
