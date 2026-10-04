import { describe, expect, it } from "vitest";
import {
  analyze,
  extractPOS,
  qualityScore,
  resample,
  spectralConfidence,
} from "@/lib/rppg/pipeline";
import {
  bandpass,
  detrend,
  mean,
  spectrum,
} from "@/lib/signal-processing/math";
import { goodQuality, synthetic } from "./fixtures";
describe("preprocessing and spectra", () => {
  it("removes a linear trend", () => {
    expect(
      Math.max(
        ...detrend(Array.from({ length: 100 }, (_, i) => 4 + 0.2 * i)).map(
          Math.abs,
        ),
      ),
    ).toBeLessThan(1e-10);
  });
  it("resamples irregular timestamps onto a uniform grid", () => {
    const result = resample(synthetic(72));
    expect(result.length).toBeGreaterThan(445);
    expect(result[20].t - result[19].t).toBeCloseTo(1000 / 15);
  });
  it("preserves a 1.2 Hz pulse while attenuating out-of-band variation", () => {
    const result = bandpass(
      Array.from(
        { length: 450 },
        (_, i) =>
          Math.sin((2 * Math.PI * 1.2 * i) / 15) +
          2 * Math.sin((2 * Math.PI * 0.15 * i) / 15) +
          Math.sin((2 * Math.PI * 5 * i) / 15),
      ),
      15,
    );
    expect(spectrum(result.slice(15, -15), 15).hz).toBeCloseTo(1.2, 1);
  });
  it("produces a finite, centered POS trace", () => {
    const signal = extractPOS(resample(synthetic(72)));
    expect(signal.every(Number.isFinite)).toBe(true);
    expect(Math.abs(mean(signal))).toBeLessThan(0.001);
  });
});
describe("experimental pulse estimation", () => {
  it.each([60, 72, 90])(
    "recovers %i BPM within 3 BPM from timestamped optical samples",
    (bpm) => {
      const result = analyze(synthetic(bpm), goodQuality);
      expect(result.heartRate, JSON.stringify(result)).not.toBeNull();
      expect(Math.abs(result.heartRate! - bpm)).toBeLessThanOrEqual(3);
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    },
  );
  it("rejects insufficient samples", () => {
    expect(
      analyze(synthetic(72).slice(0, 100), goodQuality).heartRate,
    ).toBeNull();
  });
  it("rejects flat frames", () => {
    const flat = synthetic(72).map((s) => ({ ...s, r: 160, g: 118, b: 94 }));
    expect(analyze(flat, goodQuality).heartRate).toBeNull();
  });
  it("rejects low-motion quality even with a clean spectral signal", () => {
    expect(
      analyze(synthetic(72), { ...goodQuality, motion: 30 }).heartRate,
    ).toBeNull();
  });
  it("rejects incomplete face tracking", () => {
    expect(
      analyze(synthetic(72), { ...goodQuality, tracking: 40 }).heartRate,
    ).toBeNull();
  });
  it("rejects gaps rather than interpolating across long interruptions", () => {
    const samples = synthetic(72).filter((_, i) => i < 100 || i > 115);
    expect(analyze(samples, goodQuality).heartRate).toBeNull();
  });
  it("rejects malformed and non-monotonic samples", () => {
    const samples = synthetic(72);
    samples[50].t = samples[49].t;
    expect(analyze(samples, goodQuality).heartRate).toBeNull();
    samples[50].r = NaN;
    expect(analyze(samples, goodQuality).heartRate).toBeNull();
  });
  it("rejects dominant independent sensor noise", () => {
    expect(analyze(synthetic(72, true), goodQuality).heartRate).toBeNull();
  });
  it("rejects conflicting frequencies between scan halves", () => {
    const a = synthetic(60),
      b = synthetic(90);
    expect(
      analyze([...a.slice(0, 225), ...b.slice(225)], goodQuality).heartRate,
    ).toBeNull();
  });
  it("reduces confidence with poor spectra and disagreement", () => {
    expect(spectralConfidence(-5, 0)).toBe(0);
    expect(spectralConfidence(12, 0)).toBe(100);
    expect(spectralConfidence(12, 10)).toBe(50);
  });
  it("uses deterministic weighted quality, bounded at 0–100", () => {
    expect(
      qualityScore(
        { lighting: 100, motion: 100, tracking: 100, usable: 100 },
        100,
      ),
    ).toBe(100);
    expect(
      qualityScore({ lighting: 0, motion: 0, tracking: 0, usable: 0 }, 0),
    ).toBe(0);
    expect(
      qualityScore(
        { lighting: 100, motion: 100, tracking: 100, usable: 100 },
        0,
      ),
    ).toBe(70);
  });
});
