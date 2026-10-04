import { clamp, mean } from "@/lib/signal-processing/math";
export type Point = { x: number; y: number; z?: number };
export type FrameQuality = {
  position: boolean;
  lighting: number;
  motion: number;
  tracking: number;
  ready: boolean;
  guidance: string;
};
export function positionQuality(
  faces: Point[][],
  previous?: Point[],
  elapsedMs = 1000 / 15,
): Omit<FrameQuality, "lighting" | "ready"> {
  if (faces.length !== 1)
    return {
      position: false,
      motion: 0,
      tracking: 0,
      guidance:
        faces.length > 1
          ? "Only one face should be visible"
          : "Position your face inside the guide",
    };
  const points = faces[0];
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const height = maxY - minY;
  const centered =
    Math.abs((minX + maxX) / 2 - 0.5) < 0.14 &&
    Math.abs((minY + maxY) / 2 - 0.5) < 0.16;
  const motion = previous
    ? clamp(
        100 -
          (mean(
            [1, 4, 50, 280, 10].map((i) =>
              Math.hypot(
                points[i].x - previous[i].x,
                points[i].y - previous[i].y,
              ),
            ),
          ) /
            Math.max(height, 0.2)) *
            (1000 / Math.max(elapsedMs, 30)) *
            160,
      )
    : 0;
  let guidance = "Hold still";
  if (height < 0.32) guidance = "Move closer";
  else if (
    height > 0.85 ||
    minX < 0.03 ||
    maxX > 0.97 ||
    minY < 0.02 ||
    maxY > 0.98
  )
    guidance = "Move farther away";
  else if (!centered) guidance = "Center your face";
  const position =
    height >= 0.32 &&
    height <= 0.85 &&
    centered &&
    minX >= 0.03 &&
    maxX <= 0.97 &&
    minY >= 0.02 &&
    maxY <= 0.98;
  return { position, motion, tracking: position ? 100 : 0, guidance };
}

const REGIONS = [
  [109, 10, 338, 337, 151, 108],
  [50, 101, 205, 187],
  [280, 330, 425, 411],
];
function inside(x: number, y: number, polygon: Point[]) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    )
      result = !result;
  }
  return result;
}
/** Polygon skin regions exclude eye/lip landmarks. Reject clipped pixels without a skin-color classifier. */
export function sampleSkin(image: ImageData, points: Point[]) {
  let red = 0,
    green = 0,
    blue = 0,
    count = 0,
    clipped = 0,
    total = 0;
  for (const indices of REGIONS) {
    const polygon = indices.map((i) => ({
      x: points[i].x * image.width,
      y: points[i].y * image.height,
    }));
    const x0 = Math.max(0, Math.floor(Math.min(...polygon.map((p) => p.x))));
    const x1 = Math.min(
      image.width - 1,
      Math.ceil(Math.max(...polygon.map((p) => p.x))),
    );
    const y0 = Math.max(0, Math.floor(Math.min(...polygon.map((p) => p.y))));
    const y1 = Math.min(
      image.height - 1,
      Math.ceil(Math.max(...polygon.map((p) => p.y))),
    );
    for (let y = y0; y <= y1; y += 2)
      for (let x = x0; x <= x1; x += 2) {
        if (!inside(x, y, polygon)) continue;
        total++;
        const index = (y * image.width + x) * 4;
        const r = image.data[index],
          g = image.data[index + 1],
          b = image.data[index + 2];
        if (Math.min(r, g, b) < 8 || Math.max(r, g, b) > 247) {
          clipped++;
          continue;
        }
        red += r;
        green += g;
        blue += b;
        count++;
      }
  }
  if (count < 60 || total === 0) return null;
  const r = red / count,
    g = green / count,
    b = blue / count;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const lighting =
    clamp(Math.min((luminance - 25) / 40, (240 - luminance) / 35, 1) * 100) *
    (1 - clipped / total);
  return { r, g, b, lighting };
}
