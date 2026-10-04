import type { ScanRecord } from "@/types/scan";
import { mean } from "@/lib/signal-processing/math";
export const qualityLabel = (score: number) =>
  score >= 90
    ? "Excellent"
    : score >= 75
      ? "Good"
      : score >= 55
        ? "Fair"
        : "Poor";
export function filterScans(
  scans: ScanRecord[],
  days: number | null,
  now = Date.now(),
) {
  return scans.filter(
    (s) =>
      s.source === "real" &&
      (!days || new Date(s.createdAt).getTime() >= now - days * 86400000),
  );
}
export function summarize(scans: ScanRecord[]) {
  const values = scans.map((s) => s.heartRate);
  return {
    count: values.length,
    average: values.length ? Math.round(mean(values)) : null,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
  };
}
export function insights(scans: ScanRecord[], now = Date.now()): string[] {
  const real = filterScans(scans, null).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  if (!real.length)
    return [
      "Your story starts with a scan. A few readings over time will help you discover your own patterns.",
    ];
  const week = filterScans(real, 7, now).length;
  const output = [
    `You completed ${week} ${week === 1 ? "scan" : "scans"} in the last 7 days.`,
  ];
  if (real.length >= 3) {
    const recent = real.slice(-5);
    const { min, max } = summarize(recent);
    output.push(
      max! - min! <= 10
        ? "Your recent camera-based heart-rate estimates have remained relatively consistent."
        : "Your recent estimates vary. Lighting, movement, and when you scan can influence camera-based readings.",
    );
  }
  if (
    real.length >= 6 &&
    mean(real.slice(-3).map((s) => s.signalQuality)) -
      mean(real.slice(0, 3).map((s) => s.signalQuality)) >=
      5
  )
    output.push(
      "Signal quality has improved compared with your earlier scans.",
    );
  return output;
}
export function comparison(scan: ScanRecord, scans: ScanRecord[]) {
  const earlier = scans
    .filter(
      (s) =>
        s.source === scan.source &&
        s.id !== scan.id &&
        s.createdAt < scan.createdAt,
    )
    .slice(0, 5);
  if (earlier.length < 3)
    return "Your scan produced a stable pulse signal. Scan in similar conditions to build a useful personal reference.";
  return Math.abs(scan.heartRate - mean(earlier.map((s) => s.heartRate))) > 12
    ? "This reading differs from your recent measurements. Camera-based estimates can be affected by movement, lighting, and other factors. Consider repeating the scan."
    : "This estimate is similar to your recent camera-based readings.";
}
