import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { DecodeJobSummary, DecodedNote } from "@/lib/decoder/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const job = await prisma.decodeJob.findUnique({ where: { id } });

  // Also 404 for jobs that belong to someone else, rather than 403 —
  // don't reveal that a job with this id exists at all.
  if (!job || job.userId !== userId) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const summary: DecodeJobSummary = {
    id: job.id,
    status: job.status,
    fileName: job.fileName
  };

  if (job.status === "completed" && job.musicXml) {
    let notes: DecodedNote[] = [];
    try {
      notes = job.noteNamesJson ? JSON.parse(job.noteNamesJson) : [];
    } catch {
      notes = [];
    }
    summary.result = {
      musicXml: job.musicXml,
      keySignature: job.keySignature,
      timeSignature: job.timeSignature,
      tempo: job.tempo,
      measureCount: job.measureCount ?? 0,
      notes
    };
  }

  if (job.status === "failed") {
    summary.errorMessage = job.errorMessage || "We couldn't decode that file. Please try another photo or scan.";
  }

  return NextResponse.json(summary);
}
