// Upload validation rules, shared by the client (for instant feedback before
// a single byte is sent) and the API route (source of truth — never trust
// the client). Keep this the single place these limits are defined.

// Image/PDF go through the OMR (photo/scan recognition) pipeline. MusicXML
// and MIDI are already structured music data, so they skip OMR entirely and
// are parsed directly — see DecoderFileKind / getDecoderFileKind below.
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PDF_MIME_TYPE = "application/pdf";
export const MUSICXML_MIME_TYPES = [
  "application/vnd.recordare.musicxml+xml",
  "application/xml",
  "text/xml"
] as const;
export const MIDI_MIME_TYPES = ["audio/midi", "audio/x-midi", "audio/mid"] as const;

export const ACCEPTED_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  PDF_MIME_TYPE,
  ...MUSICXML_MIME_TYPES,
  ...MIDI_MIME_TYPES
] as const;

export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".xml", ".musicxml", ".mid", ".midi"];

export type DecoderFileKind = "image" | "pdf" | "musicxml" | "midi";

// Images and PDFs get different ceilings: a phone photo is rarely more than a
// few MB, but a multi-page scanned PDF legitimately can be much larger.
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_PDF_BYTES = 40 * 1024 * 1024; // 40 MB
// MusicXML/MIDI are plain structured data — a few MB is already an enormous
// score, so a much smaller ceiling both catches mistakes (wrong file picked)
// and keeps parsing fast.
export const MAX_STRUCTURED_BYTES = 8 * 1024 * 1024; // 8 MB

export interface FileValidationResult {
  ok: boolean;
  /** Friendly, user-facing message — never a technical error string. */
  message?: string;
  kind?: DecoderFileKind;
}

export function validateDecoderFile(file: { type: string; size: number; name: string }): FileValidationResult {
  const type = file.type || guessMimeFromName(file.name);
  const kind = kindForType(type, file.name);

  if (!kind) {
    return {
      ok: false,
      message: "That file type isn't supported yet. Please upload a JPG, PNG, WEBP photo, a PDF, a MusicXML file, or a MIDI file."
    };
  }

  const limit = kind === "pdf" ? MAX_PDF_BYTES : kind === "image" ? MAX_IMAGE_BYTES : MAX_STRUCTURED_BYTES;
  if (file.size > limit) {
    const limitMb = Math.round(limit / (1024 * 1024));
    const label = kind === "pdf" ? "PDFs" : kind === "image" ? "images" : "MusicXML/MIDI files";
    return {
      ok: false,
      message: `That file is a bit too large (max ${limitMb}MB for ${label}). Try a smaller file.`
    };
  }

  if (file.size === 0) {
    return { ok: false, message: "That file looks empty. Please choose a different file." };
  }

  return { ok: true, kind };
}

/** Determines which processing path a validated upload should take. */
export function getDecoderFileKind(file: { type: string; name: string }): DecoderFileKind | null {
  const type = file.type || guessMimeFromName(file.name);
  return kindForType(type, file.name);
}

function kindForType(type: string, name: string): DecoderFileKind | null {
  const lower = name.toLowerCase();

  if ((IMAGE_MIME_TYPES as readonly string[]).includes(type)) return "image";
  if (type === PDF_MIME_TYPE) return "pdf";

  // MIDI and MusicXML files are frequently served/selected with a generic
  // "application/octet-stream" or empty MIME type depending on OS, so the
  // extension is the more reliable signal for these two.
  if (lower.endsWith(".mid") || lower.endsWith(".midi") || (MIDI_MIME_TYPES as readonly string[]).includes(type)) {
    return "midi";
  }
  if (
    lower.endsWith(".musicxml") ||
    lower.endsWith(".xml") ||
    (MUSICXML_MIME_TYPES as readonly string[]).includes(type)
  ) {
    return "musicxml";
  }

  return null;
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".musicxml")) return "application/vnd.recordare.musicxml+xml";
  if (lower.endsWith(".xml")) return "text/xml";
  if (lower.endsWith(".mid") || lower.endsWith(".midi")) return "audio/midi";
  return "";
}
