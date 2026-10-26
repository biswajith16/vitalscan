import type {
  AcquisitionQuality,
  Measurement,
  RGBSample,
  ScanDiagnostics,
} from "@/types/scan";
import {
  bandpass,
  clamp,
  detrend,
  mean,
  spectrum,
  std,
} from "@/lib/signal-processing/math";
export const ALGORITHM_VERSION = "POS-1.2.0";
export const SAMPLE_RATE = 15;

export function resample(samples: RGBSample[], fs = SAMPLE_RATE): RGBSample[] {
  if (samples.length < 2) return [];
  const output: RGBSample[] = [];
  let index = 0;
  for (let t = samples[0].t; t <= samples.at(-1)!.t; t += 1000 / fs) {
    while (index < samples.length - 2 && samples[index + 1].t < t) index++;
    const a = samples[index],
      b = samples[index + 1];
    const ratio = (t - a.t) / (b.t - a.t);
    output.push({
      t,
      r: a.r + ratio * (b.r - a.r),
      g: a.g + ratio * (b.g - a.g),
      b: a.b + ratio * (b.b - a.b),
    });
  }
  return output;
}

/** Wang et al. (2017), Plane-Orthogonal-to-Skin: 1.6-second normalized windows.
 * S1 = G-B, S2 = G+B-2R; h = S1 + std(S1)/std(S2)*S2.
 * Overlap-add, then average by overlap count. No assumed camera frame rate. */
export function extractPOS(samples: RGBSample[], fs = SAMPLE_RATE) {
  const size = Math.round(fs * 1.6);
  const output = Array<number>(samples.length).fill(0);
  const count = Array<number>(samples.length).fill(0);
  for (let start = 0; start + size <= samples.length; start++) {
    const window = samples.slice(start, start + size);
    const r = mean(window.map((s) => s.r)),
      g = mean(window.map((s) => s.g)),
      b = mean(window.map((s) => s.b));
    if (Math.min(r, g, b) < 1) continue;
    const s1 = window.map((s) => s.g / g - s.b / b);
    const s2 = window.map((s) => s.g / g + s.b / b - (2 * s.r) / r);
    const alpha = std(s1) / Math.max(std(s2), 1e-10);
    const pulse = s1.map((v, i) => v + alpha * s2[i]);
    const average = mean(pulse);
    pulse.forEach((v, i) => {
      output[start + i] += v - average;
      count[start + i]++;
    });
  }
  return output.map((v, i) => (count[i] ? v / count[i] : 0));
}

/** Quality: 30% spectral confidence, 25% completeness, 20% motion,
 * 15% tracking, 10% illumination. Inputs and result are 0–100. */
export function qualityScore(q: AcquisitionQuality, confidence: number) {
  const score = (value: number) => (Number.isFinite(value) ? clamp(value) : 0);
  return Math.round(
    clamp(
      0.3 * score(confidence) +
        0.25 * score(q.usable) +
        0.2 * score(q.motion) +
        0.15 * score(q.tracking) +
        0.1 * score(q.lighting),
    ),
  );
}
export function spectralConfidence(snrDb: number, agreementBpm: number) {
  return Math.round(
    (clamp(((snrDb + 3) / 15) * 100) * clamp(100 - agreementBpm * 5)) / 100,
  );
}

