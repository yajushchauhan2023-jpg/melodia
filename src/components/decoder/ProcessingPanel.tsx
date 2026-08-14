"use client";

import { useEffect, useState } from "react";

// Real OMR processing time varies a lot (a clean single-line photo vs. a
// dense multi-page PDF), so these stages are a UX pacing device, not a
// literal progress readout — they advance on a timer and hold at the last
// stage until the job actually completes (or fails), which the parent
// component is polling for separately.
const STAGES = [
  { label: "Reading your sheet music...", icon: "📖" },
  { label: "Detecting notes...", icon: "🎵" },
  { label: "Analysing rhythm...", icon: "🥁" },
  { label: "Preparing your results...", icon: "✨" }
];

const STAGE_DURATION_MS = 3200;

export function ProcessingPanel({ fileName }: { fileName: string }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (stageIndex >= STAGES.length - 1) return;
    const timer = setTimeout(() => setStageIndex((i) => Math.min(i + 1, STAGES.length - 1)), STAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [stageIndex]);

  // Fill smoothly toward (but never quite reaching) 100% within the current
  // stage's slice of the bar, so it never looks frozen even between stages.
  const stageWidth = 100 / STAGES.length;
  const progressPct = Math.min(97, stageIndex * stageWidth + stageWidth * 0.6);

  return (
    <div className="card decoder-processing-card">
      <div className="decoder-processing-icon" aria-hidden="true">
        {STAGES[stageIndex].icon}
      </div>
      <h2>{STAGES[stageIndex].label}</h2>
      <p>Decoding “{fileName}” — this usually takes under a minute.</p>

      <div className="progress decoder-processing-progress">
        <span style={{ width: `${progressPct}%` }} />
      </div>

      <ol className="decoder-processing-steps">
        {STAGES.map((stage, i) => (
          <li key={stage.label} className={i < stageIndex ? "done" : i === stageIndex ? "current" : ""}>
            <span className="decoder-processing-step-marker">{i < stageIndex ? "✓" : i + 1}</span>
            <span>{stage.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
