const CACHE_NAME = "patternflow-core-v2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./patternflow.js",
  "./unit5.js",
  "./manifest.webmanifest",
  "./unit-5/index.html",
  "./studio/index.html",
  "./public/icons/patternflow-icon.svg",
  "./src/utils/audio.js",
  "./data/patternFlowData.js",
  "./data/unit5Data.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok && ["document", "script", "style", "image", "audio", ""].includes(event.request.destination)) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === "navigate") return caches.match("./index.html");
      return Response.error();
    })
  );
});
