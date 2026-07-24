"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { DecodedNote } from "@/lib/decoder/types";

export interface ScoreViewHandle {
  /** Serializes the rendered score to an SVG file and triggers a download ("Download Clean Copy"). */
  downloadCleanCopy: (fileBaseName: string) => void;
}

interface NoteLabel {
  left: number;
  top: number;
  letter: string;
}

export const ScoreView = forwardRef<ScoreViewHandle, { musicXml: string; notes: DecodedNote[]; beginnerMode: boolean; tempo: number | null }>(
  function ScoreView({ musicXml, notes, beginnerMode, tempo }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const osmdRef = useRef<any>(null);
    const pianoRef = useRef<any>(null);
    const stopPlaybackRef = useRef<() => void>(() => {});

    const [ready, setReady] = useState(false);
    const [labels, setLabels] = useState<NoteLabel[]>([]);
    const [playing, setPlaying] = useState(false);

    // Load OSMD and render the score. Dynamically imported because it
    // touches the DOM/canvas APIs and can't run during server rendering.
    useEffect(() => {
      let cancelled = false;
      (async () => {
        const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay");
        if (!containerRef.current || cancelled) return;

        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
          autoResize: true,
          backend: "svg",
          drawTitle: false
        });
        await osmd.load(musicXml);
        osmd.render();
        osmdRef.current = osmd;
        if (!cancelled) setReady(true);
      })();

      return () => {
        cancelled = true;
        stopPlaybackRef.current();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [musicXml]);

    // Beginner Mode: walk the cursor across every note once (without
    // playing anything) and record where OSMD placed it, so we can draw a
    // letter-name badge above each note. Re-runs whenever the toggle flips.
    useEffect(() => {
      if (!ready || !beginnerMode || !osmdRef.current || !containerRef.current) {
        setLabels([]);
        return;
      }
      const osmd = osmdRef.current;
      const containerRect = containerRef.current.getBoundingClientRect();
      const collected: NoteLabel[] = [];
      let noteIndex = 0;

      osmd.cursor.reset();
      osmd.cursor.show();
      while (!osmd.cursor.iterator.EndReached) {
        const cursorNotes = osmd.cursor.NotesUnderCursor();
        const hasPitchedNote = cursorNotes.some((n: any) => !n.isRest());
        if (hasPitchedNote && noteIndex < notes.length) {
          const rect = osmd.cursor.cursorElement.getBoundingClientRect();
          collected.push({
            left: rect.left - containerRect.left,
            top: rect.top - containerRect.top - 22,
            letter: notes[noteIndex].letter
          });
          noteIndex++;
        }
        osmd.cursor.next();
      }
      osmd.cursor.hide();
      setLabels(collected);
    }, [ready, beginnerMode, notes]);

    useImperativeHandle(ref, () => ({
      downloadCleanCopy(fileBaseName: string) {
        const svg = containerRef.current?.querySelector("svg");
        if (!svg) return;
        const serialized = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([serialized], { type: "image/svg+xml" });
        triggerDownload(blob, `${fileBaseName}.svg`);
      }
    }));

    async function togglePlay() {
      if (playing) {
        stopPlaybackRef.current();
        setPlaying(false);
        return;
      }
      if (!osmdRef.current || notes.length === 0) return;

      setPlaying(true);
      const { SplendidGrandPiano } = await import("smplr");
      if (!pianoRef.current) {
        const ctx = new AudioContext();
        pianoRef.current = await new SplendidGrandPiano(ctx).load;
      }
      const piano = pianoRef.current;
      const osmd = osmdRef.current;
      const beatSeconds = 60 / (tempo || 100);

      osmd.cursor.reset();
      osmd.cursor.show();

      let cancelled = false;
      stopPlaybackRef.current = () => {
        cancelled = true;
        osmd.cursor.hide();
      };

      for (const note of notes) {
        if (cancelled) break;
        piano.start({ note: note.name, duration: note.durationBeats * beatSeconds * 0.95 });
        osmd.cursor.next();
        await sleep(note.durationBeats * beatSeconds * 1000);
      }

      if (!cancelled) {
        osmd.cursor.hide();
        setPlaying(false);
      }
    }

    return (
      <div className="decoder-score-card card">
        <div className="decoder-score-toolbar">
          <button className="button" type="button" onClick={togglePlay} disabled={!ready || notes.length === 0}>
            {playing ? "⏸ Stop" : "▶ Play Music"}
          </button>
        </div>
        <div className="decoder-score-wrapper">
          <div ref={containerRef} className="decoder-score-canvas" />
          {beginnerMode &&
            labels.map((label, i) => (
              <span key={i} className="decoder-note-label" style={{ left: label.left, top: label.top }}>
                {label.letter}
              </span>
            ))}
        </div>
      </div>
    );
  }
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
