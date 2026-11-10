import { describe, it, expect, beforeEach } from "vitest";
import * as k from "../src/engine";
import { CONFIG } from "../src/data/config";
import { runBot } from "../scripts/bot";

beforeEach(() => { k.setSeed(42); k.newGame(); });
const mk = (pid: string, q: number, price: number, qty = 1000): k.Listing => ({ id: 999, pid, seller: "T", city: "İstanbul", km: 0, q, qty, price, sys: true });

describe("mal alımı", () => {
  it("kalite ve maliyet ağırlıklı ortalamayla birleşir", () => {
    k.buy(mk("makarna", 40, 10), 50); k.buy(mk("makarna", 80, 14), 50);
    const st = k.S.shops[0].stock.makarna;
    expect(st.q).toBe(100); expect(st.qual).toBeCloseTo(60); expect(st.cost).toBeCloseTo(12);
  });
  it("kasayı ve depoyu aşamaz", () => {
    expect(k.buy(mk("makarna", 50, 10), 99999)).toBe(300); // 3000 TL / 10
    expect(k.S.cash).toBeGreaterThanOrEqual(0);
    k.S.cash = 1e6; k.buy(mk("makarna", 50, 1, 99999), 99999);
    expect(k.depotUsed(k.S.shops[0])).toBe(CONFIG.sizes[0].depot);
  });
  it("seviyesi gelmemiş ya da dükkânı olmayan ürün alınamaz", () => {
    expect(k.buy(mk("cay", 50, 1), 10)).toBe(0); // bakkalın 4. ürünü: 2. seviye
    expect(k.buy(mk("domates", 50, 1), 10)).toBe(0); // manav yok
  });
  it("alınan yeni ürün boş rafa yerleşir ve satılır", () => {
    k.buy(mk("makarna", 50, 10), 100);
    expect(k.S.shops[0].shelves[0]?.pid).toBe("makarna");
    k.step(60);
    expect(k.S.shops[0].stock.makarna.q).toBeLessThan(100);
  });
});

describe("satış hızı", () => {
  it("%70 üstü kalitede sıçrar, taban hızın altına düşmez", () => {
    expect(k.qualMult(70)).toBeGreaterThan(k.qualMult(69) * 1.2);
    expect(k.priceMult(5)).toBeCloseTo(0.6); expect(k.qualMult(0)).toBeCloseTo(0.8);
  });
});

describe("banka", () => {
  it("limit servete bağlıdır, borç limiti aşamaz", () => {
    const lim = k.loanLimit();
    expect(lim).toBe(Math.floor((3500 * CONFIG.loanRatio) / 100) * 100);
    expect(k.borrow(1e9)).toBe(lim); expect(k.borrow(100)).toBe(0);
    expect(k.repay(1e9)).toBe(lim); expect(k.S.debt).toBe(0);
  });
  it("faiz gün sonunda kesilir", () => {
    k.borrow(1000); const before = k.S.cash; // limitin yarısının altı: taban oran
    k.step(CONFIG.daySec);
    expect(k.S.cash).toBeCloseTo(before - CONFIG.sizes[0].rent - 1000 * CONFIG.interestDay);
  });
  it("borç limite yaklaştıkça faiz kademeli artar", () => {
    const lim = k.loanLimit();
    expect(k.interestRate(lim * 0.4)).toBeCloseTo(CONFIG.interestDay);
    expect(k.interestRate(lim * 0.6)).toBeCloseTo(CONFIG.interestDay * 1.5);
    expect(k.interestRate(lim * 0.9)).toBeCloseTo(CONFIG.interestDay * 2.25);
    expect(k.interestRate(lim * 1.2)).toBeCloseTo(CONFIG.interestDay * 4);
  });
  it("tek raflı bakkal, limitinin tamamını çekse bile zarara geçmez", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      k.setSeed(seed); k.newGame();
      // başlangıçtaki üç üründen en kârlısının en ucuz ilanı
      const best = ["makarna", "un", "seker"].map((p) => k.allListings(p)[0]).sort((a, b) => (k.refPrice(b.pid) - k.net(b)) * k.P[b.pid].rate - (k.refPrice(a.pid) - k.net(a)) * k.P[a.pid].rate)[0];
      k.buy(best, 100);
      k.borrow(1e9);
      expect(k.dayProfitEstimate() - k.S.debt * k.interestRate()).toBeGreaterThan(0);
    }
  });
});

