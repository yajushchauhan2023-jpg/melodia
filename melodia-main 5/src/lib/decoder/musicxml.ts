import { XMLParser } from "fast-xml-parser";
import type { DecodedMusic, DecodedNote } from "./types";

// Circle-of-fifths -> major key name. MusicXML's <key><fifths> only tells us
// the number of sharps/flats, not major vs. minor, so we report the major
// key name (the conventional default when mode isn't explicitly given).
const FIFTHS_TO_KEY: Record<number, string> = {
  [-7]: "Cb major", [-6]: "Gb major", [-5]: "Db major", [-4]: "Ab major",
  [-3]: "Eb major", [-2]: "Bb major", [-1]: "F major", [0]: "C major",
  [1]: "G major", [2]: "D major", [3]: "A major", [4]: "E major",
  [5]: "B major", [6]: "F# major", [7]: "C# major"
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // These elements can legitimately repeat — always normalize them to arrays
  // so downstream code doesn't have to special-case "one item vs. many".
  isArray: (name) => ["part", "measure", "note"].includes(name)
});

/**
 * Turns a raw MusicXML string into the structured summary + note list the
 * Results page and Beginner Mode need. Throws on genuinely malformed XML —
 * callers should catch that and show the friendly "couldn't read this file"
 * error state rather than a technical message.
 */
export function parseMusicXml(musicXml: string): DecodedMusic {
  const doc = xmlParser.parse(musicXml);
  const scorePart = doc["score-partwise"] ?? doc["score-timewise"];
  if (!scorePart) {
    throw new Error("Document has no <score-partwise> or <score-timewise> root — not valid MusicXML.");
  }

  const parts: any[] = Array.isArray(scorePart.part) ? scorePart.part : scorePart.part ? [scorePart.part] : [];
  const firstPart = parts[0];
  const measures: any[] = firstPart ? (Array.isArray(firstPart.measure) ? firstPart.measure : [firstPart.measure]) : [];

  let keySignature: string | null = null;
  let timeSignature: string | null = null;
  let tempo: number | null = null;
  let divisions = 1; // "divisions" = how many XML duration-units make one quarter note

  const notes: DecodedNote[] = [];
  let runningBeat = 0;

  for (const measure of measures) {
    if (!measure) continue;
    const measureNumber = Number(measure["@_number"]) || measures.indexOf(measure) + 1;

    const attributes = measure.attributes;
    if (attributes) {
      if (attributes.divisions) divisions = Number(attributes.divisions) || 1;
      if (attributes.key && keySignature === null) {
        const fifths = Number(attributes.key.fifths ?? 0);
        keySignature = FIFTHS_TO_KEY[fifths] ?? null;
      }
      if (attributes.time && timeSignature === null) {
        const beats = attributes.time.beats;
        const beatType = attributes.time["beat-type"];
        if (beats && beatType) timeSignature = `${beats}/${beatType}`;
      }
    }

    if (tempo === null) {
      const direction = measure.direction;
      const directions = Array.isArray(direction) ? direction : direction ? [direction] : [];
      for (const d of directions) {
        const sound = d?.sound;
        if (sound?.["@_tempo"]) {
          tempo = Math.round(Number(sound["@_tempo"]));
          break;
        }
      }
    }

    const measureNotes: any[] = Array.isArray(measure.note) ? measure.note : measure.note ? [measure.note] : [];
    for (const note of measureNotes) {
      const durationUnits = Number(note.duration ?? divisions);
      const durationBeats = durationUnits / divisions;

      // Rests advance the beat clock but aren't pitched, so they're skipped
      // in the note list (Beginner Mode only labels actual notes).
      if (note.rest === undefined && note.pitch) {
        const step: string = note.pitch.step;
        const octave: number = Number(note.pitch.octave);
        const alter = Number(note.pitch.alter ?? 0);
        const accidental = alter === 1 ? "#" : alter === -1 ? "b" : "";
        notes.push({
          name: `${step}${accidental}${octave}`,
          letter: step,
          beat: runningBeat,
          durationBeats,
          measureNumber
        });
      }

      // Chords (stacked notes at the same beat) are marked with a <chord/>
      // element and shouldn't advance the beat clock a second time.
      if (note.chord === undefined) {
        runningBeat += durationBeats;
      }
    }
  }

  return {
    musicXml,
    keySignature,
    timeSignature,
    tempo,
    measureCount: measures.length,
    notes
  };
}
