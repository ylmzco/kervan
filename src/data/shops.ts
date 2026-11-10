// Dükkân türleri ve ürünleri. Ürün: [id, ad, sistem toptan fiyatı].
// İlk 3 ürün dükkânla birlikte açılır; sonrakiler birer seviye arayla.
export interface ShopType {
  id: string;
  ad: string;
  level: number; // açılma seviyesi
  cost: number; // açılış bedeli
  tier: number; // kira çarpanı
  products: [string, string, number][];
}
export const TYPES: ShopType[] = [
  { id: "bakkal", ad: "Bakkal", level: 1, cost: 3500, tier: 1, products: [["makarna", "Makarna", 14], ["un", "Un", 22], ["seker", "Şeker", 36], ["cay", "Çay", 42], ["pirinc", "Pirinç", 48], ["yag", "Ayçiçek yağı", 78]] },
  { id: "manav", ad: "Manav", level: 3, cost: 6000, tier: 1.1, products: [["sogan", "Soğan", 12], ["patates", "Patates", 16], ["domates", "Domates", 28], ["elma", "Elma", 34], ["limon", "Limon", 40], ["muz", "Muz", 62]] },
  { id: "kuruyemis", ad: "Kuruyemişçi", level: 6, cost: 18000, tier: 2, products: [["leblebi", "Leblebi", 60], ["cekirdek", "Ay çekirdeği", 70], ["findik", "Fındık", 95], ["kayisi", "Kuru kayısı", 180], ["ceviz", "Ceviz", 240], ["fistik", "Antep fıstığı", 320]] },
  { id: "tekel", ad: "Tekel bayii", level: 9, cost: 40000, tier: 3, products: [["soda", "Soda", 12], ["cakmak", "Çakmak", 18], ["bira", "Bira", 55], ["sigara", "Sigara", 85], ["sarap", "Şarap", 220], ["raki", "Rakı", 650]] },
];
