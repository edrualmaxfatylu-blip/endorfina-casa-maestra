const CACHE = "portal-v1";
const BASE = ["./", "portada.webp"];
const ESPERA = 3500;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  const red = fetch(req).then((res) => {
    if (res.ok) {
      const copia = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copia));
    }
    return res;
  });

  e.respondWith(
    caches.match(req, { ignoreSearch: req.mode === "navigate" }).then((guardado) => {
      if (!guardado) return red;
      const lento = new Promise((ok) => setTimeout(() => ok(guardado), ESPERA));
      return Promise.race([red.catch(() => guardado), lento]);
    })
  );
  e.waitUntil(red.catch(() => {}));
});
