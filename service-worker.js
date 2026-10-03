// Vega Takip — uygulama kabuğunu (arayüz dosyalarını) önbelleğe alır,
// böylece uygulama "kurulabilir" olur ve çevrimdışı/yavaş bağlantıda da açılır.
// ÖNEMLİ: Google Apps Script'e giden veri çağrıları (POST) hiçbir zaman
// önbelleğe alınmaz veya buradan yakalanmaz — her zaman doğrudan ağa gider.

var CACHE_NAME = "vega-takip-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return; // veri yazma çağrılarına dokunma
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Apps Script çağrılarına dokunma

  event.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
