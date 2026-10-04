import type { AcquisitionQuality, Measurement, RGBSample } from "@/types/scan";
import {
  bandpass,
  clamp,
  detrend,
  mean,
  spectrum,
  std,
} from "@/lib/signal-processing/math";
export const ALGORITHM_VERSION = "POS-1.0.0";
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
  return Math.round(
    clamp(
      0.3 * clamp(confidence) +
        0.25 * clamp(q.usable) +
        0.2 * clamp(q.motion) +
        0.15 * clamp(q.tracking) +
        0.1 * clamp(q.lighting),
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
  const reject = (reason: string, confidence = 0, snrDb = 0): Measurement => ({
    heartRate: null,
    confidence,
    quality: qualityScore(q, confidence),
    snrDb,
    reason,
  });
  if (
    samples.length < 300 ||
    samples.some((s) => ![s.t, s.r, s.g, s.b].every(Number.isFinite))
  )
    return reject(
      "There weren’t enough usable camera samples. Try brighter, even lighting.",
    );
  const duration = (samples.at(-1)!.t - samples[0].t) / 1000;
  if (
    duration < 25 ||
    q.usable < 80 ||
    q.tracking < 80 ||
    q.motion < 65 ||
    q.lighting < 55
  )
    return reject(
      "Movement, lighting, or lost face tracking interrupted the signal. Try again while holding still.",
    );
  for (let i = 1; i < samples.length; i++) {
    const gap = samples[i].t - samples[i - 1].t;
    if (gap <= 0 || gap > 650)
      return reject(
        "The camera signal had gaps. Keep your face in view for the full scan.",
      );
  }
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
  if (
    full.energy < 1e-9 ||
    full.snrDb < 3 ||
    agreement > 8 ||
    confidence < 60 ||
    lightingVariation > 0.12 ||
    full.hz <= 0.72 ||
    full.hz >= 2.98
  ) {
    return reject(
      "The pulse signal wasn’t consistent enough for a reliable estimate. Try again in steady natural light.",
      confidence,
      full.snrDb,
    );
  }
  return {
    heartRate: Math.round(full.hz * 60),
    confidence,
    quality: qualityScore(q, confidence),
    snrDb: full.snrDb,
  };
}
