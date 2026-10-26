import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";

// Runs the production tracker and sampler against a canvas stream, never a fake
// face detector or app-provided demo path. Synthetic test modulation is not a
// physiological measurement and stays in an isolated browser test profile.
for (const scenario of ["steady", "varying", "flat", "conflicting"] as const) {
  test(`real face tracking and complete 30-second ${scenario} signal workflow`, async ({
    page,
  }) => {
    test.setTimeout(65000);
    await page.setViewportSize({ width: 390, height: 844 });
    const portrait = (await readFile("tests/fixtures/portrait.jpg")).toString(
      "base64",
    );
    await page.addInitScript(() =>
      localStorage.setItem("vitalscan-onboarded", "1"),
    );
    await page.goto("/scan");
    await page.evaluate(
      async ({ portrait, scenario }) => {
        Object.defineProperty(navigator, "mediaDevices", {
          value: navigator.mediaDevices,
        });
        Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
          value: async () => {
            sessionStorage.removeItem("test-camera-stopped");
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
              const seconds = (performance.now() - begin) / 1000;
              const pulse =
                scenario === "flat"
                  ? 0
                  : scenario === "conflicting"
                    ? Math.sin(2 * Math.PI * (seconds < 15 ? 1 : 1.5) * seconds)
                    : Math.sin(
                        2 *
                          Math.PI *
                          (1.2 * seconds +
                            (scenario === "varying"
                              ? (0.2 * seconds ** 2) / 60
                              : 0)),
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
      { portrait, scenario },
    );
    await page.getByRole("button", { name: "Enable camera & start" }).click();
    await expect(page.getByRole("progressbar")).toBeVisible({ timeout: 20000 });
    if (scenario === "conflicting") {
      await expect(
        page.getByRole("heading", { name: "Signal preview ready." }),
      ).toBeVisible({ timeout: 40000 });
      await expect(page).toHaveURL(/\/scan$/);
      const preview = page.getByRole("region", {
        name: "Signal preview",
        exact: true,
      });
      await expect(preview).toContainText("Not a heart-rate measurement.");
      await expect(preview).toContainText("Unvalidated · Not saved");
      const candidate = Number(
        (await preview.locator(".signal-preview-value").innerText()).replace(
          /\D/g,
          "",
        ),
      );
      expect(candidate).toBeGreaterThan(42);
      expect(candidate).toBeLessThan(180);
      await expect(page.locator(".big-metric")).toHaveCount(0);
      expect(
        await page.evaluate(() =>
          sessionStorage.getItem("test-camera-stopped"),
        ),
      ).toBe("yes");
      await page
        .getByText("Why this is only a preview", { exact: true })
        .click();
      await expect(page.locator(".scan-diagnostic-checks")).toContainText(
        "Agreement across the scan — Not met",
      );
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(audit.violations).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: test.info().outputPath("signal-preview.png"),
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Scan again", exact: true })
        .click();
      await expect(preview).toHaveCount(0);
      await expect(page.getByRole("progressbar")).toBeVisible({
        timeout: 20000,
      });
      page.once("dialog", (dialog) => dialog.accept());
      await page
        .getByRole("button", { name: "Cancel scan", exact: true })
        .click();
      expect(
        await page.evaluate(() =>
          sessionStorage.getItem("test-camera-stopped"),
        ),
      ).toBe("yes");
      await page.reload();
      await expect(preview).toHaveCount(0);
      await page.goto("/history");
      await expect(page.locator(".history-card")).toHaveCount(0);
      return;
    }
    if (scenario === "flat") {
      await expect(page.locator(".scan-diagnostic-details")).toBeVisible({
        timeout: 40000,
      });
      await page
        .getByText("Why this scan didn’t produce a reading", { exact: true })
        .click();
      await expect(page.locator(".scan-diagnostic-checks")).toContainText(
        "Not met",
      );
      await expect(page.locator(".scan-diagnostic-checks")).toContainText(
        "Lighting — Passed",
      );
      await expect(page.locator(".big-metric")).toHaveCount(0);
      expect(
        await page.evaluate(() =>
          sessionStorage.getItem("test-camera-stopped"),
        ),
      ).toBe("yes");
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(audit.violations).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath("rejection-diagnostics.png"),
        fullPage: true,
      });
      await page.goto("/history");
      await expect(page.locator(".history-card")).toHaveCount(0);
      return;
    }
    await expect(page).toHaveURL(/\/history\//, { timeout: 40000 });
    const expected = scenario === "steady" ? 72 : 79;
    const metric = Number(
      (await page.locator(".big-metric").innerText()).replace(/\D/g, ""),
    );
    expect(Math.abs(metric - expected)).toBeLessThanOrEqual(3);
    expect(
      await page.evaluate(() => sessionStorage.getItem("test-camera-stopped")),
    ).toBe("yes");
    await page.reload();
    await expect(page.locator(".big-metric")).toContainText(String(metric));
  });
}
