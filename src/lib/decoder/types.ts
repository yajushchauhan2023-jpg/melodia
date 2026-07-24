// Shared types for the Music Sheet Decoder feature.
// Kept dependency-free so this file can be imported from both
// client components and server route handlers.

export type DecodeJobStatus = "uploaded" | "processing" | "completed" | "failed";

/** A single note in reading order, used to drive Beginner Mode + playback. */
export interface DecodedNote {
  /** Scientific pitch notation, e.g. "C4", "F#5" — what smplr's player expects. */
  name: string;
  /** Plain letter name only (no octave/accidental), e.g. "C" — what Beginner Mode displays. */
  letter: string;
  /** Beat position within the piece, in quarter notes, for simple sequential playback. */
  beat: number;
  /** Note duration in quarter-note units. */
  durationBeats: number;
  measureNumber: number;
}

export interface DecodedMusic {
  musicXml: string;
  keySignature: string | null;
  timeSignature: string | null;
  tempo: number | null;
  measureCount: number;
  notes: DecodedNote[];
}

export interface DecodeJobSummary {
  id: string;
  status: DecodeJobStatus;
  fileName: string;
  /** Only set once status === "completed". */
  result?: DecodedMusic;
  /** Always a friendly, user-safe message. Only set once status === "failed". */
  errorMessage?: string;
}