describe("zararına hemen satış", () => {
  const setup = () => { const l = k.allListings("makarna").find((x) => !x.sys)!; k.buy(l, 100); return k.S.shops[0]; };
  it("maliyetin %25 altında satar", () => {
    const sh = setup(), cost = sh.stock.makarna.cost, before = k.S.cash;
    const r = k.sellBack(sh, "makarna", 40);
    expect(r).toBeCloseTo(40 * cost * (1 - CONFIG.sellBackLoss), 0); expect(sh.stock.makarna.q).toBe(60); expect(k.S.cash).toBeCloseTo(before + r);
  });
  it("piyasa yükselse de düşse de zarar oranı aynıdır", () => {
    const sh = setup(), cost = sh.stock.makarna.cost, m0 = k.S.market.mult.makarna;
    for (const f of [0.8, 1.3]) { k.S.market.mult.makarna = m0 * f; expect(k.sellBackPrice(sh, "makarna")).toBeCloseTo(cost * (1 - CONFIG.sellBackLoss), 1); }
  });
});

describe("pazarda ilan", () => {
  const stock = () => { k.buy(mk("makarna", 50, 10), 200); return k.S.shops[0]; };
  it("piyasa değerinde beklenen hızda satılır, komisyon kesilir, seviye puanı vermez", () => {
    const sh = stock(), fair = k.offerFair("makarna", 50), xp0 = k.S.xp;
    sh.shelves[0] = null; // raf satışı karışmasın
    const o = k.createOffer(sh, "makarna", 200, fair)!, cash0 = k.S.cash;
    k.step(60);
    const sold = 200 - o.qty;
    expect(sold).toBeGreaterThanOrEqual(Math.floor(k.P.makarna.rate * CONFIG.offerRateK) - 1);
    expect(k.S.cash).toBeCloseTo(cash0 + sold * o.price * (1 - CONFIG.offerFee), 1);
    expect(k.S.xp).toBe(xp0);
  });
  it("piyasa değerinin %10 üstünde alıcı bulmaz", () => {
    const sh = stock(); sh.shelves[0] = null;
    const o = k.createOffer(sh, "makarna", 200, k.offerFair("makarna", 50) * 1.11)!;
    k.step(60); expect(o.qty).toBe(200);
  });
  it("ilan hakkı dükkân boyutuyla sınırlıdır ve ilandaki mal depoda yer tutar", () => {
    const sh = stock();
    expect(k.createOffer(sh, "makarna", 50, 9)).not.toBeNull();
    expect(k.createOffer(sh, "makarna", 50, 9)).toBeNull(); // küçük dükkân: 1 ilan
    expect(k.depotUsed(sh)).toBe(200);
  });
  it("geri çekilen ilan depoya paçal olarak döner", () => {
    const sh = stock(), o = k.createOffer(sh, "makarna", 100, 99)!;
    k.S.cash = 1e5;
    k.buy(mk("makarna", 80, 14), 100); // depoda artık 100 @%50 + 100 @%80
    k.cancelOffer(o.id);
    expect(sh.stock.makarna.q).toBe(300); expect(sh.stock.makarna.qual).toBeCloseTo(60); expect(k.S.offers.length).toBe(0);
  });
});

describe("devlet", () => {
  it("vergi dilimlidir: her oran yalnızca kendi dilimine uygulanır", () => {
    expect(k.taxFor(800)).toBe(0);
    expect(k.taxFor(3000)).toBeCloseTo(200); // (3000-1000) x %10
    expect(k.taxFor(10000)).toBeCloseTo(400 + 1000); // 4000 x %10 + 5000 x %20
    expect(k.taxFor(30000)).toBeCloseTo(400 + 3000 + 3000);
  });
  it("zarar eden günde vergi kesilmez", () => {
    const before = k.S.cash; k.step(CONFIG.daySec);
    expect(k.S.cash).toBeCloseTo(before - CONFIG.sizes[0].rent);
  });
});

describe("denge (aynı tohumla tekrarlanabilir)", () => {
  it("aynı tohum aynı sonucu verir", () => { expect(runBot(7, "ucuz", 30)).toEqual(runBot(7, "ucuz", 30)); });
  it("kredisiz temkinli bot 2 oyun saatinde iflas etmez ve manavı açar", () => {
    for (const seed of [11, 222, 3333]) { const r = runBot(seed, "ucuz", 120); expect(r.dead).toBeNull(); expect(r.ev.some((e) => e.startsWith("manav@"))).toBe(true); }
  });
});
