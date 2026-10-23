import { describe, expect, it } from "vitest";
import { analyze, extractPOS, resample } from "@/lib/rppg/pipeline";
import { bandpass, detrend, spectrum } from "@/lib/signal-processing/math";
import { goodQuality, synthetic } from "./fixtures";

// Deterministic non-stationary optical fixtures, not patient measurements.
function varyingPulse(
  startBpm: number,
  endBpm: number,
  amplitude = 1,
  noise = 0,
) {
  let seed = 12345;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296 - 0.5;
  };
  return Array.from({ length: 450 }, (_, i) => {
    const seconds = i / 15;
    const phase =
      2 *
      Math.PI *
      ((startBpm / 60) * seconds +
        (((endBpm - startBpm) / (60 * 30)) * seconds ** 2) / 2);
    const pulse = Math.sin(phase);
    return {
      t: seconds * 1000,
      r: 160 * (1 + 0.002 * amplitude * pulse + random() * noise),
      g: 118 * (1 + 0.008 * amplitude * pulse + random() * noise),
      b: 94 * (1 + 0.003 * amplitude * pulse + random() * noise),
    };
  });
}
describe("bounded variation without duplicate quality gates", () => {
  it.each([
    [72, 84, 0],
    [84, 72, 0],
    [72, 84, 0.01],
  ])(
    "accepts a %i → %i BPM trace with noise %f when explicit spectral gates pass",
    (start, end, noise) => {
      const samples = varyingPulse(start, end, 1, noise);
      const trace = bandpass(detrend(extractPOS(resample(samples))), 15).slice(
        15,
        -15,
      );
      const full = spectrum(trace, 15),
        early = spectrum(trace.slice(0, Math.floor(trace.length / 2)), 15),
        late = spectrum(trace.slice(Math.floor(trace.length / 2)), 15);
      const agreement =
        Math.max(
          Math.abs(early.hz - late.hz),
          Math.abs(full.hz - early.hz),
          Math.abs(full.hz - late.hz),
        ) * 60;
      expect(full.snrDb).toBeGreaterThanOrEqual(3);
      expect(agreement).toBeLessThanOrEqual(8);
      const result = analyze(samples, goodQuality);
      expect(
        result.heartRate,
        JSON.stringify({ result, agreement }),
      ).not.toBeNull();
      expect(
        Math.abs(result.heartRate! - (start + end) / 2),
      ).toBeLessThanOrEqual(3);
    },
  );
  it("still rejects excessive frequency change", () => {
    expect(analyze(varyingPulse(60, 100), goodQuality).heartRate).toBeNull();
  });
  it("retains the lower score rather than inflating confidence", () => {
    const result = analyze(varyingPulse(72, 84, 1, 0.01), goodQuality);
    expect(result.confidence).toBe(58);
    expect(result.diagnostics.checks.every((check) => check.passed)).toBe(true);
  });
  it("rejects noise-only fixtures across independent seeds", () => {
    for (let seed = 1; seed <= 50; seed++) {
      let state = seed;
      const random = () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296 - 0.5;
      };
      const samples = Array.from({ length: 450 }, (_, i) => ({
        t: (i * 1000) / 15,
        r: 160 + random() * 8,
        g: 118 + random() * 8,
        b: 94 + random() * 8,
      }));
      expect(
        analyze(samples, goodQuality).heartRate,
        `noise seed ${seed}`,
      ).toBeNull();
    }
  });
  it("rejects common-mode illumination without a chromatic pulse", () => {
    const samples = synthetic(72).map((s) => {
      const illumination =
        1 + 0.03 * Math.sin((2 * Math.PI * 1.2 * s.t) / 1000);
      return {
        ...s,
        r: 160 * illumination,
        g: 118 * illumination,
        b: 94 * illumination,
      };
    });
    expect(analyze(samples, goodQuality).heartRate).toBeNull();
  });
  it("reports exact failures and never exposes rejected candidate BPM or raw frames", () => {
    const result = analyze(
      synthetic(72).map((s) => ({ ...s, r: 160, g: 118, b: 94 })),
      goodQuality,
    );
    expect(
      result.diagnostics.checks.find((c) => c.id === "energy")?.passed,
    ).toBe(false);
    expect(result.reason).toContain("color variation");
    expect(result.reason).not.toContain("steady natural light");
    expect(result.heartRate).toBeNull();
    expect(Object.keys(result.diagnostics).sort()).toEqual(
      [
        "algorithmVersion",
        "checks",
        "durationSeconds",
        "sampleCount",
        "usableFramesPerSecond",
      ].sort(),
    );
  });
  it("keeps all acquisition failures visible instead of blaming lighting", () => {
    const result = analyze(synthetic(72), {
      ...goodQuality,
      motion: 30,
      tracking: 40,
    });
    expect(
      result.diagnostics.checks.filter((c) => !c.passed).map((c) => c.id),
    ).toEqual(["tracking", "motion"]);
    expect(result.reason).toContain("Face tracking");
    expect(result.diagnostics.checks.some((c) => c.id === "snr")).toBe(false);
  });
  it("rejects invalid quality inputs with finite summaries", () => {
    const result = analyze(synthetic(72), { ...goodQuality, motion: NaN });
    expect(result.heartRate).toBeNull();
    expect(Number.isFinite(result.quality)).toBe(true);
    expect(result.diagnostics.checks[0].passed).toBe(false);
  });
});
