/* Same-origin assets only. No camera frames or readings pass through this worker.
 * Native document navigation avoids fragile offline caching of Next RSC payloads. */
const CACHE = "vitalscan-shell-v2";
const PAGES = [
  "/",
  "/scan",
  "/history",
  "/results",
  "/trends",
  "/settings",
  "/settings/privacy",
  "/about",
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const assets = new Set([
        "/manifest.webmanifest",
        "/icon-192.png",
        "/icon-512.png",
        "/favicon.png",
      ]);
      for (const path of PAGES) {
        const response = await fetch(path, { cache: "reload" });
        if (!response.ok) throw new Error("App shell unavailable");
        const html = await response.clone().text();
        await cache.put(path, response);
        for (const match of html.matchAll(/(?:src|href)="([^" ]+)"/g))
          if (match[1].startsWith("/_next/static/"))
            assets.add(match[1].replaceAll("&amp;", "&"));
      }
      await cache.addAll([...assets]);
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("vitalscan-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.headers.get("RSC")
  )
    return;
  const navigation = request.mode === "navigate";
  const asset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/mediapipe/") ||
    /\.(png|svg|webmanifest)$/.test(url.pathname);
  if (!navigation && !asset) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const key = navigation ? url.pathname : request;
      const cached = await cache.match(key);
      if (asset && cached) return cached;
      try {
        const response = await fetch(request);
        // Storage eviction/quota must not turn a successful online fetch into an error.
        if (response.ok) await cache.put(key, response.clone()).catch(() => {});
        return response;
      } catch {
        return (
          cached ||
          (navigation && (await cache.match("/history"))) ||
          new Response(
            "This asset is not available offline. Reconnect and reload.",
            { status: 503 },
          )
        );
      }
    })(),
  );
});
