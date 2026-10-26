# Unvalidated signal preview — October 25, 2026

## Requested behavior

Show the signal-processing output after a completed scan, even when signal
separation or split-half agreement does not meet the acceptance threshold.
This does not establish physiological accuracy or resolve the underlying weak
signal. No fabricated vitals or fixed fallback values are used.

## Data flow

Camera → local face tracker → timestamped skin RGB averages → POS → spectrum →
accepted estimate, unvalidated preview, or retry. There is no signal API/server
boundary. Only accepted estimates go to IndexedDB and reports.

The analyzer retains `heartRate: null` when checks fail. If the only failed checks
are `snr` and/or `agreement`, it additionally returns a typed `unvalidated-signal`
preview with the actual dominant frequency multiplied by 60 and rounded. The
hook displays a separate preview state and returns before the persistence path.
Other acquisition and spectral failures still require a retry.

## User-facing behavior

- POS-1.2.0 shows the candidate in the former camera area after stopping tracks.
- The number is labeled "BPM candidate", "Unvalidated · Not saved" and "Not a
  heart-rate measurement". The warning explains that the pattern may be noise.
- Failed check values remain visible; there is no "normal" range, health status,
  reassurance, confidence badge, diagnosis or other vital-sign estimate.
- No save/export action is offered for previews. History, trends and accepted
  report exports remain separate. Retry, cancellation and reload clear the preview.
- A stable polite live region announces the preview and its unvalidated status.

## Verification

- 54 unit tests pass, including a deterministic trace that fails both SNR and
  agreement, low-SNR output, unchanged accepted estimates, and no preview for
  invalid, flat, incomplete, interrupted, overexposed or band-edge recordings.
- Unit tests compare the candidate with the actual spectral calculation, not a
  fixed expected fallback number.
- Browser integration uses synthetic canvas streams and the real face tracker,
  sampler and analysis. It checks the numeric preview, labels, warnings, stopped
  camera, retry/cancel cleanup, reload clearing and empty history.
- Build, typecheck and lint pass; production-only dependency audit is clear.
- An old cancellation test initially matched two status regions after adding the
  preview announcement. Its locator was narrowed to the camera-loading region;
  camera cleanup assertions were retained.

## Interface review

Writing and accessibility skills shaped the explicit candidate label, persistent
warning, native buttons/details and stable announcement. UI, layout and typography
skills guided reuse of existing surfaces/type and placing output where the camera
was, with no new animation. No actionable high-severity source review findings.
Automated accessibility and overflow checks cover the synthetic preview state.
Physical cameras, physiological accuracy, VoiceOver/TalkBack, 200% zoom and RTL
are not verified. Synthetic output tests are not clinical validation.

## Deployment

Release results are recorded here after staging, promotion and live verification.
