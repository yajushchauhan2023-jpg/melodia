# Melodia OMR Service

A small, standalone Python service that does the actual Optical Music
Recognition (OMR) for the "Music Sheet Decoder" feature: it takes an
uploaded photo or PDF of sheet music and returns MusicXML.

## Why a separate service, and why oemer

**Library choice: [`oemer`](https://github.com/BreezeWhite/oemer)**
(`pip install oemer`), an end-to-end, deep-learning-based OMR system that
outputs MusicXML directly.

We evaluated the realistic open options and picked oemer over the
alternatives for this specific product:

| Option | Why not (or why) |
|---|---|
| **Audiveris** | The most mature/accurate free OMR engine and a very reasonable choice, but it's a Java desktop app wrapped in a GUI-first architecture. Running it headless requires bundling a JVM and its algorithms are tuned for clean, scanned engraved scores — not the "photo taken at an angle on a phone" input Melodia's users will actually upload. |
| **Google Moonlight / TF Music Object Detector** | Research-grade, effectively unmaintained, PNG-only, no PDF support, no packaged inference pipeline. |
| **Commercial APIs (Soundslice, ScanScore, etc.)** | Soundslice's OMR is excellent but isn't exposed as a public developer API today; ScanScore is a desktop app, not a service. Both are worth revisiting if/when a documented API becomes available — see "Future upgrade path" below. |
| **Build our own OMR model** | Explicitly out of scope — OMR is a multi-year research problem; reimplementing it would be a huge, unjustifiable undertaking for a feature like this. |
| **oemer** ✅ | Pure Python + ONNX Runtime (no JVM), MIT-licensed, actively maintained, outputs MusicXML natively, and — notably — its own docs specifically target "phone-taken music sheet images," which is exactly Melodia's use case. It's a pip-installable library, not a GUI app, so it drops cleanly into a small API wrapper like this one. |

**Why a separate service instead of calling oemer from the Next.js API
route directly:** OMR inference is CPU/GPU-heavy and can take anywhere
from several seconds to a few minutes per page. That's fundamentally
incompatible with holding a serverless request open. This service runs
as a small always-on process (a single VM, or a container on
Fly.io/Render/Cloud Run) and communicates with the Next.js app
asynchronously:

```
Next.js API route  ---(1) POST file + callback URL--->  OMR service (this)
                    <--(2) 202 Accepted, queued----------
                                                          (3) runs oemer
Next.js API route  <---(4) POST result to callback URL---
```

This is what lets the browser poll a cheap status endpoint instead of
blocking a request for minutes (see `src/lib/decoder/omr-client.ts` and
`src/app/api/decoder/jobs/[id]/callback/route.ts` in the main app).

## Running it

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

The first run downloads oemer's model checkpoints (~10 minutes,
one-time). Set `OMR_CALLBACK_SECRET` to the same value configured in the
Next.js app's `.env` so callbacks are authenticated.

## Future upgrade path

The `/decode` endpoint is intentionally the only integration surface
the main app talks to. If a documented commercial OMR API becomes
available (better accuracy, faster turnaround) or a stronger open model
is released, only `main.py`'s `run_omr()` function needs to change —
the Next.js side doesn't need to know which engine produced the
MusicXML.
