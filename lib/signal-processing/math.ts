export const clamp = (value: number, low = 0, high = 100) =>
  Math.min(high, Math.max(low, value));
export const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
export const std = (values: number[]) =>
  Math.sqrt(mean(values.map((v) => (v - mean(values)) ** 2)));

/** Remove a least-squares linear baseline, preserving the pulse-frequency band. */
export function detrend(values: number[]): number[] {
  const n = values.length;
  if (n < 2) return values.map(() => 0);
  const center = (n - 1) / 2;
  const average = mean(values);
  const denominator = values.reduce((sum, _, i) => sum + (i - center) ** 2, 0);
  const slope =
    values.reduce((sum, v, i) => sum + (i - center) * (v - average), 0) /
    denominator;
  return values.map((v, i) => v - average - slope * (i - center));
}

/** Second-order Butterworth high/low-pass sections; forward/backward for zero phase. */
function biquad(data: number[], fs: number, cutoff: number, highpass: boolean) {
  const k = Math.tan((Math.PI * cutoff) / fs);
  const norm = 1 / (1 + Math.SQRT2 * k + k * k);
  const b0 = (highpass ? 1 : k * k) * norm;
  const b1 = (highpass ? -2 : 2) * b0;
  const a1 = 2 * (k * k - 1) * norm;
  const a2 = (1 - Math.SQRT2 * k + k * k) * norm;
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  return data.map((x) => {
    const y = b0 * x + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  });
}
export function bandpass(values: number[], fs: number) {
  let result = values;
  for (const reverse of [false, true]) {
    if (reverse) result = [...result].reverse();
    result = biquad(biquad(result, fs, 0.7, true), fs, 3, false);
  }
  return result.reverse();
}

/** Hann-windowed direct DFT (equivalent spectral analysis), on a 0.01 Hz grid. */
export function spectrum(values: number[], fs: number) {
  const centered = detrend(values);
  const windowed = centered.map(
    (v, i) =>
      v * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (values.length - 1))),
  );
  const bins: { hz: number; power: number }[] = [];
  for (let bin = 70; bin <= 300; bin++) {
    const hz = bin / 100;
    let real = 0,
      imaginary = 0;
    windowed.forEach((v, i) => {
      const phase = (2 * Math.PI * hz * i) / fs;
      real += v * Math.cos(phase);
      imaginary -= v * Math.sin(phase);
    });
    bins.push({ hz, power: real * real + imaginary * imaginary });
  }
  const peak = bins.reduce(
    (best, bin) => (bin.power > best.power ? bin : best),
    bins[0],
  );
  const peakPower = bins
    .filter((b) => Math.abs(b.hz - peak.hz) <= 0.1)
    .reduce((s, b) => s + b.power, 0);
  const noisePower = bins
    .filter((b) => Math.abs(b.hz - peak.hz) > 0.1)
    .reduce((s, b) => s + b.power, 0);
  const snrDb = 10 * Math.log10((peakPower + 1e-15) / (noisePower + 1e-15));
  return { hz: peak.hz, snrDb, energy: mean(centered.map((v) => v * v)) };
}
