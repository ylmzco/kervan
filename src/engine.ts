// Oyun motoru. DOM bilmez; Node'da da çalışır (testler ve simülasyon bunu kullanır).
import { CONFIG, MarketState } from "./data/config";
import { TYPES, ShopType } from "./data/shops";
import { CITIES, SELLERS } from "./data/world";
import { clamp } from "./format";

export interface Product { id: string; ad: string; sys: number; type: string; rate: number; markup: number; lvl: number }
export interface Stock { q: number; qual: number; cost: number }
export interface Shelf { pid: string; price: number }
export interface Shop { type: string; val: number; size: number; shelves: (Shelf | null)[]; stock: Record<string, Stock>; acc: Record<string, number> }
export interface Listing { id: number; pid: string; seller: string; city: string; km: number; q: number; qty: number; price: number; kelepir?: boolean; sys?: boolean }
export interface FeedItem { t: string; v: number; si: number; nw?: number }
export interface State {
  cash: number; debt: number; t: number; day: number; xp: number; level: number;
  shops: Shop[]; cur: number; sel: Record<string, string>; feed: FeedItem[];
  listings: Record<string, Listing[]>;
  market: { state: MarketState; nextAt: number; mult: Record<string, number>; hist: Record<string, number[]> };
  churnAt: number; d: { rev: number; buy: number; sold: number; cogs: number };
  dead: boolean; speed: number; tab: "home" | "shop" | "market"; first: boolean;
}
export type Ev = "sale" | "market" | "listings" | "empty" | "level" | "day" | "dead";

export const P: Record<string, Product> = {};
export const T: Record<string, ShopType> = {};
export const PIDS: string[] = [];
TYPES.forEach((t) => {
  T[t.id] = t;
  t.products.forEach((a, ix) => {
    // Hız ve kâr payı fiyattan türetilir: ucuz mal hızlı döner ve yüzdesi yüksektir.
    P[a[0]] = { id: a[0], ad: a[1], sys: a[2], type: t.id, lvl: t.level + Math.max(0, ix - 2), rate: +(45 / Math.sqrt(a[2])).toFixed(1), markup: clamp(0.5 - 0.06 * Math.log(a[2]), 0.18, 0.42) };
    PIDS.push(a[0]);
  });
});

let seed = Date.now() % 2147483647;
export function setSeed(v: number) { seed = v; }
function rnd() { seed = (seed * 48271) % 2147483647; return seed / 2147483647; }
const rr = (a: number, b: number) => a + rnd() * (b - a);
const ri = (a: number, b: number) => Math.floor(rr(a, b + 1));
const pick = <X,>(a: X[]): X => a[Math.floor(rnd() * a.length)];

export let S: State = null as unknown as State;
let lid = 1;
export const snapshot = () => ({ S, lid });
export function restore(j: { S: State; lid: number }) { S = j.S; lid = j.lid; }

let onEv: (k: Ev, d?: any) => void = () => {};
export function setOnEv(f: (k: Ev, d?: any) => void) { onEv = f; }
const ev = (k: Ev, d?: any) => onEv(k, d);

function fitShelves(sh: Shop) { while (sh.shelves.length < CONFIG.sizes[sh.size].shelves) sh.shelves.push(null); }
function mkShop(type: string): Shop {
  const sh: Shop = { type, val: T[type].cost, size: 0, shelves: [], stock: {}, acc: {} };
  T[type].products.forEach((a) => { sh.stock[a[0]] = { q: 0, qual: 0, cost: 0 }; sh.acc[a[0]] = 0; });
  fitShelves(sh);
  return sh;
}
export function newGame() {
  S = { cash: CONFIG.startCash, debt: 0, t: 0, day: 1, xp: 0, level: 1, shops: [mkShop("bakkal")], cur: 0, sel: {}, feed: [], listings: {},
    market: { state: "sakin", nextAt: CONFIG.marketSec, mult: {}, hist: {} }, churnAt: CONFIG.churnSec, d: { rev: 0, buy: 0, sold: 0, cogs: 0 }, dead: false, speed: 1, tab: "home", first: true };
  TYPES.forEach((t) => (S.sel[t.id] = t.products[0][0]));
  PIDS.forEach((id) => {
    S.market.mult[id] = 1; S.market.hist[id] = [P[id].sys]; S.listings[id] = [];
    const n = ri(5, 6);
    for (let i = 0; i < n; i++) S.listings[id].push(genListing(id));
  });
}

