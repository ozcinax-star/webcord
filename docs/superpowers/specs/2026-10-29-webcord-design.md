# Webcord - Tasarım

## Amaç
Oyun oynarken arkadaşlarla hesap açmadan, tarayıcıdan hızlıca sesli (ve basit yazılı) sohbet. Giriş sadece tek seferlik takma ad + oda kodu ile. GitHub Pages'te yayınlanan statik bir site; sunucu yok, derleme adımı yok. Hafif olmalı, oyunu yormamalı.

## Kapsam
- Takma ad + oda kodu ile katılma; "Oda oluştur" ile rastgele 6 karakterlik kod üretme.
- Sesli sohbet (sadece ses, mesh WebRTC), 2-6 kişi.
- Odada basit yazılı sohbet (kalıcı değil).
- Katılımcı listesi, konuşan kişi göstergesi, mikrofon aç/kapat, ayrıl, oda kodu/link kopyalama.

## Kapsam dışı
Hesaplar, kalıcı odalar, şifreli odalar, video, ekran paylaşımı, mesaj geçmişi, TURN sunucusu.

## Mimari
- Dosyalar: `index.html`, `style.css`, `app.js` (ES module). Kütüphane CDN'den (Trystero, sabit sürüm).
- Sinyalleşme: Trystero (genel BitTorrent tracker'ları üzerinden eş bulma). Oda kodu = Trystero oda adı (uygulama ID'si ile önekli).
- Ses: `getUserMedia` (echoCancellation, noiseSuppression, autoGainControl açık), her eşe doğrudan WebRTC ses akışı, Opus kodek. STUN: genel ücretsiz sunucular.
- Metin ve takma ad: Trystero veri kanalı (`makeAction`) ile yayınlanır.

## Ekranlar
1. **Giriş:** takma ad, oda kodu, "Katıl", "Oda oluştur". Takma ad ve kod doğrulanır (boş olamaz, kod büyük/küçük harf duyarsız normalize edilir). `?oda=KOD` linki kodu otomatik doldurur.
2. **Oda:** katılımcı listesi (konuşma göstergeli), mikrofon aç/kapat, ayrıl, kopyalanabilir kod/link, sohbet alanı + mesaj kutusu.

## Veri akışı
Giriş -> mikrofon izni -> `joinRoom` -> eş katılınca takma ad alışverişi ve ses akışı eklenir -> gelen ses bir `<audio>` öğesine bağlanır -> konuşma algısı `AnalyserNode` ile yerel ve uzak akışlarda ses seviyesinden hesaplanır -> eş ayrılınca listeden ve audio öğesinden kaldırılır. Hiçbir veri saklanmaz.

## Hata durumları
- Mikrofon reddedilir/yok: dinleyici olarak katılma + açıklayıcı uyarı.
- Aynı takma ad: görüntülemede otomatik numara eklenir ("Ali (2)").
- 6'dan fazla katılımcı: uyarı gösterilir (mesh sınırı), engellenmez.
- Mesaj HTML olarak yorumlanmaz (`textContent`); uzunluk sınırı.
- Bağlantı kurulamayan eş (sıkı NAT): bilgi notu README'de.

## Test
Yerel statik sunucuda iki tarayıcı sekmesi/profiliyle elle doğrulama: katılma, ses, sohbet, ayrılma, mikrofon reddi, takma ad çakışması. Ardından GitHub Pages yayın adımları README'de.

## Başarı ölçütü
İki kişi, hesapsız, bir kod ile odaya girip karşılıklı konuşup yazışabiliyor; site GitHub Pages'ten çalışıyor.
