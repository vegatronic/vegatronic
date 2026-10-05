// Vega Takip — uygulama kabuğunu (arayüz dosyalarını) önbelleğe alır,
// böylece uygulama "kurulabilir" olur ve çevrimdışı/yavaş bağlantıda da açılır.
// ÖNEMLİ: Google Apps Script'e giden veri çağrıları (POST) hiçbir zaman
// önbelleğe alınmaz veya buradan yakalanmaz — her zaman doğrudan ağa gider.
//
// Bu dosya AYNI ZAMANDA Firebase Cloud Messaging'in arkaplan bildirimlerini de
// yönetir (uygulama kapalıyken/arkaplandayken gelen anlık bildirimler).
// Firebase için AYRI bir service worker dosyası KULLANILMIYOR — tarayıcıda
// aynı adres (scope) için sadece bir service worker aktif olabilir, iki ayrı
// dosya kaydedilirse biri diğerini devre dışı bırakır. Bu yüzden ikisi tek
// dosyada birleştirildi.

var CACHE_NAME = "vega-takip-v5";
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

  // Sabit kütüphane/yazı tipi dosyaları (sürüm numarası adreste olduğu için
  // içerikleri hiç değişmez): önce önbellek, yoksa ağdan alıp sakla. Böylece
  // ilk açılıştan sonra hiç internetten beklenmezler.
  var CDN_HOSTS = ["cdnjs.cloudflare.com", "www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"];
  if (CDN_HOSTS.indexOf(url.hostname) !== -1) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (res) {
          if (res && (res.ok || res.type === "opaque")) {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
          }
          return res;
        });
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return; // Apps Script çağrılarına dokunma

  // Sayfanın kendisi (HTML) her zaman önce ağdan denenir, böylece yeni bir
  // sürüm yayınlandığında kullanıcı anında görür. Sadece ağ ulaşılamazsa
  // (çevrimdışı) önbellekteki son sürüme düşer.
  if (req.mode === "navigate" || (req.headers.get("accept") || "").indexOf("text/html") !== -1) {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  // Diğer statik dosyalar (ikonlar vb.) için: önbellek varsa onu göster,
  // arkaplanda ağdan güncelle.
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

// ---------- Firebase Cloud Messaging (arkaplan bildirimleri) ----------
// Firebase konsolu → Proje Ayarları → Genel sekmesindeki "Web app" config'ini
// buraya yapıştırın. firebase-init.js'teki değerlerle AYNI olmalı.
try {
  importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

  var firebaseConfig = {
    apiKey: 'AIzaSyC3arUWoYmBqjl2hKN2DWSyUyC85-39V30',
    authDomain: 'vega-takip.firebaseapp.com',
    projectId: 'vega-takip',
    storageBucket: 'vega-takip.firebasestorage.app',
    messagingSenderId: '677746478495',
    appId: '1:677746478495:web:8e38e916a601defa4b01aa'
  };

  if (firebaseConfig.apiKey !== 'FIREBASE_API_KEY') {
    firebase.initializeApp(firebaseConfig);
    var messaging = firebase.messaging();

    // Uygulama kapalıyken/arkaplandayken gelen bildirimi göster.
    messaging.onBackgroundMessage(function (payload) {
      var title = (payload.notification && payload.notification.title) || 'Vega Takip';
      var body = (payload.notification && payload.notification.body) || '';
      self.registration.showNotification(title, {
        body: body,
        icon: './icons/icon-192.png',
        badge: './icons/favicon-32.png',
        data: payload.data || {}
      });
    });
  }
} catch (e) {
  // Firebase henüz kurulmadıysa (config placeholder) sessizce geç —
  // uygulama kabuğu önbellekleme (yukarıdaki) yine normal çalışır.
}

// Bildirime tıklanınca uygulamayı aç / öne getir.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if ('focus' in clientList[i]) return clientList[i].focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
