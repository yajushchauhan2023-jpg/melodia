import { NextRequest, NextResponse } from "next/server";
import { requiredEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { parseMusicXml } from "@/lib/decoder/musicxml";

// Internal failure reasons the OMR service can report, mapped to friendly,
// non-technical copy. Anything not in this table falls through to a generic
// friendly message — the user should never see a stack trace or engine name.
const FRIENDLY_ERRORS: Record<string, string> = {
  low_confidence:
    "We had trouble reading this sheet music clearly. Try taking another photo in good lighting, with the page flat and the camera directly above it.",
  no_notation_detected:
    "We couldn't find any musical notation in that file. Please check it's a photo or scan of sheet music and try again.",
  unsupported_page_count:
    "That PDF has too many pages for us to process at once. Try uploading it as a single page or a shorter excerpt.",
  corrupt_file: "That file looks damaged or couldn't be opened. Please try uploading it again.",
  timeout: "This is taking longer than expected. Please try again with a clearer or smaller file."
};
const DEFAULT_FRIENDLY_ERROR = "We couldn't decode that file. Please try another photo or scan with better lighting.";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!body || body.callback_secret !== requiredEnv("OMR_CALLBACK_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = await prisma.decodeJob.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  if (body.status === "failed") {
    const friendlyMessage = FRIENDLY_ERRORS[body.error_reason as string] || DEFAULT_FRIENDLY_ERROR;
    await prisma.decodeJob.update({
      where: { id },
      data: { status: "failed", errorMessage: friendlyMessage }
    });
    return NextResponse.json({ ok: true });
  }

  const musicXml: string | undefined = body.music_xml;
  if (!musicXml) {
    await prisma.decodeJob.update({
      where: { id },
      data: { status: "failed", errorMessage: DEFAULT_FRIENDLY_ERROR }
    });
    return NextResponse.json({ ok: true });
  }

  try {
    const parsed = parseMusicXml(musicXml);
    await prisma.decodeJob.update({
      where: { id },
      data: {
        status: "completed",
        musicXml: parsed.musicXml,
        keySignature: parsed.keySignature,
        timeSignature: parsed.timeSignature,
        tempo: parsed.tempo,
        measureCount: parsed.measureCount,
        noteNamesJson: JSON.stringify(parsed.notes)
      }
    });
  } catch {
    // The OMR service said "success" but produced something we can't parse —
    // treat it as a decode failure rather than surfacing a parser error.
    await prisma.decodeJob.update({
      where: { id },
      data: { status: "failed", errorMessage: DEFAULT_FRIENDLY_ERROR }
    });
  }

  return NextResponse.json({ ok: true });
}