export function analyze(
  samples: RGBSample[],
  q: AcquisitionQuality,
): Measurement {
  const duration =
    samples.length > 1 ? (samples.at(-1)!.t - samples[0].t) / 1000 : 0;
  const diagnostics: ScanDiagnostics = {
    algorithmVersion: ALGORITHM_VERSION,
    sampleCount: samples.length,
    durationSeconds: Number.isFinite(duration) ? Math.max(0, duration) : 0,
    usableFramesPerSecond:
      duration > 0 && Number.isFinite(duration)
        ? (samples.length - 1) / duration
        : 0,
    checks: [],
  };
  const failures: string[] = [];
  const check = (
    id: string,
    label: string,
    value: number,
    unit: string,
    requirement: string,
    passed: boolean,
    message: string,
  ) => {
    const finite = Number.isFinite(value);
    diagnostics.checks.push({
      id,
      label,
      value: finite ? value : null,
      unit,
      requirement,
      passed: finite && passed,
    });
    if (!finite || !passed) failures.push(message);
  };
  const reject = (reason: string, confidence = 0, snrDb = 0): Measurement => ({
    heartRate: null,
    confidence,
    quality: qualityScore(q, confidence),
    snrDb,
    reason,
    diagnostics,
  });
  const valid =
    samples.every(
      (s) =>
        [s.t, s.r, s.g, s.b].every(Number.isFinite) &&
        Math.min(s.r, s.g, s.b) > 0,
    ) &&
    Object.values(q).every((v) => Number.isFinite(v) && v >= 0 && v <= 100);
  check(
    "valid-data",
    "Camera data",
    valid ? 1 : 0,
    "",
    "Valid timestamps, RGB values and quality scores",
    valid,
    "The camera returned invalid data. Reload the page and try again.",
  );
  if (!valid) return reject(failures[0]);
  check(
    "sample-count",
    "Usable frames",
    samples.length,
    "frames",
    "At least 300",
    samples.length >= 300,
    `Only ${samples.length} usable camera frames were captured. Close other apps or try another browser or device; camera processing may be too slow.`,
  );
  check(
    "duration",
    "Signal coverage",
    duration,
    "s",
    "At least 25 seconds",
    duration >= 25,
    "The usable recording was too short. Keep your face in view for the full scan.",
  );
  check(
    "usable",
    "Usable recording",
    q.usable,
    "%",
    "At least 80%",
    q.usable >= 80,
    "Too much of the recording was unusable. Check face position, lighting and stability before retrying.",
  );
  check(
    "tracking",
    "Face tracking",
    q.tracking,
    "%",
    "At least 80%",
    q.tracking >= 80,
    "Face tracking was interrupted. Keep one face centered and fully visible.",
  );
  check(
    "motion",
    "Stability",
    q.motion,
    "%",
    "At least 65%",
    q.motion >= 65,
    "The recording contains too much movement. Support the device and keep your head comfortably still.",
  );
  check(
    "lighting",
    "Lighting",
    q.lighting,
    "%",
    "At least 55%",
    q.lighting >= 55,
    "The camera could not capture enough evenly exposed skin. Avoid strong shadows or overexposed areas and retry.",
  );
  let maxGap = 0,
    monotonic = true;
  for (let i = 1; i < samples.length; i++) {
    const gap = samples[i].t - samples[i - 1].t;
    maxGap = Math.max(maxGap, gap);
    if (gap <= 0) monotonic = false;
  }
  check(
    "timing",
    "Frame continuity",
    maxGap,
    "ms",
    "Increasing timestamps; no gap over 650 ms",
    monotonic && maxGap <= 650,
    "The camera signal had gaps or repeated timestamps. Keep this tab visible and try closing other camera apps.",
  );
  if (failures.length) return reject(failures[0]);
  const signal = bandpass(
    detrend(extractPOS(resample(samples))),
    SAMPLE_RATE,
  ).slice(SAMPLE_RATE, -SAMPLE_RATE);
  const full = spectrum(signal, SAMPLE_RATE);
  const middle = Math.floor(signal.length / 2);
  const early = spectrum(signal.slice(0, middle), SAMPLE_RATE);
  const late = spectrum(signal.slice(middle), SAMPLE_RATE);
  const agreement =
    Math.max(
      Math.abs(early.hz - late.hz),
      Math.abs(full.hz - early.hz),
      Math.abs(full.hz - late.hz),
    ) * 60;
  const confidence = spectralConfidence(full.snrDb, agreement);
  const brightness = samples.map((s) => (s.r + s.g + s.b) / 3);
  const lightingVariation = std(brightness) / Math.max(mean(brightness), 1);
  check(
    "energy",
    "Optical variation",
    full.energy,
    "",
    "At least 1e-9",
    full.energy >= 1e-9,
    "The camera did not capture enough color variation to estimate a pulse. Try a different camera or browser. More light alone may not resolve this.",
  );
  check(
    "snr",
    "Signal separation",
    full.snrDb,
    "dB",
    "At least 3 dB",
    full.snrDb >= 3,
    "A pulse could not be separated from interference in the recording. Try another camera or browser; camera exposure and image processing can affect the signal even in natural light.",
  );
  check(
    "agreement",
    "Agreement across the scan",
    agreement,
    "BPM difference",
    "No more than 8 BPM difference",
    agreement <= 8,
    "The two halves of the recording did not agree on a pulse estimate. Rest briefly and retry. If this repeats, try a different camera or browser.",
  );
  check(
    "exposure",
    "Exposure variation",
    lightingVariation * 100,
    "%",
    "No more than 12%",
    lightingVariation <= 0.12,
    "The recorded brightness changed too much. Camera auto-exposure can cause this even under steady lighting. Try another camera or browser.",
  );
  // Never expose an unaccepted candidate as a BPM value in the diagnostics.
  const insideBand = full.hz > 0.72 && full.hz < 2.98;
  check(
    "band",
    "Analysis range",
    insideBand ? 1 : 0,
    "",
    "Peak clear of the analysis-band edges",
    insideBand,
    "The strongest signal was at the edge of this algorithm’s range, so it cannot provide an estimate. Try another recording; no heart rate has been determined.",
  );
  // Confidence is a descriptive score derived from SNR and agreement, not a
  // third independent observation or a calibrated probability. Do not gate twice.
  if (failures.length) {
    const result = reject(failures[0], confidence, full.snrDb);
    const failedChecks = diagnostics.checks.filter((check) => !check.passed);
    // Let a developer see the dominant frequency when only these two quality
    // checks fail. This may be noise: heartRate stays null and cannot be saved.
    // Capture validity, signal energy, exposure and band boundaries still apply.
    if (
      failedChecks.every((check) => ["snr", "agreement"].includes(check.id)) &&
      Number.isFinite(full.hz)
    ) {
      result.preview = {
        kind: "unvalidated-signal",
        bpm: Math.round(full.hz * 60),
      };
    }
    return result;
  }
  return {
    heartRate: Math.round(full.hz * 60),
    confidence,
    quality: qualityScore(q, confidence),
    snrDb: full.snrDb,
    diagnostics,
  };
}
