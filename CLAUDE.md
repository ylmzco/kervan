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
- `src/data/world.ts` — şehirler, satıcı adları
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

## Kapsam anayasası (bunlar eklenmez, sorulmadan geri getirilmez)
- Rafa aktarma angaryası: tek satış deposu var, alınan mal anında satışta.
- Yolda bekleme: teslimat anında, nakliye yalnızca mesafe bazlı masraf.
- Dolar, petrol, makro bülten zinciri.
- kg, litre gibi birimler: her şey "birim".
- Aktif tahsilat, VIP, bekletme sayaçları.
- Satışı cezalandıran belirsiz talep formülü: taban hız garantili, fiyat ve kalite çarpandır.

## Bilinen borç
- `src/ui.ts` prototipten olduğu gibi taşındı, `@ts-nocheck` ile tip denetimi dışında. Ekranlar yeniden tasarlanırken parçalara ayrılıp tiplenecek.
- Borcunu hiç ödemeyen botlar başta hızlı, sonda yavaş; ölçülü borçlanan en iyisi. Hiçbiri iflas etmiyor: iflasın gerçek bir tehdit olup olmayacağı oynayarak karar verilecek.
- "Zararına hemen sat" yalnızca rafta olan ürün için arayüzde var.
- Pazarda ilan: kelepir alıp piyasa değerinden satan bot, ölçülü bota göre tekele %20–30 erken ulaşıyor. Piyasa dalgasını zamanlayan (kötüde alıp canlıda satan) oyuncu ölçülmedi.
- Her türden tek dükkân, tek il (İstanbul).
