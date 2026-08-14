import type { DecodedNote } from "./types";

// --- Standard MIDI File reader -------------------------------------------
// Parses format-0/format-1 SMF bytes into an absolute-tick event stream,
// then reduces that into the same DecodedNote[] shape the MusicXML path
// produces, so everything downstream (ScoreView, Beginner Mode, playback,
// export) works identically regardless of which format was uploaded.

interface RawNoteEvent {
  type: "on" | "off";
  tick: number;
  channel: number;
  pitch: number;
}

interface ParsedMidi {
  division: number; // ticks per quarter note
  tempoBpm: number | null;
  timeSignature: string | null;
  noteEvents: RawNoteEvent[];
}

export class MidiParseError extends Error {}

export function parseMidiFile(buffer: ArrayBuffer): ParsedMidi {
  const bytes = new Uint8Array(buffer);
  const reader = new ByteReader(bytes);

  if (reader.readAscii(4) !== "MThd") {
    throw new MidiParseError("Not a Standard MIDI File (missing MThd header).");
  }
  const headerLength = reader.readUint32();
  const headerStart = reader.pos;
  const format = reader.readUint16();
  const trackCount = reader.readUint16();
  const divisionRaw = reader.readUint16();
  reader.pos = headerStart + headerLength; // tolerate a longer-than-expected header

  if (divisionRaw & 0x8000) {
    // SMPTE time code division — rare for hand-authored/exported files. Fall
    // back to a conventional 480 ticks/quarter rather than failing outright.
    // eslint-disable-next-line no-console
    console.warn("SMPTE-division MIDI file; falling back to 480 ticks/quarter.");
  }
  const division = divisionRaw & 0x8000 ? 480 : divisionRaw;

  let tempoBpm: number | null = null;
  let timeSignature: string | null = null;
  const noteEvents: RawNoteEvent[] = [];

  for (let t = 0; t < trackCount; t++) {
    if (reader.remaining() < 8) break;
    const chunkType = reader.readAscii(4);
    const chunkLength = reader.readUint32();
    const chunkEnd = reader.pos + chunkLength;
    if (chunkType !== "MTrk") {
      reader.pos = chunkEnd; // skip unknown chunk types
      continue;
    }

    let tick = 0;
    let runningStatus = 0;

    while (reader.pos < chunkEnd) {
      tick += reader.readVarLen();
      let status = reader.peekByte();

      if (status < 0x80) {
        // Running status: reuse the previous status byte, this byte is data.
        status = runningStatus;
      } else {
        status = reader.readByte();
        runningStatus = status;
      }

      const type = status & 0xf0;
      const channel = status & 0x0f;

      if (status === 0xff) {
        // Meta event
        const metaType = reader.readByte();
        const length = reader.readVarLen();
        const start = reader.pos;
        if (metaType === 0x51 && length === 3) {
          const microsecondsPerQuarter = (reader.bytes[start] << 16) | (reader.bytes[start + 1] << 8) | reader.bytes[start + 2];
          if (microsecondsPerQuarter > 0 && tempoBpm === null) {
            tempoBpm = Math.round(60_000_000 / microsecondsPerQuarter);
          }
        } else if (metaType === 0x58 && length === 4 && timeSignature === null) {
          const numerator = reader.bytes[start];
          const denominator = 2 ** reader.bytes[start + 1];
          timeSignature = `${numerator}/${denominator}`;
        }
        reader.pos = start + length;
      } else if (status === 0xf0 || status === 0xf7) {
        // SysEx
        const length = reader.readVarLen();
        reader.pos += length;
      } else if (type === 0x90) {
        // Note on (velocity 0 is a note-off in disguise, per spec)
        const pitch = reader.readByte();
        const velocity = reader.readByte();
        noteEvents.push({ type: velocity === 0 ? "off" : "on", tick, channel, pitch });
      } else if (type === 0x80) {
        const pitch = reader.readByte();
        reader.readByte(); // release velocity, unused
        noteEvents.push({ type: "off", tick, channel, pitch });
      } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) {
        reader.readByte();
        reader.readByte();
      } else if (type === 0xc0 || type === 0xd0) {
        reader.readByte();
      } else {
        // Unknown/unsupported status byte — bail out of this track rather
        // than reading garbage as if it were events.
        break;
      }
    }
    reader.pos = chunkEnd;
  }

  if (noteEvents.length === 0) {
    throw new MidiParseError("No note events found in this MIDI file.");
  }

  return { division, tempoBpm, timeSignature, noteEvents };
}

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToPitchName(midi: number): { name: string; letter: string } {
  const letterWithAccidental = SHARP_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  const letter = letterWithAccidental[0];
  return { name: `${letterWithAccidental}${octave}`, letter };
}

