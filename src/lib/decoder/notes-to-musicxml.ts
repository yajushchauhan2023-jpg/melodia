import type { DecodedNote } from "./types";

// Builds a minimal, valid MusicXML document from an already-decoded note
// list. Used for the MIDI upload path: MIDI has no visual staff to
// recognize, but rendering through the same OpenSheetMusicDisplay pipeline
// as every other upload keeps the results screen, Beginner Mode, and
// playback identical regardless of source format.
//
// Timing is quantized to 16th-note resolution (divisions=4). MIDI performed
// with human timing (rubato, swing, live playback) will not quantize
// perfectly — this is a known, documented limitation, not a silent
// approximation pretending to be exact.

const DIVISIONS = 4; // units per quarter note -> supports down to a 16th note

// Largest-to-smallest so the greedy decomposition below always terminates
// (1 unit / a 16th note is always available as a last resort).
const NOTE_VALUES: { units: number; type: string; dots: number }[] = [
  { units: 16, type: "whole", dots: 0 },
  { units: 12, type: "half", dots: 1 },
  { units: 8, type: "half", dots: 0 },
  { units: 6, type: "quarter", dots: 1 },
  { units: 4, type: "quarter", dots: 0 },
  { units: 3, type: "eighth", dots: 1 },
  { units: 2, type: "eighth", dots: 0 },
  { units: 1, type: "16th", dots: 0 }
];

function decomposeUnits(units: number): { units: number; type: string; dots: number }[] {
  const pieces: { units: number; type: string; dots: number }[] = [];
  let remaining = Math.max(1, Math.round(units));
  // Guard against pathological input producing an unbounded loop.
  let safety = 64;
  while (remaining > 0 && safety-- > 0) {
    const value = NOTE_VALUES.find((v) => v.units <= remaining)!;
    pieces.push(value);
    remaining -= value.units;
  }
  return pieces;
}

