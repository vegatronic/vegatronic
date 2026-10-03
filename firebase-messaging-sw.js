// VEGA TAKİP — Firebase Cloud Messaging arka plan servis çalışanı.
// Bu dosyayı PWA'nızın KÖK dizinine ("index.html" ile aynı klasöre) koyun.
// Uygulama kapalıyken veya arka plandayken gelen bildirimleri bu dosya yönetir.

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// ↓↓↓ Firebase konsolundan aldığınız config değerlerini buraya yapıştırın ↓↓↓
firebase.initializeApp({
  apiKey: 'FIREBASE_API_KEY',
  authDomain: 'FIREBASE_AUTH_DOMAIN',
  projectId: 'FIREBASE_PROJECT_ID',
  storageBucket: 'FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
  appId: 'FIREBASE_APP_ID'
});
// ↑↑↑ Bu değerleri firebase-init.js dosyasındakiyle AYNI yapın ↑↑↑

var messaging = firebase.messaging();

// Uygulama kapalıyken/arka plandayken gelen bildirimi göster
messaging.onBackgroundMessage(function (payload) {
  var title = (payload.notification && payload.notification.title) || 'Vega Takip';
  var body = (payload.notification && payload.notification.body) || '';
  self.registration.showNotification(title, {
    body: body,
    icon: '/icons/icon-192.png',
    badge: '/icons/favicon-32.png',
    data: payload.data || {}
  });
});

// Bildirime tıklanınca uygulamayı aç / öne getir
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if ('focus' in clientList[i]) return clientList[i].focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
