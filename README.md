# Webcord

Hesapsız sesli + yazılı sohbet. Takma ad ve oda kodu yeterli. Statik site, sunucu ve derleme yok.

## Kullanım
Takma adını yaz, "Oda oluştur" de, çıkan kodu veya "Linki kopyala" ile aldığın linki arkadaşlarına gönder. Onlar da kodu girip katılır. Ses doğrudan tarayıcılar arasında akar (WebRTC), hiçbir şey kaydedilmez. 2-6 kişi için uygundur.

## Yerelde deneme
    python -m http.server 8000     # sonra http://localhost:8000
    node --test "tests/*.test.js"  # mantık testleri

## GitHub Pages'e yayınlama
1. Bu klasörü bir GitHub deposuna yükle (`index.html` kökte olmalı).
2. Depoda **Settings → Pages → Build and deployment**: Source "Deploy from a branch", Branch `main` / `/ (root)`.
3. Birkaç dakika sonra `https://KULLANICI.github.io/DEPO/` adresi açılır. Mikrofon için HTTPS gerekir, Pages bunu sağlar.

## Notlar
- Eşleşme genel BitTorrent tracker'ları üzerinden yapılır (Trystero); kendi sunucun yoktur.
- TURN sunucusu yok: çok sıkı NAT/güvenlik duvarı arkasındaki bazı kullanıcılar bağlanamayabilir.
- Bir oda kodunu bilen herkes odaya girebilir; kodu sadece arkadaşlarınla paylaş.
