# Kervan

Türkiye'de geçen mobil ticaret ve işletme oyunu. Hedef his: eski Facebook oyunu Kapitalizm 2, modern mobil arayüzle.
Yalnızca mobil, dikey ekran. Web ile geliştirilir, mağazaya Capacitor ile çıkacak.

## Komutlar
- `npm run dev` — geliştirme sunucusu (telefondan aynı ağda açılabilir)
- `npm test` — motor testleri (vitest)
- `npm run sim` — denge simülasyonu: beş bot (kredisiz, ölçülü, açgözlü, krediyle stokçu, ilancı), üç dünya, 5 oyun saati
- `npm run check` — tip denetimi
- `npm run smoke` — derler ve gerçek tarayıcıda akışı oynatır (Python + Playwright + Chrome ister)
- `npm run build` — `dist/` üretir

## Yapı
- `src/data/config.ts` — denge değerlerinin tamamı
- `src/data/shops.ts` — dükkân türleri ve ürünler
- `src/data/world.ts` — şehirler, mesafe hesabı, dükkân açılabilen iller, satıcı adları
- `src/engine.ts` — oyun motoru; DOM bilmez, Node'da çalışır
- `src/ui.ts` — arayüz (render, alt sayfalar, dokunma, kayıt)
- `scripts/bot.ts`, `scripts/sim.ts` — denge botu ve simülasyon
- `tests/` — motor testleri
- `design/game-brief.md` — oyunun bir sayfalık özeti
- `prototypes/` — ilk tek dosyalık prototip (arşiv, dokunma)

## Çalışma kuralları
- Her oturumda tek özellik. Özellik bitince: `npm test`, `npm run sim`, `npm run smoke`, sonra oyna, sonra commit.
- Yayınlamadan önce smoke testinin sonucunu gör; testle yayını aynı anda başlatma.
- Denge değeri değişirse sim çıktısını öncekiyle karşılaştır ve farkı söyle.
- Rakamlar `src/data/` içinde durur; motora ya da arayüze sayı gömme.
- Oyun kuralı `engine.ts` içinde, gösterim `ui.ts` içinde. Arayüz kural hesaplamaz.

## Tasarım
Kaynak: "Kervan — UI/UX Brief" belgesi (çarşı defteri ile borsa ekranı). Değerler `src/style.css` başındaki `:root` belirteçlerinde.
- Yeşil ve kırmızı yalnızca para ve kalite içindir. Birincil eylem lacivert (`--accent`), dikkat isteyen iş safran.
- Renk tek başına anlam taşımaz: kârda işaret (+ / −), yönde ok (▲ ▼), kalitede sayı hep yazılır.
- Başlık Big Shoulders Display (büyük harf), gövde Archivo, çıplak sayılar IBM Plex Mono. Para birimi "₺", sayıdan sonra.
- 4 px ızgara (4, 8, 12, 16, 24); kart köşesi 12, buton 8, rozet tam yuvarlak. Dokunma hedefi en az 44 px.
- Pasif buton nedenini yazar. Buton fiille başlar, para içeren butonda tutar yazar.
- Açık ve koyu tema birlikte tanımlıdır; yeni renk eklerken ikisini de doldur.

## Kapsam anayasası (bunlar eklenmez, sorulmadan geri getirilmez)
- Rafa aktarma angaryası: tek satış deposu var, alınan mal anında satışta.
- Yolda bekleme: teslimat anında, nakliye yalnızca mesafe bazlı masraf.
- Dolar, petrol, makro bülten zinciri.
- kg, litre gibi birimler: her şey "birim".
- Aktif tahsilat, VIP, bekletme sayaçları.
- Satışı cezalandıran belirsiz talep formülü: taban hız garantili, fiyat ve kalite çarpandır.

## Bilinen borç
- Fontlar Google Fonts'tan yükleniyor; Capacitor sürümünde dosya olarak pakete girmeli.
- Brief'teki sayı biçimi (100 ₺ ve üstü kuruşsuz) ve kalite hapı eşikleri (80 / 65) henüz tam uygulanmadı; oyun kalite eşiği olarak 70 kullanıyor.
- `src/ui.ts` prototipten olduğu gibi taşındı, `@ts-nocheck` ile tip denetimi dışında. Ekranlar yeniden tasarlanırken parçalara ayrılıp tiplenecek.
- Borcunu hiç ödemeyen botlar başta hızlı, sonda yavaş; ölçülü borçlanan en iyisi. Hiçbiri iflas etmiyor: iflasın gerçek bir tehdit olup olmayacağı oynayarak karar verilecek.
- "Zararına hemen sat" yalnızca rafta olan ürün için arayüzde var.
- Pazarda ilan: kelepir alıp piyasa değerinden satan bot, ölçülü bota göre tekele %20–30 erken ulaşıyor. Piyasa dalgasını zamanlayan (kötüde alıp canlıda satan) oyuncu ölçülmedi.
- Üç il var (İstanbul, Ankara, İzmir); her ilde her türden tek dükkân. İl farkı yalnızca satış hızı, kira ve nakliye mesafesi; ile özgü ürün ya da fiyat yok.
- Hız düğmesi ve Ayar paneli herkese açık test araçları; mağaza sürümünden önce gizlenecek. Gerçek oyunculu sürümde kasa, stok ve zaman sunucuda tutulmalı.
