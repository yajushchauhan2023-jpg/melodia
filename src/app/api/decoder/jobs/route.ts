import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { hasPremiumAccess } from "@/lib/subscriptions";
import { validateDecoderFile } from "@/lib/decoder/validation";
import { submitDecodeJob, OmrServiceError } from "@/lib/decoder/omr-client";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!hasPremiumAccess(user)) {
    return NextResponse.json({ error: "This feature needs an active plan." }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }

  const fileName = "name" in file && typeof file.name === "string" ? file.name : "upload";
  const validation = validateDecoderFile({ type: file.type, size: file.size, name: fileName });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const job = await prisma.decodeJob.create({
    data: {
      userId,
      status: "uploaded",
      fileName,
      fileType: file.type,
      fileSizeBytes: file.size
    }
  });

  try {
    await submitDecodeJob({ jobId: job.id, file, fileName, contentType: file.type });
  } catch (error) {
    const message =
      error instanceof OmrServiceError
        ? "We couldn't start reading your sheet music right now. Please try again in a moment."
        : "Something went wrong starting the decode. Please try again.";
    await prisma.decodeJob.update({ where: { id: job.id }, data: { status: "failed", errorMessage: message } });
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await prisma.decodeJob.update({ where: { id: job.id }, data: { status: "processing" } });

  return NextResponse.json({ jobId: job.id });
}