// ---- Fiyatlar ve ilanlar ----
export const sysPrice = (id: string) => P[id].sys * S.market.mult[id];
export const refPrice = (id: string) => sysPrice(id) * (1 + P[id].markup);
function genListing(id: string): Listing {
  const q = ri(20, 85), c = pick(CITIES);
  // Kalite düştükçe indirim büyür: %20 kalite ≈ %34, %85 kalite ≈ %8 indirim.
  let d = 0.34 - ((q - 20) / 65) * 0.26 + rr(-0.04, 0.04);
  const kelepir = rnd() < 0.1;
  if (kelepir) d += rr(0.08, 0.14);
  return { id: lid++, pid: id, seller: pick(SELLERS), city: c[0], km: c[1], q, qty: ri(10, 80) * 10, price: +(sysPrice(id) * (1 - d)).toFixed(2), kelepir };
}
export const ship = (l: Listing) => +(l.km * CONFIG.shipPerKm).toFixed(2);
export const net = (l: Listing) => +(l.price + ship(l)).toFixed(2);
export const sysListing = (id: string): Listing => ({ id: 0, pid: id, seller: "Sistem Toptancısı", city: "İstanbul", km: 20, q: 50, qty: Infinity, price: +sysPrice(id).toFixed(2), sys: true });
export function allListings(id: string): Listing[] { return S.listings[id].slice().sort((a, b) => net(a) - net(b)).concat([sysListing(id)]); }

// ---- Dükkân ----
export const shopOf = (pid: string) => S.shops.find((s) => s.type === P[pid].type);
export const depotUsed = (sh: Shop) => Object.values(sh.stock).reduce((s, x) => s + x.q, 0);
export const depotCap = (sh: Shop) => CONFIG.sizes[sh.size].depot;
export const priceMult = (r: number) => clamp(1 + (1 - r) * 3, 0.6, 1.6);
export const qualMult = (q: number) => (q >= 70 ? 1.4 : q >= 40 ? 0.9 + ((q - 40) / 30) * 0.2 : 0.8);
/** Rafın dakikalık satış hızı: garantili taban hız x fiyat çarpanı x kalite çarpanı. */
export function shelfRate(sh: Shop, sf: Shelf | null) { if (!sf) return 0; return P[sf.pid].rate * CONFIG.rateScale * priceMult(sf.price / refPrice(sf.pid)) * qualMult(sh.stock[sf.pid].qual); }
export const shopProfit = (sh: Shop) => sh.shelves.reduce((s, sf) => s + (sf && sh.stock[sf.pid].q > 0 ? shelfRate(sh, sf) * (sf.price - sh.stock[sf.pid].cost) : 0), 0);
export const profitPerMin = () => S.shops.reduce((s, sh) => s + shopProfit(sh), 0);
export const shopRent = (sh: Shop) => Math.round(CONFIG.sizes[sh.size].rent * T[sh.type].tier * CONFIG.rentScale);
export const upCost = (sh: Shop) => (sh.size < 2 ? Math.round(T[sh.type].cost * CONFIG.sizes[sh.size + 1].costK) : null);
export const xpNeed = (n: number) => CONFIG.xpBase * Math.pow(n - 1, CONFIG.xpPow);
export const roundP = (x: number) => Math.round(x * 20) / 20;

