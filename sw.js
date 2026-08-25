/* Packliste — Offline-Betrieb
   Beim ersten Aufruf werden alle Dateien in den Cache gelegt. Danach laeuft die
   Liste auch ohne Netz. Mit Netz wird im Hintergrund aktualisiert.

   WICHTIG bei Aenderungen: CACHE hochzaehlen, sonst sehen Nutzer mit
   installierter App weiterhin die alte Fassung. Neue Dateien in DATEIEN
   eintragen.                                                                */
const CACHE = "packliste-v5";
const DATEIEN = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/data.js",
  "./js/storage.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(DATEIEN))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, {ignoreSearch:true}).then(treffer => {
      const netz = fetch(e.request).then(antwort => {
        if(antwort && antwort.status === 200 && antwort.type === "basic"){
          const kopie = antwort.clone();
          caches.open(CACHE).then(c => c.put(e.request, kopie));
        }
        return antwort;
      }).catch(() => treffer);
      return treffer || netz;
    })
  );
});