/**
 * Reduces a parsed MIDI file's note-on/note-off stream into the same
 * DecodedNote[] shape MusicXML parsing produces (beat position + duration in
 * quarter-note units), so both upload paths feed one rendering pipeline.
 * Overlapping notes on different channels/pitches (chords, multiple tracks)
 * are all kept — silence between the loudest single melodic line isn't
 * assumed, since we can't reliably tell "melody" from "accompaniment".
 */
export function midiToDecodedNotes(parsed: ParsedMidi): { notes: DecodedNote[]; measureCount: number } {
  const { division, noteEvents, timeSignature } = parsed;

  // Match each note-on to its next note-off on the same channel+pitch.
  const open = new Map<string, number[]>(); // "channel:pitch" -> stack of on-ticks
  const notes: { startTick: number; endTick: number; pitch: number }[] = [];

  const sorted = [...noteEvents].sort((a, b) => a.tick - b.tick);
  for (const event of sorted) {
    const key = `${event.channel}:${event.pitch}`;
    if (event.type === "on") {
      const stack = open.get(key) ?? [];
      stack.push(event.tick);
      open.set(key, stack);
    } else {
      const stack = open.get(key);
      const startTick = stack?.shift();
      if (startTick !== undefined && event.tick > startTick) {
        notes.push({ startTick, endTick: event.tick, pitch: event.pitch });
      }
    }
  }

  if (notes.length === 0) {
    throw new MidiParseError("Couldn't match any complete notes in this MIDI file.");
  }

  notes.sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);

  const [beatsPerMeasureNum, beatsPerMeasureDen] = (timeSignature ?? "4/4").split("/").map(Number);
  const quarterBeatsPerMeasure = beatsPerMeasureNum * (4 / beatsPerMeasureDen);

  let maxMeasure = 1;
  const decoded: DecodedNote[] = notes.map((n) => {
    const beat = n.startTick / division;
    const durationBeats = Math.max((n.endTick - n.startTick) / division, 1 / 16);
    const measureNumber = Math.floor(beat / quarterBeatsPerMeasure) + 1;
    maxMeasure = Math.max(maxMeasure, measureNumber);
    const { name, letter } = midiToPitchName(n.pitch);
    return { name, letter, beat, durationBeats, measureNumber };
  });

  return { notes: decoded, measureCount: maxMeasure };
}

class ByteReader {
  pos = 0;
  constructor(public bytes: Uint8Array) {}

  remaining() {
    return this.bytes.length - this.pos;
  }
  readByte(): number {
    return this.bytes[this.pos++];
  }
  peekByte(): number {
    return this.bytes[this.pos];
  }
  readAscii(length: number): string {
    let s = "";
    for (let i = 0; i < length; i++) s += String.fromCharCode(this.readByte());
    return s;
  }
  readUint16(): number {
    const v = (this.bytes[this.pos] << 8) | this.bytes[this.pos + 1];
    this.pos += 2;
    return v;
  }
  readUint32(): number {
    const v =
      (this.bytes[this.pos] << 24) | (this.bytes[this.pos + 1] << 16) | (this.bytes[this.pos + 2] << 8) | this.bytes[this.pos + 3];
    this.pos += 4;
    return v >>> 0;
  }
  readVarLen(): number {
    let value = 0;
    let byte: number;
    do {
      byte = this.readByte();
      value = (value << 7) | (byte & 0x7f);
    } while (byte & 0x80);
    return value;
  }
}