export function maxBuy(l: Listing) {
  const sh = shopOf(l.pid);
  if (!sh || S.level < P[l.pid].lvl) return 0;
  return Math.max(0, Math.min(l.qty, Math.floor(S.cash / net(l)), depotCap(sh) - depotUsed(sh)));
}
/** Malı alır: anında depoya girer, kalite ve maliyet ağırlıklı ortalamayla (paçal) birleşir. */
export function buy(l: Listing, qty: number) {
  const sh = shopOf(l.pid);
  qty = Math.min(qty, maxBuy(l));
  if (!sh || qty <= 0) return 0;
  const st = sh.stock[l.pid], cost = qty * net(l);
  st.qual = (st.qual * st.q + l.q * qty) / (st.q + qty);
  st.cost = (st.cost * st.q + cost) / (st.q + qty);
  st.q += qty; S.cash -= cost; S.d.buy += cost;
  if (!l.sys) { l.qty -= qty; if (l.qty <= 0) S.listings[l.pid] = S.listings[l.pid].filter((x) => x !== l); }
  if (!sh.shelves.some((s) => s && s.pid === l.pid)) {
    let i = sh.shelves.findIndex((s) => !s);
    if (i < 0) i = sh.shelves.findIndex((s) => sh.stock[s!.pid].q <= 0);
    if (i >= 0) sh.shelves[i] = { pid: l.pid, price: roundP(refPrice(l.pid)) };
  }
  S.first = false;
  return qty;
}
export function upgrade(sh: Shop) { const c = upCost(sh); if (c == null || S.cash < c) return false; S.cash -= c; sh.val += c; sh.size++; fitShelves(sh); return true; }
export function openShop(type: string) { const t = T[type]; if (S.level < t.level || S.cash < t.cost || S.shops.some((s) => s.type === type)) return false; S.cash -= t.cost; S.shops.push(mkShop(type)); return true; }

/** Sistem toptancısının geri alım fiyatı. Her zaman maliyetin altındadır. */
export function sellBackPrice(sh: Shop, pid: string) {
  const st = sh.stock[pid];
  return +Math.min(sysPrice(pid) * (CONFIG.sellBackBase + (CONFIG.sellBackQual * st.qual) / 100), st.cost * CONFIG.sellBackMaxCost).toFixed(2);
}
/** Depodaki malı zararına nakde çevirir. Seviye puanı kazandırmaz. */
export function sellBack(sh: Shop, pid: string, qty: number) {
  const st = sh.stock[pid];
  qty = Math.min(qty, st.q);
  if (qty <= 0) return 0;
  const r = qty * sellBackPrice(sh, pid);
  S.d.cogs = (S.d.cogs || 0) + qty * st.cost;
  st.q -= qty; S.cash += r; S.d.rev += r;
  if (st.q === 0) sh.acc[pid] = 0;
  return r;
}

// ---- Banka ----
export const assets = () => S.shops.reduce((s, sh) => s + sh.val + Object.values(sh.stock).reduce((a, x) => a + x.q * x.cost, 0), 0);
export const loanLimit = () => Math.floor((assets() * CONFIG.loanRatio) / 100) * 100;
export function borrow(x: number) { x = Math.min(x, loanLimit() - S.debt); if (x <= 0) return 0; S.debt += x; S.cash += x; return x; }
export function repay(x: number) { x = Math.min(x, S.debt, Math.max(0, S.cash)); if (x <= 0) return 0; S.debt -= x; S.cash -= x; return x; }

/** Günlük faiz oranı: borcun limite oranı arttıkça kademeli yükselir. */
export function interestRate(debt: number = S.debt) {
  const lim = loanLimit(), u = lim > 0 ? debt / lim : debt > 0 ? 9 : 0;
  let k = 1;
  for (const s of CONFIG.interestSteps) if (u >= s.from) k = s.k;
  return CONFIG.interestDay * k;
}

