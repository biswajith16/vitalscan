# VitalScan

**Contactless wellness insights from your camera.**

A mobile-first, local-first research prototype built with Next.js App Router,
React, strict TypeScript, Tailwind CSS, Lucide, Framer Motion, Recharts, Zod, and
IndexedDB. No account, paid API, hosted AI service, or database server is required.

> This prototype provides wellness information and experimental camera-based
> estimates. It does not provide medical diagnosis or replace professional medical care.

## Run locally

Use a current Node.js LTS release (Node 22.12+ recommended) and npm.

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. The first install copies MediaPipe's WASM runtime,
downloads its face-landmark model, and generates app icons. These assets are served
from this application; camera frames are never sent to Google. Assets are also
included in the repository, so normal installs do not need to download the model
again. If assets are missing, run `npm run assets`.

The scripts use Next.js's supported Webpack compiler, since Turbopack's worker-port
binding failed in the restricted build environment. No application behavior relies
on that compiler choice. Exact dependency versions are recorded in `package-lock.json`.

### Use your phone

Camera APIs require a secure context. `http://localhost` works on the development
computer, but `http://192.168.x.x:3000` from a phone generally does not.

The simplest phone workflow is the HTTPS Vercel deployment below. For local testing,
`npm run dev:https` creates a development HTTPS server; the certificate must be
trusted by the phone. Merely bypassing a certificate warning may not enable camera
APIs on every mobile browser. Use the same Wi-Fi network and the computer's LAN IP.

## What is implemented

- Polished evergreen/ivory dashboard, local Manrope typography, desktop sidebar,
  mobile navigation, original face/pulse identity, and first-launch onboarding.
- Explicit camera activation, front-camera preference, mirrored preview and guide.
- Real MediaPipe landmarks, single/multiple-face checks, centering, size, lighting,
  and frame-rate-normalized movement checks, plus a sustained readiness window
  that tolerates isolated tracking jitter before capture.
- A fixed 30-second scan with progress, contextual guidance, cancellation,
  permission errors, background interruption handling, and camera cleanup.
- Timestamped RGB skin sampling, POS extraction, filtering, spectral estimation,
  confidence rejection, and deterministic quality scores. No random production BPM.
- Validated IndexedDB storage, results, history, individual deletion, delete-all,
  and storage failure recovery without discarding an accepted result immediately.
- Real-data trend charts with 7/30/90-day/all filters, accessible exact-value tables,
  statistics, deterministic insights, and conservative historical comparisons.
- Print / Save as PDF reports with measured values, quality breakdown and disclaimer.
- PWA manifest, original icons, Apple metadata, installation guidance, and bounded
  same-origin offline caching. No analytics or trackers.
- Development-only, visibly labeled demo reports; excluded from real trends and
  latest-scan summaries. There is no fallback from a failed scan to demo data.

## Architecture and folder structure

```text
app/                     Pages and metadata
  scan/                  Camera workflow
  results/               Latest real result
  history/[id]/          Individual report
  trends/                Local charts and insights
  settings/privacy/      Installation and data controls
  about/                 Research information
components/
  navigation/            Desktop sidebar/header and mobile bottom navigation
  scan/                  Scanner presentation
  results/               History and printable reports
  charts/                Lazy-loaded Recharts visualizations
  cards/                 Home dashboard
  common/                Onboarding, installation, branding, shared UI
hooks/                   Camera lifecycle and storage loading
lib/
  camera/                Model loading, geometric quality checks, polygon sampling
  rppg/                  POS extraction, resampling, confidence and rejection
  signal-processing/     Detrending, Butterworth filters, DFT
  storage/               Replaceable ScanStorage interface and IndexedDB adapter
  analytics/             Statistics, filters, insights, comparisons
types/                   Zod schema and domain types
public/                  Manifest, service worker, app icons, local model/WASM
scripts/                 Asset preparation
tests/                   Signal, quality, analytics, storage and browser tests
```

Browser APIs are only accessed in client callbacks/effects or event handlers. The
camera dependency loads on demand. Scan sampling is capped at approximately 15 Hz;
UI status updates are throttled to 4 Hz. The final spectral pass uses bounded arrays.
V1 runs landmark inference on the main thread; a Worker-based path is a future
performance improvement. Native document links deliberately make offline behavior
independent of Next.js RSC navigation caching.

## Camera and signal pipeline

1. User explicitly chooses **Enable camera & start**. Request video only with
   `facingMode: { ideal: "user" }`, ideal 640×480, and ideal 30 FPS. Retry
   unsupported constraints with a simpler front-camera request. Bound permission
   waiting (45s), preview startup (12s), and model loading (25s); cancellation
   also stops streams that arrive after the request has been abandoned.