function pitchNameParts(name: string): { step: string; alter: number; octave: number } {
  const match = /^([A-G])(#|b)?(-?\d+)$/.exec(name);
  if (!match) return { step: "C", alter: 0, octave: 4 };
  const [, step, accidental, octaveStr] = match;
  return { step, alter: accidental === "#" ? 1 : accidental === "b" ? -1 : 0, octave: Number(octaveStr) };
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function notesToMusicXml(params: {
  notes: DecodedNote[];
  tempo: number | null;
  timeSignature: string | null;
  measureCount: number;
  title?: string;
}): string {
  const { notes, tempo, measureCount, title } = params;
  const timeSignature = params.timeSignature ?? "4/4";
  const [beatsNum, beatsDen] = timeSignature.split("/").map(Number);
  const quarterBeatsPerMeasure = beatsNum * (4 / beatsDen);
  const measureUnits = Math.round(quarterBeatsPerMeasure * DIVISIONS);

  const notesByMeasure = new Map<number, DecodedNote[]>();
  for (const note of notes) {
    const list = notesByMeasure.get(note.measureNumber) ?? [];
    list.push(note);
    notesByMeasure.set(note.measureNumber, list);
  }
  for (const list of notesByMeasure.values()) list.sort((a, b) => a.beat - b.beat);

  const measuresXml: string[] = [];
  for (let m = 1; m <= Math.max(1, measureCount); m++) {
    const measureStartBeat = (m - 1) * quarterBeatsPerMeasure;
    const measureNotes = notesByMeasure.get(m) ?? [];

    // Notes that start at (effectively) the same tick are a chord and must
    // be grouped so only the first gets a plain <note>, the rest get
    // <chord/> — otherwise MusicXML has no way to know they're
    // simultaneous and will render/play them one after another instead.
    const groups: { localStartUnits: number; notes: DecodedNote[] }[] = [];
    for (const note of measureNotes) {
      const localStartUnits = Math.round((note.beat - measureStartBeat) * DIVISIONS);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.localStartUnits === localStartUnits) {
        lastGroup.notes.push(note);
      } else {
        groups.push({ localStartUnits, notes: [note] });
      }
    }

    let cursorUnits = 0;
    const eventsXml: string[] = [];

    for (const group of groups) {
      const gap = group.localStartUnits - cursorUnits;
      if (gap > 0) {
        for (const piece of decomposeUnits(gap)) {
          eventsXml.push(restXml(piece));
        }
      }

      let groupDurationUnits = 1;
      group.notes.forEach((note, noteIndexInGroup) => {
        // Clamp so a note can never push past the end of its measure — MIDI
        // timing that overruns a barline is truncated rather than tied
        // across measures, to keep this generator's XML unambiguous.
        const rawUnits = Math.round(note.durationBeats * DIVISIONS);
        const availableUnits = Math.max(1, measureUnits - Math.max(group.localStartUnits, 0));
        const durationUnits = Math.min(Math.max(1, rawUnits), availableUnits);
        groupDurationUnits = Math.max(groupDurationUnits, durationUnits);

        const pieces = decomposeUnits(durationUnits);
        pieces.forEach((piece, i) => {
          // Only the first piece of a note can be simultaneous with other
          // group members — its own later tied continuations happen after
          // the chord's onset and are never themselves a chord member.
          eventsXml.push(noteXml(note, piece, pieces.length > 1 ? i : -1, pieces.length, noteIndexInGroup > 0 && i === 0));
        });
      });

      cursorUnits = Math.max(cursorUnits, group.localStartUnits) + groupDurationUnits;
    }

    if (cursorUnits < measureUnits) {
      for (const piece of decomposeUnits(measureUnits - cursorUnits)) {
        eventsXml.push(restXml(piece));
      }
    }
    if (measureNotes.length === 0 && cursorUnits === 0) {
      // Fully empty measure (e.g. a gap in a MIDI track): still needs a rest.
      for (const piece of decomposeUnits(measureUnits)) eventsXml.push(restXml(piece));
    }

    const attributesXml =
      m === 1
        ? `<attributes><divisions>${DIVISIONS}</divisions><key><fifths>0</fifths></key><time><beats>${beatsNum}</beats><beat-type>${beatsDen}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>` +
          (tempo ? `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${tempo}</per-minute></metronome></direction-type><sound tempo="${tempo}"/></direction>` : "")
        : "";

    measuresXml.push(`<measure number="${m}">${attributesXml}${eventsXml.join("")}</measure>`);
  }

  const titleXml = title ? `<work><work-title>${escapeXml(title)}</work-title></work>` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">${titleXml}<part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list><part id="P1">${measuresXml.join("")}</part></score-partwise>`;
}

function restXml(piece: { units: number; type: string; dots: number }): string {
  return `<note><rest/><duration>${piece.units}</duration><type>${piece.type}</type>${"<dot/>".repeat(piece.dots)}</note>`;
}

function noteXml(
  note: DecodedNote,
  piece: { units: number; type: string; dots: number },
  tieIndex: number,
  tieCount: number,
  isChordMember: boolean
): string {
  const { step, alter, octave } = pitchNameParts(note.name);
  const alterXml = alter !== 0 ? `<alter>${alter}</alter>` : "";
  const accidentalXml = alter === 1 ? "<accidental>sharp</accidental>" : alter === -1 ? "<accidental>flat</accidental>" : "";
  // <chord/> must come before <pitch> per the MusicXML element order, and
  // marks every note in a simultaneous group after the first one — that's
  // what makes them play together instead of one after another.
  const chordXml = isChordMember ? "<chord/>" : "";

  let tieXml = "";
  let notationsXml = "";
  if (tieCount > 1) {
    if (tieIndex === 0) {
      tieXml = `<tie type="start"/>`;
      notationsXml = `<notations><tied type="start"/></notations>`;
    } else if (tieIndex === tieCount - 1) {
      tieXml = `<tie type="stop"/>`;
      notationsXml = `<notations><tied type="stop"/></notations>`;
    } else {
      tieXml = `<tie type="stop"/><tie type="start"/>`;
      notationsXml = `<notations><tied type="stop"/><tied type="start"/></notations>`;
    }
  }

  return `<note>${chordXml}<pitch><step>${step}</step>${alterXml}<octave>${octave}</octave></pitch><duration>${piece.units}</duration>${tieXml}<type>${piece.type}</type>${"<dot/>".repeat(piece.dots)}${accidentalXml}${notationsXml}</note>`;
}