/** Mevcut raflarla bir günde beklenen kâr (faiz hariç). Kredi kararında karşılaştırma için. */
export const dayProfitEstimate = () => (profitPerMin() * CONFIG.daySec) / 60 - rentTotal();

// ---- Devlet ----
/** Dilimli vergi: her dilim yalnızca kendi aralığındaki kâra uygulanır. */
export function taxFor(profit: number) {
  let tax = 0, lo = 0;
  for (const b of CONFIG.taxBrackets) { if (profit > lo) tax += (Math.min(profit, b.upTo) - lo) * b.rate; lo = b.upTo; }
  return tax;
}
export const rentTotal = () => S.shops.reduce((s, sh) => s + shopRent(sh), 0);
/** Günün şu ana kadarki kârı: ciro - satılan malın maliyeti - kira - faiz. */
export const dayProfit = () => S.d.rev - (S.d.cogs || 0) - rentTotal() - S.debt * interestRate();

// ---- Zaman ----
function marketUpdate() {
  const keys = (Object.keys(CONFIG.states) as MarketState[]).filter((k) => k !== S.market.state || rnd() < 0.25);
  S.market.state = pick(keys);
  const m = CONFIG.states[S.market.state].m;
  PIDS.forEach((id) => {
    S.market.mult[id] = m * (1 + rr(-0.04, 0.04));
    const h = S.market.hist[id]; h.push(+sysPrice(id).toFixed(2)); if (h.length > 10) h.shift();
    S.listings[id] = S.listings[id].filter(() => rnd() < 0.5);
    while (S.listings[id].length < 4) S.listings[id].push(genListing(id));
  });
  S.market.nextAt = S.t + CONFIG.marketSec;
  ev("market");
}
function churn() {
  PIDS.forEach((id) => {
    const L = S.listings[id];
    if (L.length && rnd() < 0.5) { const l = L.slice().sort((a, b) => net(a) - net(b))[0]; l.qty -= ri(4, 24) * 10; if (l.qty <= 0) S.listings[id] = L.filter((x) => x !== l); }
    if (S.listings[id].length < 7 && rnd() < 0.45) S.listings[id].push(genListing(id));
  });
  ev("listings");
}
function endDay() {
  const rent = rentTotal(), interest = S.debt * interestRate(), tax = taxFor(Math.max(0, dayProfit()));
  const total = rent + interest + tax;
  S.cash -= total;
  ev("day", { day: S.day, sold: S.d.sold, rent, interest, tax, total });
  S.day++; S.d = { rev: 0, buy: 0, sold: 0, cogs: 0 };
  if (S.cash < 0 && S.shops.every((sh) => depotUsed(sh) === 0)) { S.dead = true; ev("dead"); }
}
/** Oyunu dt saniye ilerletir. */
export function step(dt: number) {
  if (S.dead) return;
  S.t += dt;
  S.shops.forEach((sh, si) => sh.shelves.forEach((sf) => {
    if (!sf) return;
    const st = sh.stock[sf.pid];
    if (st.q <= 0) return;
    sh.acc[sf.pid] += (shelfRate(sh, sf) * dt) / 60;
    const n = Math.min(st.q, Math.floor(sh.acc[sf.pid]));
    if (n > 0) {
      sh.acc[sf.pid] -= n; st.q -= n;
      const r = n * sf.price;
      S.cash += r; S.xp += r; S.d.rev += r; S.d.sold += n; S.d.cogs = (S.d.cogs || 0) + n * st.cost;
      ev("sale", { pid: sf.pid, n, r, si });
      if (st.q === 0) { sh.acc[sf.pid] = 0; ev("empty", { pid: sf.pid }); }
    }
  }));
  while (S.xp >= xpNeed(S.level + 1)) { S.level++; ev("level"); }
  while (S.t >= S.churnAt) { S.churnAt += CONFIG.churnSec; churn(); }
  while (S.t >= S.market.nextAt) marketUpdate();
  while (S.t >= S.day * CONFIG.daySec && !S.dead) endDay();
}
