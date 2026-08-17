const CACHE_NAME = "assya-ai-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/assets/icon/android-chrome-192x192.png",
  "/assets/icon/android-chrome-512x512.png",
  "/assets/icon/apple-touch-icon.png",
  "/assets/icon/favicon-32x32.png",
  "/assets/icon/favicon-16x16.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await Promise.allSettled(
          APP_SHELL.map(url => cache.add(url).catch(err => console.warn(`Gagal cache asset: ${url}`, err)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  // Hanya GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Jangan cache API / Firebase / WhatsApp / external CDN
  if (
    url.origin !== location.origin ||
    url.pathname.includes("/api/") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("wa.me")
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      const networkFetch = fetch(request)
        .then(response => {
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const responseClone = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }

          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});