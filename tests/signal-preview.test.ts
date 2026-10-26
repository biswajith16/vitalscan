import { describe, expect, it } from "vitest";
import { analyze, extractPOS, resample } from "@/lib/rppg/pipeline";
import { bandpass, detrend, spectrum } from "@/lib/signal-processing/math";
import { goodQuality, synthetic } from "./fixtures";

describe("unvalidated signal preview", () => {
  const conflicting = () => [
    ...synthetic(60).slice(0, 225),
    ...synthetic(90).slice(225),
  ];
  it("shows the actual dominant frequency without accepting an inconsistent reading", () => {
    const samples = conflicting();
    const result = analyze(samples, goodQuality);
    const hz = spectrum(
      bandpass(detrend(extractPOS(resample(samples))), 15).slice(15, -15),
      15,
    ).hz;
    expect(result.heartRate).toBeNull();
    expect(
      result.diagnostics.checks.filter((c) => !c.passed).map((c) => c.id),
    ).toEqual(["snr", "agreement"]);
    expect(result.preview, JSON.stringify(result)).toEqual({
      kind: "unvalidated-signal",
      bpm: Math.round(hz * 60),
    });
    expect(
      result.diagnostics.checks.find((c) => c.id === "agreement")?.passed,
    ).toBe(false);
  });
  it("offers a preview for low SNR without relabeling noise as heart rate", () => {
    const result = analyze(synthetic(72, true), goodQuality);
    expect(result.heartRate).toBeNull();
    expect(result.preview?.kind, JSON.stringify(result)).toBe(
      "unvalidated-signal",
    );
    expect(result.snrDb).toBeLessThan(3);
    expect(result.diagnostics.checks.find((c) => c.id === "snr")?.passed).toBe(
      false,
    );
  });
  it("does not add a preview to accepted estimates", () => {
    const result = analyze(synthetic(72), goodQuality);
    expect(result.heartRate).toBe(72);
    expect(result.preview).toBeUndefined();
  });
  it("does not preview empty, flat, invalid, interrupted or poorly captured signals", () => {
    const samples = conflicting();
    for (const input of [
      [],
      samples.slice(0, 100),
      samples.map((s) => ({ ...s, r: 160, g: 118, b: 94 })),
      samples.map((s) => ({ ...s, g: NaN })),
      samples.filter((_, i) => i < 100 || i > 115),
    ]) {
      const result = analyze(input, goodQuality);
      expect(result.heartRate).toBeNull();
      expect(result.preview).toBeUndefined();
    }
    expect(
      analyze(samples, { ...goodQuality, motion: 30 }).preview,
    ).toBeUndefined();
  });
  it("keeps exposure failures and analysis-band boundaries blocking", () => {
    const exposed = conflicting().map((s) => {
      const scale = 1 + 0.5 * Math.sin((2 * Math.PI * 0.1 * s.t) / 1000);
      return { ...s, r: s.r * scale, g: s.g * scale, b: s.b * scale };
    });
    const result = analyze(exposed, goodQuality);
    expect(
      result.diagnostics.checks.find((c) => c.id === "exposure")?.passed,
    ).toBe(false);
    expect(result.preview).toBeUndefined();
    const edge = analyze(synthetic(42), goodQuality);
    expect(edge.diagnostics.checks.find((c) => c.id === "band")?.passed).toBe(
      false,
    );
    expect(edge.preview).toBeUndefined();
  });
});
