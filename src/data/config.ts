// Denge değerlerinin tamamı burada. Oyun içindeki ayar paneli bu nesneyi canlı değiştirir.
export const CONFIG = {
  startCash: 3000,
  daySec: 240, // bir oyun günü (sn)
  marketSec: 150, // piyasa güncelleme aralığı (sn); gerçek oyunda hedef 1200
  rateScale: 1,
  rentScale: 1,
  shipPerKm: 0.004, // TL / km / birim
  churnSec: 12, // ilanların canlı değişim aralığı (sn)
  xpBase: 1800, // seviye n için gereken toplam ciro: xpBase * (n-1)^xpPow
  xpPow: 2.2,
  loanRatio: 0.6, // kredi limiti = servet * oran
  interestDay: 0.02, // taban günlük faiz
  // Borç / limit oranı eşiği geçtikçe faiz çarpanı büyür. Limit aşılırsa cezai oran uygulanır.
  interestSteps: [
    { from: 0.5, k: 1.5 },
    { from: 0.8, k: 2.25 },
    { from: 1.0001, k: 4 },
  ],
  // Maliyetine hemen satış: mal anında maliyetine nakde döner.
  // true ise piyasa alış anına göre düştüyse düşüş oranında eksik ödenir (fiyat riski oyuncuda kalır).
  sellBackMarketRisk: true,
  // Pazarda ilan: alıcı hızı = ürünün taban hızı x offerRateK; fiyat piyasa değerinin %10 üstündeyse kimse almaz, %10 altındaysa iki kat hızlı gider.
  offerRateK: 3,
  offerPriceSens: 10,
  offerFee: 0.05, // pazar komisyonu
  // Günlük kâr üzerinden dilimli vergi (her dilim yalnızca kendi aralığına uygulanır).
  taxBrackets: [
    { upTo: 1000, rate: 0 },
    { upTo: 5000, rate: 0.1 },
    { upTo: 20000, rate: 0.2 },
    { upTo: Infinity, rate: 0.3 },
  ],
  states: {
    sakin: { ad: "Sakin piyasa", m: 1 },
    canli: { ad: "Canlı piyasa", m: 1.15 },
    kotu: { ad: "Kötü piyasa", m: 0.8 },
  },
  sizes: [
    { ad: "Küçük", shelves: 1, depot: 1200, rent: 60, costK: 0, offers: 1 },
    { ad: "Orta", shelves: 3, depot: 3000, rent: 300, costK: 0.6, offers: 2 },
    { ad: "Büyük", shelves: 6, depot: 6000, rent: 700, costK: 3, offers: 3 },
  ],
};
export type MarketState = keyof typeof CONFIG.states;
