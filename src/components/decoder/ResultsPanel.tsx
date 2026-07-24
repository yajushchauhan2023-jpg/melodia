"use client";

import { useMemo, useRef, useState } from "react";
import type { DecodedMusic } from "@/lib/decoder/types";
import { notesToMidiBytes } from "@/lib/decoder/midi";
import { notesToGuitarTab } from "@/lib/decoder/guitar-tabs";
import { ScoreView, type ScoreViewHandle } from "./ScoreView";

type SubView = null | "piano-notes" | "guitar-tabs";

export function ResultsPanel({
  result,
  fileName,
  onStartOver
}: {
  result: DecodedMusic;
  fileName: string;
  onStartOver: () => void;
}) {
  const [beginnerMode, setBeginnerMode] = useState(false);
  const [subView, setSubView] = useState<SubView>(null);
  const scoreRef = useRef<ScoreViewHandle>(null);
  const baseName = fileName.replace(/\.[^.]+$/, "") || "melodia-sheet";

  const guitarTab = useMemo(() => notesToGuitarTab(result.notes), [result.notes]);
  const guitarSupported = guitarTab.some((n) => n !== null);

  function downloadMusicXml() {
    const blob = new Blob([result.musicXml], { type: "application/vnd.recordare.musicxml+xml" });
    triggerDownload(blob, `${baseName}.musicxml`);
  }

  function downloadMidi() {
    const bytes = notesToMidiBytes(result.notes, result.tempo);
    triggerDownload(new Blob([bytes as BlobPart], { type: "audio/midi" }), `${baseName}.mid`);
  }

  return (
    <div className="decoder-results">
      <div className="card decoder-summary-card">
        <div className="decoder-summary-head">
          <div>
            <p className="eyebrow">Decoded</p>
            <h2>{fileName}</h2>
          </div>
          <button className="button secondary" type="button" onClick={onStartOver}>
            Decode another file
          </button>
        </div>

        <div className="decoder-summary-grid">
          <div>
            <span>Key Signature</span>
            <strong>{result.keySignature ?? "Not detected"}</strong>
          </div>
          <div>
            <span>Time Signature</span>
            <strong>{result.timeSignature ?? "Not detected"}</strong>
          </div>
          <div>
            <span>Tempo</span>
            <strong>{result.tempo ? `${result.tempo} BPM` : "Not specified"}</strong>
          </div>
          <div>
            <span>Measures</span>
            <strong>{result.measureCount}</strong>
          </div>
        </div>

        <label className="decoder-beginner-toggle">
          <input type="checkbox" checked={beginnerMode} onChange={(e) => setBeginnerMode(e.target.checked)} />
          <span>Show Note Names</span>
        </label>
      </div>

      <ScoreView ref={scoreRef} musicXml={result.musicXml} notes={result.notes} beginnerMode={beginnerMode} tempo={result.tempo} />

      <div className="decoder-actions-grid">
        <button className="card decoder-action-card" type="button" onClick={() => setSubView(subView === "piano-notes" ? null : "piano-notes")}>
          <span className="decoder-action-icon" aria-hidden="true">🎹</span>
          <span>Show Piano Notes</span>
        </button>
        <button
          className="card decoder-action-card"
          type="button"
          onClick={() => setSubView(subView === "guitar-tabs" ? null : "guitar-tabs")}
          disabled={!guitarSupported}
          title={guitarSupported ? undefined : "This piece is outside standard guitar range"}
        >
          <span className="decoder-action-icon" aria-hidden="true">🎸</span>
          <span>Convert to Guitar Tabs</span>
        </button>
        <button className="card decoder-action-card" type="button" onClick={downloadMusicXml}>
          <span className="decoder-action-icon" aria-hidden="true">🎼</span>
          <span>Export as MusicXML</span>
        </button>
        <button className="card decoder-action-card" type="button" onClick={downloadMidi}>
          <span className="decoder-action-icon" aria-hidden="true">🎵</span>
          <span>Export as MIDI</span>
        </button>
        <button className="card decoder-action-card" type="button" onClick={() => scoreRef.current?.downloadCleanCopy(baseName)}>
          <span className="decoder-action-icon" aria-hidden="true">📄</span>
          <span>Download Clean Copy</span>
        </button>
      </div>

      {subView === "piano-notes" && (
        <div className="card decoder-subview-card">
          <h3>Piano notes, in order</h3>
          <ol className="decoder-note-sequence">
            {result.notes.map((note, i) => (
              <li key={i}>{note.name}</li>
            ))}
          </ol>
        </div>
      )}

      {subView === "guitar-tabs" && (
        <div className="card decoder-subview-card">
          <h3>Guitar tab (standard tuning)</h3>
          <p className="decoder-subview-note">
            Simplified fingering suggestion — picks the lowest comfortable fret for each note.
          </p>
          <ol className="decoder-note-sequence">
            {guitarTab.map((tab, i) =>
              tab ? <li key={i}>{`String ${tab.string}, fret ${tab.fret}`}</li> : <li key={i} className="muted">Out of range</li>
            )}
          </ol>
        </div>
      )}
    </div>
  );
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
