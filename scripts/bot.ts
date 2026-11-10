// Denge için basit bir oyuncu. "ucuz": krediye dokunmaz. "olcu": limitinin yarısına kadar borçlanır. "kredi": limitini hep sonuna kadar kullanır.
import * as k from "../src/engine";
import { CONFIG } from "../src/data/config";
import { TYPES } from "../src/data/shops";

export interface BotResult { lv: Record<number, number>; ev: string[]; dead: number | null; cash: number; debt: number; level: number; shops: string }

export function runBot(seed: number, mode: "ucuz" | "olcu" | "kredi", minutes: number): BotResult {
  k.setSeed(seed); k.newGame();
  const S = k.S, res: BotResult = { lv: {}, ev: [], dead: null, cash: 0, debt: 0, level: 1, shops: "" };
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
    if (mode !== "ucuz") { const av = k.loanLimit() * (mode === "olcu" ? 0.5 : 1) - S.debt; if (av >= 500) k.borrow(Math.floor(av / 100) * 100); }
    for (const t of TYPES) if (!S.shops.some((s) => s.type === t.id) && S.level >= t.level && S.cash >= t.cost + 1500 && k.openShop(t.id)) res.ev.push(t.id + "@" + m());
    for (const sh of S.shops) { const c = k.upCost(sh); if (c != null && S.cash >= c + 1500 && sh.shelves.every((x) => x) && k.upgrade(sh)) res.ev.push(sh.type + "^" + sh.size + "@" + m()); }
    for (const sh of S.shops) {
      const prods = k.T[sh.type].products.map((a) => a[0]).filter((p) => S.level >= k.P[p].lvl);
      const ranked = prods.map((pid) => ({ pid, v: (k.refPrice(pid) - k.net(best(pid))) * k.P[pid].rate })).sort((a, b) => b.v - a.v);
      const onShelf = sh.shelves.filter((x) => x).map((x) => x!.pid);
      const want = onShelf.concat(ranked.map((o) => o.pid).filter((p) => !onShelf.includes(p))).slice(0, sh.shelves.length);
      for (const pid of want) {
        if (sh.stock[pid].q < 30) { const l = best(pid); if (k.net(l) < k.refPrice(pid) * 0.97) k.buy(l, Math.min(Math.floor(S.cash / want.length / k.net(l)), mode === "ucuz" ? 400 : 1500)); }
        const sf = sh.shelves.find((s) => s && s.pid === pid);
        if (sf) sf.price = k.roundP(k.refPrice(pid));
      }
    }
  }
  res.cash = Math.round(S.cash); res.debt = Math.round(S.debt); res.level = S.level;
  res.shops = S.shops.map((s) => s.type[0] + CONFIG.sizes[s.size].ad[0]).join(" ");
  return res;
}
