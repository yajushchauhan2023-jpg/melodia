import type { DecodedNote } from "./types";

const NOTE_LETTER_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const TICKS_PER_QUARTER = 480;
const DEFAULT_BPM = 100;

/** "C#4" / "Bb3" -> MIDI note number (60 = middle C). */
export function pitchNameToMidi(name: string): number {
  const match = /^([A-G])(#|b)?(-?\d+)$/.exec(name);
  if (!match) return 60;
  const [, letter, accidental, octaveStr] = match;
  const semitone = NOTE_LETTER_SEMITONES[letter] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0);
  const octave = Number(octaveStr);
  return (octave + 1) * 12 + semitone;
}

function writeVarLen(value: number): number[] {
  const bytes: number[] = [value & 0x7f];
  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>= 7;
  }
  return bytes;
}

function u32(n: number): number[] {
  return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function u16(n: number): number[] {
  return [(n >> 8) & 0xff, n & 0xff];
}

/** Builds a single-track, format-0 Standard MIDI File from the decoded notes. */
export function notesToMidiBytes(notes: DecodedNote[], bpm: number | null): Uint8Array {
  const microsecondsPerQuarter = Math.round(60_000_000 / (bpm || DEFAULT_BPM));

  const events: number[] = [];
  // Tempo meta event, at time 0.
  events.push(...writeVarLen(0), 0xff, 0x51, 0x03, (microsecondsPerQuarter >> 16) & 0xff, (microsecondsPerQuarter >> 8) & 0xff, microsecondsPerQuarter & 0xff);

  // Convert each note into a note-on and note-off event, sorted into a
  // single time-ordered stream (required by the SMF spec).
  type RawEvent = { tick: number; bytes: number[] };
  const raw: RawEvent[] = [];
  for (const note of notes) {
    const midi = pitchNameToMidi(note.name);
    const startTick = Math.round(note.beat * TICKS_PER_QUARTER);
    const endTick = Math.round((note.beat + note.durationBeats) * TICKS_PER_QUARTER);
    raw.push({ tick: startTick, bytes: [0x90, midi, 96] }); // note on, channel 0
    raw.push({ tick: endTick, bytes: [0x80, midi, 0] }); // note off
  }
  raw.sort((a, b) => a.tick - b.tick);

  let lastTick = 0;
  for (const event of raw) {
    events.push(...writeVarLen(event.tick - lastTick), ...event.bytes);
    lastTick = event.tick;
  }
  events.push(...writeVarLen(0), 0xff, 0x2f, 0x00); // end of track

  const header = [0x4d, 0x54, 0x68, 0x64, ...u32(6), ...u16(0), ...u16(1), ...u16(TICKS_PER_QUARTER)];
  const track = [0x4d, 0x54, 0x72, 0x6b, ...u32(events.length), ...events];

  return new Uint8Array([...header, ...track]);
}
