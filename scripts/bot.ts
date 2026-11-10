// Denge için basit bir oyuncu. "ucuz": krediye dokunmaz. "olcu": limitinin yarısına kadar borçlanır. "kredi": limitini hep sonuna kadar kullanır. "stok": depoyu doldurmak için gerektiği kadar borçlanır, borcu hiç ödemez, büyümeyi kârıyla yapar. "ilan": ölçülü bot gibi oynar, ayrıca boş ilan hakkı oldukça kârlı gördüğü malı alıp pazarda satar.
import * as k from "../src/engine";
import { CONFIG } from "../src/data/config";
import { TYPES } from "../src/data/shops";

export interface BotResult { lv: Record<number, number>; ev: string[]; dead: number | null; cash: number; debt: number; level: number; shops: string; flip: number }

export function runBot(seed: number, mode: "ucuz" | "olcu" | "kredi" | "stok" | "ilan", minutes: number): BotResult {
  k.setSeed(seed); k.newGame();
  const S = k.S, res: BotResult = { lv: {}, ev: [], dead: null, cash: 0, debt: 0, level: 1, shops: "", flip: 0 };
  k.setOnEv((e, d) => { if (e === "offerSale") res.flip += d.r; });
  const m = () => Math.round(S.t / 60);
  const best = (pid: string) => {
    let b = k.allListings(pid)[0], bv = -1;
    for (const l of k.allListings(pid)) { const v = (k.refPrice(pid) - k.net(l)) * k.qualMult(l.q); if (v > bv) { bv = v; b = l; } }
    return b;
  };
  let lv = 1;
  for (let i = 0; i < minutes * 60; i++) {
    k.step(1);
    if (S.dead) { res.dead = m(); break; }
    if (S.level > lv) { lv = S.level; res.lv[lv] = m(); }
    if (i % 5) continue;
    if (mode === "olcu" || mode === "kredi" || mode === "ilan") { const av = k.loanLimit() * (mode === "kredi" ? 1 : 0.5) - S.debt; if (av >= 500) k.borrow(Math.floor(av / 100) * 100); }
    for (const t of TYPES) if (!S.shops.some((s) => s.type === t.id) && S.level >= t.level && S.cash >= t.cost + 1500 && k.openShop(t.id)) res.ev.push(t.id + "@" + m());
    for (const sh of S.shops) { const c = k.upCost(sh); if (c != null && S.cash >= c + 1500 && sh.shelves.every((x) => x) && k.upgrade(sh)) res.ev.push(sh.type + "^" + sh.size + "@" + m()); }
    if (mode === "ilan" && i % 30 === 0) for (const sh of S.shops) {
      // Açık ilanları güncel piyasa değerine çek; zararına satma, bekle.
      for (const o of k.shopOffers(sh)) { const fair = k.offerFair(o.pid, o.q); if (Math.abs(o.price / fair - 1) > 0.03 && fair * (1 - CONFIG.offerFee) > o.cost) o.price = k.roundP(fair); }
      if (k.shopOffers(sh).length >= k.offerSlots(sh)) continue;
      // Komisyondan sonra en az %4 kâr bırakan en iyi ilanı bul, kasanın üçte biriyle al, piyasa değerinden sat.
      let bestL: k.Listing | null = null, bv = 0.04;
      for (const a of k.T[sh.type].products) { if (S.level < k.P[a[0]].lvl) continue; for (const l of k.allListings(a[0])) { if (l.sys) continue; const v = (k.offerFair(l.pid, l.q) * (1 - CONFIG.offerFee)) / k.net(l) - 1; if (v > bv) { bv = v; bestL = l; } } }
      if (bestL) { const had = sh.stock[bestL.pid].q, got = k.buy(bestL, Math.floor(S.cash / 3 / k.net(bestL))); if (got > 0) k.createOffer(sh, bestL.pid, got, k.offerFair(bestL.pid, sh.stock[bestL.pid].qual)) ; void had; }
    }
    for (const sh of S.shops) {
      const prods = k.T[sh.type].products.map((a) => a[0]).filter((p) => S.level >= k.P[p].lvl);
      const ranked = prods.map((pid) => ({ pid, v: (k.refPrice(pid) - k.net(best(pid))) * k.P[pid].rate })).sort((a, b) => b.v - a.v);
      const onShelf = sh.shelves.filter((x) => x).map((x) => x!.pid);
      const want = onShelf.concat(ranked.map((o) => o.pid).filter((p) => !onShelf.includes(p))).slice(0, sh.shelves.length);
      for (const pid of want) {
        if (sh.stock[pid].q < 30) { const l = best(pid); if (k.net(l) < k.refPrice(pid) * 0.97) {
          if (mode === "stok") { // depoyu doldur: kasa yetmiyorsa farkı bankadan çek
            const q = Math.min(l.qty, Math.floor((k.depotCap(sh) - k.depotUsed(sh)) / want.length)), need = q * k.net(l) - S.cash;
            if (need > 0) k.borrow(Math.ceil(need / 100) * 100);
            k.buy(l, q);
          } else k.buy(l, Math.min(Math.floor(S.cash / want.length / k.net(l)), mode === "ucuz" ? 400 : 1500));
        } }
        const sf = sh.shelves.find((s) => s && s.pid === pid);
        if (sf) sf.price = k.roundP(k.refPrice(pid));
      }
    }
  }
  k.setOnEv(() => {});
  res.flip = Math.round(res.flip);
  res.cash = Math.round(S.cash); res.debt = Math.round(S.debt); res.level = S.level;
  res.shops = S.shops.map((s) => s.type[0] + CONFIG.sizes[s.size].ad[0]).join(" ");
  return res;
}
