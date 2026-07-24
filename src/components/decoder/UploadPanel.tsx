"use client";

import { useCallback, useRef, useState } from "react";
import { ACCEPTED_EXTENSIONS, validateDecoderFile } from "@/lib/decoder/validation";

export function UploadPanel({
  onFileSelected,
  uploadProgress
}: {
  onFileSelected: (file: File) => void;
  /** 0-100 while a file is uploading, or null when idle. */
  uploadProgress: number | null;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const result = validateDecoderFile(file);
      if (!result.ok) {
        setValidationError(result.message || "That file can't be used.");
        return;
      }
      setValidationError(null);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const uploading = uploadProgress !== null;

  return (
    <div className="card decoder-upload-card">
      <div
        className={`decoder-dropzone${dragActive ? " active" : ""}${uploading ? " busy" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (!uploading) handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!uploading && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {uploading ? (
          <>
            <div className="decoder-dropzone-icon">📤</div>
            <p className="decoder-dropzone-title">Uploading your sheet music...</p>
            <div className="progress decoder-upload-progress">
              <span style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="decoder-upload-percent">{uploadProgress}%</p>
          </>
        ) : (
          <>
            <div className="decoder-dropzone-icon">🎼</div>
            <p className="decoder-dropzone-title">Drag and drop your sheet music here</p>
            <p>or click to browse — JPG, PNG, WEBP, or PDF</p>
            <span className="button decoder-browse-button">
              Choose a file
            </span>
          </>
        )}
      </div>

      {validationError && <p className="inline-message error">{validationError}</p>}

      <p className="decoder-upload-hint">
        Tip: flat pages, even lighting, and the whole staff in frame give the most accurate results.
      </p>
    </div>
  );
}
