import type { DecodedNote } from "./types";
import { pitchNameToMidi } from "./midi";

// Standard tuning, low to high, as MIDI note numbers: E2 A2 D3 G3 B3 E4.
// String index 0 = low E (thickest string) to keep the "string number"
// shown to the user matching how guitarists usually count (6 = low E).
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];
const MAX_FRET = 15; // stay in comfortable beginner fret range

export interface GuitarTabNote {
  /** 1 = high E, 6 = low E, matching standard tab notation. */
  string: number;
  fret: number;
  measureNumber: number;
}

/**
 * For each note, picks the lowest-fret playable position across the six
 * strings. This is a simplification — real tab generation also considers
 * hand position and the previous note's position for playability — but it
 * gives a musically correct, beginner-friendly starting point.
 */
export function notesToGuitarTab(notes: DecodedNote[]): (GuitarTabNote | null)[] {
  return notes.map((note) => {
    const midi = pitchNameToMidi(note.name);
    let best: GuitarTabNote | null = null;

    for (let stringIndex = 0; stringIndex < OPEN_STRING_MIDI.length; stringIndex++) {
      const fret = midi - OPEN_STRING_MIDI[stringIndex];
      if (fret < 0 || fret > MAX_FRET) continue;
      if (!best || fret < best.fret) {
        best = { string: 6 - stringIndex, fret, measureNumber: note.measureNumber };
      }
    }

    return best; // null means the note is out of a standard guitar's playable range
  });
}
