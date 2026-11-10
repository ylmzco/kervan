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
    k.borrow(2000); const before = k.S.cash;
    k.step(CONFIG.daySec);
    expect(k.S.cash).toBeCloseTo(before - CONFIG.sizes[0].rent - 2000 * CONFIG.interestDay);
  });
});

describe("denge (aynı tohumla tekrarlanabilir)", () => {
  it("aynı tohum aynı sonucu verir", () => { expect(runBot(7, "ucuz", 30)).toEqual(runBot(7, "ucuz", 30)); });
  it("kredisiz temkinli bot 2 oyun saatinde iflas etmez ve manavı açar", () => {
    for (const seed of [11, 222, 3333]) { const r = runBot(seed, "ucuz", 120); expect(r.dead).toBeNull(); expect(r.ev.some((e) => e.startsWith("manav@"))).toBe(true); }
  });
});
