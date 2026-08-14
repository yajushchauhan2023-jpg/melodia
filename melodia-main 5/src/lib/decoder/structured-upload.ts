import type { DecodedMusic } from "./types";
import { parseMusicXml } from "./musicxml";
import { parseMidiFile, midiToDecodedNotes, MidiParseError } from "./midi-import";
import { notesToMusicXml } from "./notes-to-musicxml";

export class StructuredUploadError extends Error {}

/**
 * MusicXML and MIDI are already structured music data, not a photo that
 * needs recognition — so unlike image/PDF uploads, these never touch the
 * OMR service. They're parsed synchronously, right here, on upload.
 */
export async function decodeStructuredUpload(kind: "musicxml" | "midi", file: Blob, fileName: string): Promise<DecodedMusic> {
  if (kind === "musicxml") {
    const text = await file.text();
    try {
      return parseMusicXml(text);
    } catch {
      throw new StructuredUploadError(
        "We couldn't read that MusicXML file. Please confirm it's a valid, uncompressed .musicxml/.xml export."
      );
    }
  }

  // MIDI
  const buffer = await file.arrayBuffer();
  try {
    const parsed = parseMidiFile(buffer);
    const { notes, measureCount } = midiToDecodedNotes(parsed);
    const musicXml = notesToMusicXml({
      notes,
      tempo: parsed.tempoBpm,
      timeSignature: parsed.timeSignature,
      measureCount,
      title: fileName.replace(/\.(mid|midi)$/i, "")
    });
    return {
      musicXml,
      keySignature: null, // MIDI carries no reliable key-signature information
      timeSignature: parsed.timeSignature,
      tempo: parsed.tempoBpm,
      measureCount,
      notes
    };
  } catch (error) {
    if (error instanceof MidiParseError) {
      throw new StructuredUploadError(
        "We couldn't read that MIDI file. Please confirm it's a valid Standard MIDI File (.mid) and try again."
      );
    }
    throw new StructuredUploadError("We couldn't read that MIDI file. Please try another file.");
  }
}
