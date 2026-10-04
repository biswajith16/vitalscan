import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

// Runs the production tracker and sampler against a canvas stream, never a fake
// face detector or app-provided demo path. Synthetic test modulation is not a
// physiological measurement and stays in an isolated browser test profile.
test("real face tracking, 30-second capture, POS analysis, and persistence", async ({
  page,
}) => {
  test.setTimeout(65000);
  const portrait = (await readFile("tests/fixtures/portrait.jpg")).toString(
    "base64",
  );
  await page.addInitScript(
    async ({ portrait }) => {
      localStorage.setItem("vitalscan-onboarded", "1");
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        value: async () => {
          const image = new Image();
          image.src = `data:image/jpeg;base64,${portrait}`;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = 640;
          canvas.height = 480;
          const context = canvas.getContext("2d", {
            willReadFrequently: true,
          })!;
          // Crop a centered face from the example portrait, retaining forehead/cheeks.
          context.drawImage(image, 140, 0, 520, 390, 0, 0, 640, 480);
          const original = context.getImageData(0, 0, 640, 480);
          const frame = new ImageData(640, 480);
          const begin = performance.now();
          const draw = () => {
            const pulse = Math.sin(
              (2 * Math.PI * 1.2 * (performance.now() - begin)) / 1000,
            );
            for (let i = 0; i < frame.data.length; i += 4) {
              frame.data[i] = original.data[i] * (1 + 0.003 * pulse);
              frame.data[i + 1] = original.data[i + 1] * (1 + 0.012 * pulse);
              frame.data[i + 2] = original.data[i + 2] * (1 + 0.004 * pulse);
              frame.data[i + 3] = 255;
            }
            context.putImageData(frame, 0, 0);
          };
          draw();
          const timer = setInterval(draw, 1000 / 30);
          const stream = canvas.captureStream(30);
          const track = stream.getTracks()[0],
            stop = track.stop.bind(track);
          track.stop = () => {
            stop();
            clearInterval(timer);
            sessionStorage.setItem("test-camera-stopped", "yes");
          };
          return stream;
        },
      });
    },
    { portrait },
  );
  await page.goto("/scan");
  await page.getByRole("button", { name: "Enable camera & start" }).click();
  await expect(page.getByRole("progressbar")).toBeVisible({ timeout: 20000 });
  await expect(page).toHaveURL(/\/history\//, { timeout: 40000 });
  await expect(page.locator(".big-metric")).toContainText("72");
  expect(
    await page.evaluate(() => sessionStorage.getItem("test-camera-stopped")),
  ).toBe("yes");
  await page.reload();
  await expect(page.locator(".big-metric")).toContainText("72");
});
