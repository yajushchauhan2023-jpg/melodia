"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DecodeJobSummary, DecodedMusic } from "@/lib/decoder/types";
import { UploadPanel } from "./UploadPanel";
import { ProcessingPanel } from "./ProcessingPanel";
import { ResultsPanel } from "./ResultsPanel";
import { ErrorPanel } from "./ErrorPanel";

type Stage = "idle" | "uploading" | "processing" | "results" | "error";

const POLL_INTERVAL_MS = 1800;
const GENERIC_ERROR = "Something went wrong on our end. Please try again in a moment.";

export function DecoderExperience() {
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [result, setResult] = useState<DecodedMusic | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    setStage("idle");
    setUploadProgress(null);
    setResult(null);
    setErrorMessage("");
  }, []);

  useEffect(() => () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
  }, []);

  const pollJob = useCallback((jobId: string) => {
    async function tick() {
      let response: Response;
      try {
        response = await fetch(`/api/decoder/jobs/${jobId}`);
      } catch {
        // A transient network hiccup shouldn't fail the whole job — just retry.
        pollTimer.current = setTimeout(tick, POLL_INTERVAL_MS);
        return;
      }

      if (!response.ok) {
        setErrorMessage(GENERIC_ERROR);
        setStage("error");
        return;
      }

      const data: DecodeJobSummary = await response.json();
      if (data.status === "completed" && data.result) {
        setResult(data.result);
        setStage("results");
      } else if (data.status === "failed") {
        setErrorMessage(data.errorMessage || GENERIC_ERROR);
        setStage("error");
      } else {
        pollTimer.current = setTimeout(tick, POLL_INTERVAL_MS);
      }
    }
    tick();
  }, []);

  const handleFileSelected = useCallback(
    (file: File) => {
      setFileName(file.name);
      setStage("uploading");
      setUploadProgress(0);

      const form = new FormData();
      form.append("file", file);

      // Plain fetch() has no upload-progress event, so XHR is used here
      // specifically to drive the "Show upload progress" requirement.
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/decoder/jobs");
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        let data: { jobId?: string; error?: string } = {};
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          // fall through to the generic error below
        }
        if (xhr.status >= 200 && xhr.status < 300 && data.jobId) {
          setStage("processing");
          pollJob(data.jobId);
        } else {
          setErrorMessage(data.error || GENERIC_ERROR);
          setStage("error");
        }
      };
      xhr.onerror = () => {
        setErrorMessage("Upload failed. Please check your connection and try again.");
        setStage("error");
      };
      xhr.send(form);
    },
    [pollJob]
  );

  return (
    <div className="decoder-experience">
      {(stage === "idle" || stage === "uploading") && (
        <UploadPanel onFileSelected={handleFileSelected} uploadProgress={stage === "uploading" ? uploadProgress : null} />
      )}
      {stage === "processing" && <ProcessingPanel fileName={fileName} />}
      {stage === "results" && result && <ResultsPanel result={result} fileName={fileName} onStartOver={reset} />}
      {stage === "error" && <ErrorPanel message={errorMessage} onTryAgain={reset} />}
    </div>
  );
}
