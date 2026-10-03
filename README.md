# Vega Grup Dijital Takip Sistemi

Üretim-Teslimat, Bakım-Servis ve Personel takibi için kurumsal, PWA (yüklenebilir uygulama) olarak çalışan takip sistemi.

🔗 **Canlı uygulama:** https://vegatronic.github.io/vegatronic/

## Nasıl çalışır?

- Arayüz bu depoda statik dosyalar olarak barınır (GitHub Pages).
- Veriler hâlâ Google Sheets'te tutulur; uygulama Google Apps Script Web App'e (`/exec` adresi) bağlanarak okuma/yazma yapar.
- İlk açılışta uygulama senden Apps Script dağıtım adresini bir kere ister ve cihazında saklar.
- Telefon/bilgisayarda "Ana ekrana ekle" ile normal bir uygulama gibi kurulabilir.

## Güncelleme

Tasarım veya mantık değiştiğinde `index.html`, `manifest.json`, `service-worker.js` ve `icons/` dosyaları güncellenip bu depoya gönderilir; GitHub Pages otomatik olarak yeni sürümü yayınlar.
