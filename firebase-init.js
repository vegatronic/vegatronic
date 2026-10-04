// VEGA TAKİP — Firebase Cloud Messaging istemci başlatma.
// Bu dosyayı PWA index.html'inize <script src="firebase-init.js"></script>
// olarak ekleyin (Firebase SDK script'lerinden SONRA, kapanış </body>'den önce).
// index.html'e ayrıca şunları da ekleyin:
//   <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js"></script>

// ↓↓↓ Firebase konsolu → Proje Ayarları → Genel sekmesindeki "Web app" config'ini buraya yapıştırın ↓↓↓
var firebaseConfig = {
  apiKey: 'FIREBASE_API_KEY',
  authDomain: 'FIREBASE_AUTH_DOMAIN',
  projectId: 'FIREBASE_PROJECT_ID',
  storageBucket: 'FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
  appId: 'FIREBASE_APP_ID'
};
// Firebase konsolu → Proje Ayarları → Cloud Messaging → "Web Push sertifikaları" → Anahtar çifti
var VAPID_KEY = 'FIREBASE_VAPID_PUBLIC_KEY';
// ↑↑↑ ↑↑↑

var vegaMessaging = null;
function vegaInitFirebase() {
  if (!window.firebase || vegaMessaging) return;
  firebase.initializeApp(firebaseConfig);
  vegaMessaging = firebase.messaging();
}

// "Bildirimleri Aç" butonuna bağlayın.
// Döndürdüğü promise başarılı olursa cihaz artık bildirim alabilir demektir.
// NOT: Ayrı bir "firebase-messaging-sw.js" KAYDETMİYORUZ — Firebase'in
// arkaplan bildirim mantığı zaten ana "service-worker.js" içine taşındı
// (aynı adres/scope'ta iki service worker birbirini devre dışı bırakır).
function vegaEnablePushNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return Promise.reject(new Error('Bu tarayıcı cihaz bildirimlerini desteklemiyor.'));
  }
  if (!window.getToken || !getToken()) {
    return Promise.reject(new Error('Önce giriş yapmalısınız.'));
  }
  return navigator.serviceWorker.ready.then(function (registration) {
    vegaInitFirebase();
    return Notification.requestPermission().then(function (permission) {
      if (permission !== 'granted') throw new Error('Bildirim izni verilmedi.');
      return vegaMessaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    });
  }).then(function (fcmToken) {
    if (!fcmToken) throw new Error('Cihaz token\'ı alınamadı.');
    return new Promise(function (resolve, reject) {
      window.google.script.run
        .withSuccessHandler(function () { resolve(fcmToken); })
        .withFailureHandler(reject)
        .registerFcmToken(getToken(), fcmToken);
    });
  }).then(function (fcmToken) {
    try { localStorage.setItem('vega_push_enabled', '1'); } catch (e) {}
    return fcmToken;
  });
}

// Uygulama ön plandayken (açıkken) gelen bildirimleri de göster.
// Arka plan/kapalıyken ana service-worker.js zaten gösteriyor.
window.addEventListener('DOMContentLoaded', function () {
  try {
    if (localStorage.getItem('vega_push_enabled') === '1') {
      vegaInitFirebase();
      vegaMessaging.onMessage(function (payload) {
        var title = (payload.notification && payload.notification.title) || 'Vega Takip';
        var body = (payload.notification && payload.notification.body) || '';
        if (Notification.permission === 'granted') {
          new Notification(title, { body: body, icon: './icons/icon-192.png' });
        }
        // Aynı anda uygulama-içi bildirim zilini de tazele (varsa):
        if (window.vegaRefreshNotifications) window.vegaRefreshNotifications();
      });
    }
  } catch (e) {}
});
