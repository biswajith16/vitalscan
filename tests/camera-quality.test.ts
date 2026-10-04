import { describe, expect, it } from "vitest";
import { positionQuality, sampleSkin, type Point } from "@/lib/camera/quality";
const face = (scale = 1, offset = 0): Point[] =>
  Array.from({ length: 478 }, (_, i) => ({
    x: 0.5 + offset + Math.cos((i / 478) * Math.PI * 2) * 0.2 * scale,
    y: 0.5 + Math.sin((i / 478) * Math.PI * 2) * 0.3 * scale,
  }));
describe("real frame quality gates", () => {
  it("requires one face", () => {
    expect(positionQuality([]).position).toBe(false);
    expect(positionQuality([face(), face()]).guidance).toContain(
      "Only one face",
    );
  });
  it("recognizes size, centering, and movement", () => {
    const points = face();
    expect(positionQuality([points], points).position).toBe(true);
    expect(positionQuality([points], points).motion).toBe(100);
    expect(positionQuality([face(0.4)]).guidance).toBe("Move closer");
    expect(positionQuality([face(1.6)]).guidance).toBe("Move farther away");
    expect(positionQuality([face(1, 0.17)]).guidance).toBe("Center your face");
    expect(positionQuality([face(1, 0.04)], points).motion).toBe(0);
  });
  it("samples polygon pixels, rejecting clipped images", () => {
    const points = face();
    [
      [109, 10, 338, 337, 151, 108],
      [50, 101, 205, 187],
      [280, 330, 425, 411],
    ].forEach((ids, region) =>
      ids.forEach((id, i) => {
        points[id] = {
          x:
            0.25 +
            region * 0.25 +
            Math.cos((i / ids.length) * Math.PI * 2) * 0.09,
          y: 0.4 + Math.sin((i / ids.length) * Math.PI * 2) * 0.09,
        };
      }),
    );
    const data = new Uint8ClampedArray(200 * 200 * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 160;
      data[i + 1] = 120;
      data[i + 2] = 90;
      data[i + 3] = 255;
    }
    const image = {
      data,
      width: 200,
      height: 200,
      colorSpace: "srgb",
    } as ImageData;
    expect(sampleSkin(image, points)?.g).toBe(120);
    expect(sampleSkin(image, points)?.lighting).toBe(100);
    data.fill(255);
    expect(sampleSkin(image, points)).toBeNull();
  });
});
