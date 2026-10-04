import type { RGBSample, ScanRecord } from "@/types/scan";
export const goodQuality = {
  lighting: 95,
  motion: 97,
  tracking: 100,
  usable: 98,
};
/** Synthetic optical model for tests only. Never imported by production code. */
export function synthetic(bpm: number, noisy = false): RGBSample[] {
  let seed = 12345;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296 - 0.5;
  };
  return Array.from({ length: 450 }, (_, i) => {
    const t = (i * 1000) / 15 + (i ? random() * 7 : 0);
    const seconds = t / 1000;
    const pulse = Math.sin(((2 * Math.PI * bpm) / 60) * seconds);
    const illumination =
      1 + 0.015 * Math.sin(2 * Math.PI * 0.2 * seconds) + 0.001 * seconds;
    const noise = noisy ? 0.05 : 0.0002;
    return {
      t,
      r: 160 * illumination * (1 + 0.002 * pulse + random() * noise),
      g: 118 * illumination * (1 + 0.008 * pulse + random() * noise),
      b: 94 * illumination * (1 + 0.003 * pulse + random() * noise),
    };
  });
}
export function record(overrides: Partial<ScanRecord> = {}): ScanRecord {
  return {
    id: "de20b82f-490b-4329-8aa5-cde836122a12",
    createdAt: "2026-10-03T10:00:00.000Z",
    heartRate: 72,
    heartRateConfidence: 88,
    signalQuality: 92,
    scanDurationSeconds: 30,
    lightingQuality: 94,
    motionQuality: 96,
    faceTrackingQuality: 99,
    usablePercentage: 98,
    spectralSnrDb: 12,
    algorithmVersion: "POS-1.0.0",
    source: "real",
    ...overrides,
  };
}
