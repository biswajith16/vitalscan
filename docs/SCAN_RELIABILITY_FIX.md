# Scan rejection investigation — POS-1.1.0

October 23, 2026. This investigation concerns a completed capture that rejected
the signal with generic advice about natural light. The user's recording was not
stored, so its exact failure cannot be reconstructed.

## Reproduced issue

The analyzer applied explicit SNR and split-half agreement checks, then also
required their composite confidence score to reach 60. This second gate could
reject a signal that passed every independent check.

A deterministic 30-second synthetic optical trace changes from 72 to 84 BPM with
independent channel noise. It produces 8.43 dB SNR and 4.8 BPM peak disagreement,
passing the respective 3 dB minimum and 8 BPM maximum. Its composite score is 58,
so the previous implementation rejected it. The new version returns an estimate
near the trace's average rate while preserving the score of 58.

This is evidence of over-rejection in a software fixture, not proof of the cause
on the user's device and not a physiological accuracy assessment.

## Changes

- Removed only the composite-confidence rejection gate. Confidence remains a
  descriptive, uncalibrated consistency score, never a clinical probability.
- Kept the independent capture and spectral thresholds unchanged: valid data,
  sample count, coverage, usable fraction, tracking, motion, lighting, continuity,
  signal energy, SNR, agreement, exposure variation and analysis-band boundaries.
- Show a limited-confidence warning below 60 on saved reports and print output;
  do not describe these estimates as having a stable pulse signal.
- Failed scans show the actual failed checks and their values, plus actionable
  error text. No rejected candidate BPM, raw trace, face image or video is exposed
  in diagnostics. Diagnostic summaries live only in page memory.
- Display the scanner version so an old cached page can be identified; bump the
  shell cache version. Existing local history is retained.
- Exclude unrelated local duplicate source files and generated/private files from
  CLI deployments. The duplicate files themselves are untouched.

## Verification scope

Local production-build results: 49 unit tests passed across six files; lint,
typecheck and build passed; 19 browser tests passed in Chromium and WebKit, with
one pre-existing WebKit offline interception skip. Browser runtime downloads had
to be restored before testing; initial missing-executable launch failures were
environment failures, not application results.

The regression suite covers changing-frequency traces, the exact score-58
counterexample, excessive frequency variation, 50 noise-only seeds, common-mode
illumination, flat signals, acquisition failures, invalid values and report copy.
Browser scenarios exercise real MediaPipe tracking, the 30-second capture,
analysis, persistence and camera cleanup using isolated synthetic camera streams.
Steady and changing signals must produce estimates; a static signal must reject
with diagnostics and must not enter history. Accessibility and limited-confidence
print warnings are included.

These checks do not validate physical cameras or clinical accuracy. Camera image
processing, exposure, real motion and other artifacts can still prevent an
estimate. A failure must remain a failure rather than being replaced with a demo
reading or an unsupported vital-sign value.

## Release dependency check

The first staged build surfaced newly reported production advisories. Before
promotion, Next.js and its lint configuration were updated from 16.3.8 to 16.4.3,
and Zod from 4.6.5 to 4.6.7. The refreshed production-only npm audit reports zero
advisories. A development-only advisory remains outside the runtime bundle.
The dependency change is separate from the signal algorithm fix.

References: [Next.js image optimization advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw),
[Next.js cache advisory](https://github.com/advisories/GHSA-673q-mjm6-r5xr),
and [Zod collection validation advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
