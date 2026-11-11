// Şehirler ve aralarındaki mesafe. Satıcı adları kurgusaldır.
export interface City { ad: string; lat: number; lon: number }
/** Toptancıların bulunduğu şehirler. */
export const CITIES: City[] = [
  { ad: "İstanbul", lat: 41.01, lon: 28.98 }, { ad: "Kocaeli", lat: 40.77, lon: 29.92 }, { ad: "Bursa", lat: 40.19, lon: 29.06 },
  { ad: "Eskişehir", lat: 39.78, lon: 30.52 }, { ad: "Ankara", lat: 39.93, lon: 32.86 }, { ad: "İzmir", lat: 38.42, lon: 27.14 },
  { ad: "Konya", lat: 37.87, lon: 32.48 }, { ad: "Nevşehir", lat: 38.62, lon: 34.71 }, { ad: "Samsun", lat: 41.29, lon: 36.33 },
  { ad: "Mersin", lat: 36.8, lon: 34.63 }, { ad: "Adana", lat: 37.0, lon: 35.32 }, { ad: "Trabzon", lat: 41.0, lon: 39.72 },
  { ad: "Gaziantep", lat: 37.07, lon: 37.38 },
];
/** Dükkân açılabilen iller. demand: satış hızı çarpanı (nüfus). rentK: kira çarpanı. level: açılma seviyesi. */
export interface ShopCity { id: string; ad: string; level: number; demand: number; rentK: number }
export const SHOP_CITIES: ShopCity[] = [
  { id: "istanbul", ad: "İstanbul", level: 1, demand: 1, rentK: 1 },
  { id: "ankara", ad: "Ankara", level: 4, demand: 0.85, rentK: 0.7 },
  { id: "izmir", ad: "İzmir", level: 7, demand: 0.8, rentK: 0.65 },
];
export const SELLERS = ["Yıldız Gıda", "Akçay Toptan", "Demirci Ticaret", "Bereket Pazarlama", "Öztürk Kardeşler", "Anadolu Dağıtım", "Karaca Gıda", "Marmara Toptan", "Güneş Ticaret", "Sarıkaya Gıda", "Poyraz Dağıtım", "Toros Pazarlama"];

const ROAD = 1.3; // kuş uçuşu mesafeyi karayoluna yaklaştıran çarpan
const CITY_KM = 20; // aynı şehir içi
const byAd: Record<string, City> = {};
CITIES.forEach((c) => (byAd[c.ad] = c));
/** İki şehir arası yaklaşık karayolu mesafesi (km). */
export function distKm(a: string, b: string): number {
  const A = byAd[a], B = byAd[b];
  if (!A || !B || a === b) return CITY_KM;
  const r = Math.PI / 180, dLat = (B.lat - A.lat) * r, dLon = (B.lon - A.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(A.lat * r) * Math.cos(B.lat * r) * Math.sin(dLon / 2) ** 2;
  return Math.max(CITY_KM, Math.round(6371 * 2 * Math.asin(Math.sqrt(h)) * ROAD));
}
