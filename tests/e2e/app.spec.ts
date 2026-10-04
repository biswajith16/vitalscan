import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { record } from "../fixtures";
async function skipOnboarding(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem("vitalscan-onboarded", "1"),
  );
}
async function seed(page: Page) {
  await page.goto("/history");
  await expect(
    page.getByRole("heading", {
      name: "A little check-in. A fresh perspective.",
    }),
  ).toBeVisible();
  const records = [
    record({ createdAt: new Date().toISOString() }),
    record({
      id: "ed20b82f-490b-4329-8aa5-cde836122a13",
      heartRate: 78,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    }),
    record({
      id: "ed20b82f-490b-4329-8aa5-cde836122a14",
      heartRate: 65,
      source: "demo",
      createdAt: new Date().toISOString(),
    }),
  ];
  await page.evaluate(async (records) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("vitalscan-local", 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("scans", "readwrite");
        for (const item of records) tx.objectStore("scans").put(item);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, records);
  await page.reload();
}
test("first-launch onboarding completes once and is keyboard accessible", async ({
  page,
}) => {
  await page.goto("/");
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("heading")).toHaveText(
    "Wellness insights from your camera",
  );
  await modal.getByRole("button", { name: "Continue" }).click();
  await expect(modal.getByRole("heading")).toHaveText("Private by design");
  await modal.getByRole("button", { name: "Continue" }).click();
  await modal.getByRole("button", { name: "Get started" }).click();
  await expect(modal).not.toBeVisible();
  await page.reload();
  await expect(modal).not.toBeVisible();
});
test("primary routes, responsive widths, and accessible controls", async ({
  page,
}, testInfo) => {
  await skipOnboarding(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [375, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/scan",
      "/history",
      "/trends",
      "/results",
      "/settings",
      "/settings/privacy",
      "/about",
    ]) {
      const response = await page.goto(route);
      // WebKit exposes successful cache revalidation as 304 on the live CDN.
      expect([200, 304], `${route} HTTP status`).toContain(response?.status());
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("body")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} overflows ${width}px`,
      ).toBe(true);
      if (route === "/scan" && [390, 1280].includes(width))
        await page.screenshot({
          path: testInfo.outputPath(`scan-${width}.png`),
          fullPage: true,
        });
    }
    await page.goto("/");
    await page.screenshot({
      path: testInfo.outputPath(`home-${width}.png`),
      fullPage: true,
    });
  }
  for (const route of ["/", "/scan", "/settings", "/history"]) {
    await page.goto(route);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      route,
    ).toEqual([]);
  }
  expect(errors).toEqual([]);
});
test("persistence, history, trends, print, individual delete, and delete-all", async ({
  page,
}, testInfo) => {
  await skipOnboarding(page);
  await seed(page);
  await expect(page.locator(".history-card")).toHaveCount(3);
  await expect(page.getByText("Demo Data", { exact: true })).toBeVisible();
  await page.goto("/trends");
  await expect(page.locator(".stat-card").last()).toContainText("2");
  await page.getByRole("button", { name: "7 days", exact: true }).click();
  await expect(page.locator(".stat-card").last()).toContainText("1");
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.locator(".stat-card").last()).toContainText("2");
  await page.getByText("View exact readings (2)").click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.screenshot({
    path: testInfo.outputPath("trends.png"),
    fullPage: true,
  });
  await page.goto(`/history/${record().id}`);
  await expect(page.locator(".big-metric")).toContainText("72");
  await page.reload();
  await expect(page.locator(".big-metric")).toContainText("72");
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printed = "yes";
    };
  });
  await page.getByRole("button", { name: "Export report" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-printed", "yes");
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByRole("heading", { name: "VitalScan Wellness Scan" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("print-report.png"),
    fullPage: true,
  });
  await page.emulateMedia({ media: "screen" });
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Delete scan", exact: true }).click();
  await expect(page.locator(".big-metric")).toContainText("72");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete scan", exact: true }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.locator(".history-card")).toHaveCount(2);
  await page.goto("/settings/privacy");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete all scan data" }).click();
  await expect(page.getByRole("status")).toContainText(
    "All scan data has been deleted",
  );
  await page.goto("/history");
  await expect(page.locator(".history-card")).toHaveCount(0);
  await page.goto(`/history/${record().id}`);
  await expect(
    page.getByRole("heading", { name: "This scan isn’t here." }),
  ).toBeVisible();
});
test("camera permission denial offers recovery without fabricated readings", async ({
  page,
}) => {
  await skipOnboarding(page);
  await page.goto("/scan");
  await page.evaluate(() => {
    // Retain WebKit's native wrapper; garbage collection can otherwise discard
    // an instance override and restore the real permission prompt mid-test.
    Object.defineProperty(navigator, "mediaDevices", {
      value: navigator.mediaDevices,
    });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        throw new DOMException("Denied for test", "NotAllowedError");
      },
    });
  });
  await page.getByRole("button", { name: "Enable camera & start" }).click();
  await expect(page.locator(".error-notice")).toContainText(
    "Camera access wasn’t allowed",
  );
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".big-metric")).toHaveCount(0);
});
test("no-face camera uses real model and stops tracks on cancel", async ({
  page,
}) => {
  await skipOnboarding(page);
  await page.goto("/scan");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: navigator.mediaDevices,
    });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async (constraints: MediaStreamConstraints) => {
        document.documentElement.dataset.cameraConstraints =
          JSON.stringify(constraints);
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#889999";
        ctx.fillRect(0, 0, 640, 480);
        const stream = canvas.captureStream(20);
        const draw = window.setInterval(() => {
          ctx.fillRect(0, 0, 640, 480);
        }, 50);
        const track = stream.getTracks()[0];
        const originalStop = track.stop.bind(track);
        track.stop = () => {
          originalStop();
          clearInterval(draw);
          document.documentElement.dataset.cameraStopped = "yes";
        };
        return stream;
      },
    });
  });
  await page.getByRole("button", { name: "Enable camera & start" }).click();
  await expect(page.locator(".camera-guidance")).toHaveText(
    "Position your face inside the guide",
    { timeout: 25000 },
  );
  expect(
    await page.locator("html").getAttribute("data-camera-constraints"),
  ).toContain('"facingMode":{"ideal":"user"}');
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel scan" }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-camera-stopped",
    "yes",
  );
});
test("cancelling a pending permission request closes a late camera", async ({
  page,
}) => {
  await skipOnboarding(page);
  await page.goto("/scan");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: navigator.mediaDevices,
    });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () =>
        new Promise((resolve) => {
          Object.assign(window, {
            resolveTestCamera: () =>
              resolve({
                getTracks: () => [
                  {
                    stop: () => {
                      document.documentElement.dataset.lateCameraStopped =
                        "yes";
                    },
                  },
                ],
              }),
          });
        }),
    });
  });
  await page.getByRole("button", { name: "Enable camera & start" }).click();
  await expect(page.getByRole("status")).toContainText("Allow camera access");
  await page.getByRole("button", { name: "Cancel scan" }).click();
  await page.evaluate(() =>
    (
      window as unknown as { resolveTestCamera: () => void }
    ).resolveTestCamera(),
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-late-camera-stopped",
    "yes",
  );
  await expect(
    page.getByRole("button", { name: "Enable camera & start" }),
  ).toBeVisible();
  await expect(page.locator(".error-notice")).toHaveCount(0);
});
test("manifest and previously loaded pages remain available offline", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Service-worker offline interception is verified in Chromium.",
  );
  await skipOnboarding(page);
  await seed(page);
  const manifestResponse = await page.request.get("/manifest.webmanifest");
  const manifest = await manifestResponse.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toHaveLength(3);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.goto(`/history/${record().id}`);
  await expect(page.locator(".big-metric")).toContainText("72");
  await page.goto("/trends");
  await expect(page.locator(".trend-chart")).toHaveCount(2);
  await context.setOffline(true);
  await page.goto("/history");
  await expect(page.locator(".history-card")).toHaveCount(3);
  await page.goto(`/history/${record().id}`);
  await expect(page.locator(".big-metric")).toContainText("72");
  await page.goto("/trends");
  await expect(page.locator(".trend-chart")).toHaveCount(2);
  await expect(page.getByRole("status").first()).toContainText("offline");
});
