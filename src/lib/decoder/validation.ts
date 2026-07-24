// Upload validation rules, shared by the client (for instant feedback before
// a single byte is sent) and the API route (source of truth — never trust
// the client). Keep this the single place these limits are defined.

export const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

// Images and PDFs get different ceilings: a phone photo is rarely more than a
// few MB, but a multi-page scanned PDF legitimately can be much larger.
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_PDF_BYTES = 40 * 1024 * 1024; // 40 MB

export interface FileValidationResult {
  ok: boolean;
  /** Friendly, user-facing message — never a technical error string. */
  message?: string;
}

export function validateDecoderFile(file: { type: string; size: number; name: string }): FileValidationResult {
  const type = file.type || guessMimeFromName(file.name);

  if (!ACCEPTED_MIME_TYPES.includes(type as (typeof ACCEPTED_MIME_TYPES)[number])) {
    return {
      ok: false,
      message: "That file type isn't supported yet. Please upload a JPG, PNG, WEBP photo, or a PDF of your sheet music."
    };
  }

  const isPdf = type === "application/pdf";
  const limit = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    const limitMb = Math.round(limit / (1024 * 1024));
    return {
      ok: false,
      message: `That file is a bit too large (max ${limitMb}MB for ${isPdf ? "PDFs" : "images"}). Try a smaller file or a lower-resolution scan.`
    };
  }

  if (file.size === 0) {
    return { ok: false, message: "That file looks empty. Please choose a different file." };
  }

  return { ok: true };
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "";
}
