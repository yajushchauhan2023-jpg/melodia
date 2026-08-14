"""
Melodia OMR service.

Wraps oemer (see README.md for why it was chosen) behind a small async
HTTP API. The Next.js app calls POST /decode and gets an immediate 202;
this service does the actual recognition work in the background and
reports the result back to the callback URL it was given. See README.md
for the full request-flow diagram and library justification.
"""

import logging
import os
import tempfile
from pathlib import Path

import httpx
from fastapi import BackgroundTasks, FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("melodia-omr")

app = FastAPI(title="Melodia OMR Service")

MAX_PDF_PAGES = 8  # keep processing time and memory bounded for large PDFs


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/decode", status_code=202)
async def decode(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    job_id: str = Form(...),
    callback_url: str = Form(...),
    callback_secret: str = Form(...),
    content_type: str = Form(...),
):
    # Persist the upload to a temp file immediately — we return before
    # processing finishes, so we can't rely on the UploadFile's stream
    # staying open.
    suffix = Path(file.filename or "upload").suffix or _suffix_for(content_type)
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    background_tasks.add_task(process_job, tmp_path, content_type, job_id, callback_url, callback_secret)
    return {"queued": True}


async def process_job(file_path: str, content_type: str, job_id: str, callback_url: str, callback_secret: str):
    try:
        image_paths = _to_page_images(file_path, content_type)
    except TooManyPagesError:
        await _report(callback_url, job_id, callback_secret, status="failed", error_reason="unsupported_page_count")
        return
    except Exception:
        logger.exception("Failed to prepare pages for job %s", job_id)
        await _report(callback_url, job_id, callback_secret, status="failed", error_reason="corrupt_file")
        return

    try:
        # MVP: recognize the first page. Multi-page stitching (concatenating
        # each page's measures into one continuous MusicXML part) is a
        # natural next step but adds real complexity around part/measure
        # numbering that's out of scope for this pass.
        music_xml = run_omr(image_paths[0])
    except NoNotationDetectedError:
        await _report(callback_url, job_id, callback_secret, status="failed", error_reason="no_notation_detected")
        return
    except Exception:
        logger.exception("oemer failed for job %s", job_id)
        await _report(callback_url, job_id, callback_secret, status="failed", error_reason="low_confidence")
        return
    finally:
        for p in image_paths:
            _safe_delete(p)
        _safe_delete(file_path)

    await _report(callback_url, job_id, callback_secret, status="completed", music_xml=music_xml)


def run_omr(image_path: str) -> str:
    """Runs oemer on a single page image and returns the resulting MusicXML."""
    # Imported lazily so the FastAPI process can boot (and answer /health)
    # even before oemer's model checkpoints have finished downloading.
    from oemer.ete import extract  # type: ignore

    output_dir = tempfile.mkdtemp(prefix="oemer-out-")
    result_path = extract(image_path, output_dir)  # returns path to the generated .musicxml

    if not result_path or not os.path.exists(result_path):
        raise NoNotationDetectedError()

    with open(result_path, "r", encoding="utf-8") as f:
        xml = f.read()

    if "<note" not in xml:
        # oemer ran without error but found nothing pitched on the page —
        # treat that the same as "couldn't find notation" for the user.
        raise NoNotationDetectedError()

    return xml


def _to_page_images(file_path: str, content_type: str) -> list[str]:
    if content_type == "application/pdf":
        from pdf2image import convert_from_path

        pages = convert_from_path(file_path, dpi=300)
        if len(pages) > MAX_PDF_PAGES:
            raise TooManyPagesError()
        paths = []
        for i, page in enumerate(pages):
            out_path = f"{file_path}.page{i}.png"
            page.save(out_path, "PNG")
            paths.append(out_path)
        return paths

    # Already an image (JPG/PNG/WEBP) — oemer reads these directly.
    return [file_path]


async def _report(callback_url: str, job_id: str, callback_secret: str, **payload):
    body = {"job_id": job_id, "callback_secret": callback_secret, **payload}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            await client.post(callback_url, json=body)
    except Exception:
        logger.exception("Failed to deliver callback for job %s", job_id)


def _suffix_for(content_type: str) -> str:
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "application/pdf": ".pdf",
    }.get(content_type, "")


def _safe_delete(path: str):
    try:
        os.remove(path)
    except OSError:
        pass


class TooManyPagesError(Exception):
    pass


class NoNotationDetectedError(Exception):
    pass