2. Load local MediaPipe Face Landmarker in VIDEO mode with a maximum of two faces.
3. Require one centered face, height 32–85% of the original video frame, no clipped
   facial bounds, usable lighting, and low landmark movement. Begin after at least
   1.5 seconds and 10 frames with 85% readiness in a 1.7-second rolling window.
   The preview preserves the camera’s aspect ratio, keeping guidance aligned.
4. Sample small forehead and bilateral cheek polygons at 320-pixel processing
   width. Avoid eye/lip landmarks. Exclude clipped pixels rather than imposing a
   fixed skin-color threshold. Frames below readiness thresholds are not sampled.
5. Collect actual monotonic timestamps and mean R/G/B values. Never store raw frames.
6. Reject long gaps before interpolating onto a uniform 15 Hz time base.
7. Use **Plane-Orthogonal-to-Skin (POS)** in overlapping 1.6-second windows:
   normalize each channel by its local mean; `S1 = G − B`, `S2 = G + B − 2R`,
   `h = S1 + std(S1)/std(S2) × S2`; subtract window means and average overlap sums.
8. Remove a linear trend. Apply second-order Butterworth high-pass (0.7 Hz) and
   low-pass (3 Hz) sections in forward and reverse directions. Trim one second from
   both ends to reduce filter-edge effects.
9. Compute a Hann-windowed direct DFT over 0.7–3 Hz on a 0.01 Hz grid; BPM is
   `60 × peak frequency`. Grid spacing does not imply equivalent physiological
   accuracy or true frequency resolution; the recording length limits resolution.
10. Compare peaks in the full trace and the two halves, calculate spectral energy,
    signal-to-noise ratio and acquisition quality, and accept or reject.

