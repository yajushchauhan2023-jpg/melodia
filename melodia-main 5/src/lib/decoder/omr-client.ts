import { requiredEnv, appUrl } from "@/lib/env";

/**
 * The OMR (Optical Music Recognition) engine lives in a separate,
 * always-on Python service (see /omr-service) rather than inline in this
 * Next.js app, because:
 *
 *  1. OMR is genuinely slow (seconds to a few minutes for a full page) and
 *     CPU/GPU-heavy — far outside what a serverless API route should hold
 *     a request open for.
 *  2. The underlying library (oemer — see /omr-service/README.md for why
 *     it was chosen over Audiveris) is Python + ONNX, not something with a
 *     Node equivalent worth reimplementing.
 *
 * The flow is fire-and-forget + callback, not request/response:
 *   1. We POST the file to the OMR service with a callback URL + job id.
 *   2. The OMR service responds immediately (202) once the file is queued.
 *   3. It calls back POST /api/decoder/jobs/[id]/callback when finished,
 *      with either the resulting MusicXML or a failure reason.
 * This is what lets the browser poll a cheap status endpoint instead of
 * blocking on a single long HTTP request (see DecoderExperience.tsx).
 */

export class OmrServiceError extends Error {}

export async function submitDecodeJob(params: { jobId: string; file: Blob; fileName: string; contentType: string }) {
  const serviceUrl = requiredEnv("OMR_SERVICE_URL");
  const callbackSecret = requiredEnv("OMR_CALLBACK_SECRET");

  const form = new FormData();
  form.append("file", params.file, params.fileName);
  form.append("job_id", params.jobId);
  form.append("callback_url", `${appUrl}/api/decoder/jobs/${params.jobId}/callback`);
  form.append("callback_secret", callbackSecret);
  form.append("content_type", params.contentType);

  let response: Response;
  try {
    response = await fetch(`${serviceUrl}/decode`, { method: "POST", body: form });
  } catch {
    throw new OmrServiceError("Could not reach the sheet music recognition service.");
  }

  if (!response.ok) {
    throw new OmrServiceError(`OMR service rejected the job (status ${response.status}).`);
  }
}