Reference: Wang, den Brinker, Stuijk, de Haan, _Algorithmic Principles of Remote
PPG_, IEEE TBME 64(7), 2017, DOI
[10.1109/TBME.2016.2609282](https://pubmed.ncbi.nlm.nih.gov/28113245/).
Landmark integration follows the
[MediaPipe Web guide](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js).

### Quality and confidence

All inputs are deterministic and derived from actual samples or tracked frames:

| Value             | Calculation                                                                        |
| ----------------- | ---------------------------------------------------------------------------------- |
| Lighting          | ROI luminance margin (25–240), capped plateau, penalized by clipped-pixel fraction |
| Motion            | `clamp(100 − mean displacement of 5 landmarks × 4500)` per sampled frame           |
| Tracking          | Percentage of processed frames with one suitably positioned face                   |
| Usable            | Accepted RGB frames divided by all processed scan frames                           |
| Spectral SNR      | Energy within ±0.1 Hz of the peak vs remaining in-band energy                      |
| Signal confidence | `clamp((SNR + 3)/15 × 100) × clamp(100 − peak disagreement BPM × 5)/100`           |
| Overall quality   | 30% confidence + 25% usable + 20% motion + 15% tracking + 10% lighting             |

Labels: Excellent ≥90, Good ≥75, Fair ≥55, otherwise Poor. Confidence is **signal
consistency, not probability of medical correctness**.

Reject if fewer than 300 samples, under 25 seconds of coverage, a timestamp gap
over 650 ms, invalid timestamps/values, usable or tracking below 80%, motion below
65%, lighting below 55%, spectral SNR below 3 dB, split-half disagreement over
8 BPM, confidence below 60%, insufficient signal energy, excessive brightness
variation, or an unreliable band-edge peak. Rejected scans display a retry path
and **no BPM**, and are not saved as valid scans.

These are conservative engineering heuristics, not clinically calibrated limits.
Periodic movement or lighting can still resemble a pulse. Static photos are not
a supported scan source and there is no anti-spoofing/liveness claim.

## Privacy and persistence

Only accepted numeric measurements, quality summaries, timestamps, algorithm
version, and a real/demo source flag are persisted in IndexedDB. No facial images,
video, raw RGB traces, or landmarks are persisted or uploaded. Camera tracks,
animation frames, and tracker resources are released on completion, cancellation,
errors, page departure, and visibility loss. A delayed permission response is
guarded against reactivating a cancelled scan.

Data is local to an origin, device and browser profile. It is not cloud-backed or
application-encrypted; someone with access to that browser profile can read it.
Browser eviction, clearing site data, and private sessions may remove history.
Deletion requires confirmation. Local models and generic app assets may remain in
the service-worker cache after scan deletion; these do not contain measurements.

## Testing

```bash
npm test
npm run typecheck
npm run lint
npm run build
npx playwright install chromium webkit
npm run test:e2e
```

Stop the development server before running the full browser suite. Playwright
starts the production server (or uses an already running one). Offline caching is
enabled only in production. On constrained systems you can choose a browser cache:

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/vitalscan-browsers npx playwright install chromium webkit
PLAYWRIGHT_BROWSERS_PATH=/tmp/vitalscan-browsers npm run test:e2e
```

Unit tests cover preprocessing, POS, spectral recovery at 60/72/90 BPM (±3 BPM
tolerance), noise/flat-signal rejection, sampling gaps, confidence, weighted quality,
face geometry, ROI sampling, analytics, schema validation and IndexedDB CRUD.

Browser tests exercise onboarding, route layouts, 375/390/430 px and desktop,
axe accessibility checks, reload persistence, trend filters, demo labeling,
print CSS, deletion confirmation, permission denial, actual MediaPipe no-face
detection and camera cleanup. A separate 30-second integration test drives the
real tracker and sampling pipeline with a public test portrait and known synthetic
color modulation. Test fixtures are isolated from application code and real data.

**Physical iPhone/Android cameras, actual home-screen installation, VoiceOver /
TalkBack, and real physiological accuracy require device testing.** Synthetic
recovery and browser automation do not validate real-world measurement accuracy.

### Screenshots

Saved previews: [desktop](docs/home-desktop.png) · [mobile](docs/home-mobile.png).
See [verification notes](docs/VERIFICATION.md) for exact test coverage and limits.

Browser tests write full-page mobile/desktop dashboard, trends and print-layout
screenshots into `test-results/`. Add approved release screenshots here after
physical-device QA. The specification's `public/references/health-ui-reference.png`
was not supplied; the interface and icon are original.

## Production and Vercel deployment

```bash
npm run build
npm run start
```

1. Put this project in a GitHub/GitLab/Bitbucket repository, including the lockfile
   and `public/mediapipe` assets. Do not commit `.next` or `node_modules`.
2. In Vercel, select **Add New → Project**, then import that repository.
3. Keep **Next.js** as the framework and the project root as the root directory.
4. Use **npm install** as the install command and **npm run build** as the build
   command. Leave output directory at the framework default. No environment
   variables or paid APIs are required.
5. Select **Deploy**, then open the resulting HTTPS URL on the phone.
6. Complete onboarding and explicitly enable the camera. Allow camera access.
7. Verify a scan, reload persistence, history, export and installation on the
   actual devices you intend to support.

The source repository is [biswajith16/vitalscan](https://github.com/biswajith16/vitalscan)
(private). Server pages contain no health records; measurements remain in the browser.
To deploy from a linked local checkout, run `npx vercel --prod`. No runtime secrets
are required. Production camera access must use the deployment’s HTTPS URL directly,
not an embedded preview.

## PWA installation and offline behavior

**iPhone:** Open the deployed HTTPS URL in Safari → Share → Add to Home Screen → Add.
Open the resulting VitalScan icon and grant camera permission when you start a scan.

**Android:** Open the deployed URL in Chrome → menu (⋮) → Install app / Add to Home
screen → Install. If offered, the Settings **Install VitalScan** button invokes the
native install flow. Browsers without PWA installation can bookmark the site.

The production service worker precaches the main HTML pages and their initial JS/
CSS. Same-origin hashed assets, visited report pages, and locally fetched model/
WASM files are cached as they load. Revisit the scanner online once before expecting
offline scanning, and wait for initialization. Charts must have loaded once before
their lazy chunks are available offline. Cached history/results can then read local
IndexedDB offline. Previously unvisited report routes may fall back to history.
No guarantee is possible if a browser evicts assets or disables service workers.

When deploying changed app-shell behavior, increment the cache version in
`public/sw.js`. New workers activate after the old app tabs close, avoiding mixed
asset versions during an active scan.

## Browser and research limitations

- Modern Chrome and Safari are targeted; older browsers and embedded webviews may
  lack required camera/WASM/PWA capabilities.
- Camera exposure control, compression, frame rate, skin appearance, facial hair,
  makeup, obstructions, movement and illumination can bias estimates or reject scans.
- Landmark inference currently uses the main thread; slower phones may fail the
  sample-count requirement. Validation against reference sensors has not been done.
- No blood pressure, glucose, oxygen saturation, temperature, HRV, respiratory rate,
  disease inference or diagnostic claims are implemented.
- `npm audit` currently reports a development-only `braces` advisory propagated
  through `eslint-config-next` (GHSA-vfj7-8cjw-p6xm). No patched braces release was
  available at implementation time; do not downgrade the current Next.js stack to
  the old version suggested by `npm audit --force`. Recheck before release. Runtime
  dependencies had no reported advisories in the install audit.

## Recommended Phase 2

1. Validate paired recordings against a reference sensor across diverse people,
   phones, lighting conditions and motion; report error and rejection rates.
2. Move landmark inference and signal extraction to a Worker, measure battery/heat,
   and add per-region agreement and adaptive artifact rejection.
3. Calibrate confidence and harmonic ambiguity handling using held-out data.
4. Expand real-device, screen-reader, install/uninstall and storage-eviction testing.
5. Add optional encrypted export/import and explicit opt-in sync through the storage
   interface, with a privacy/security review before introducing a backend.
