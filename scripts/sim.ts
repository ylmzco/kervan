// npm run sim — beş bot tipini üç dünyada 5 oyun saati oynatır, kilometre taşlarını oyun dakikası olarak basar.
import { runBot } from "./bot";
const at = (r: ReturnType<typeof runBot>, key: string) => { const e = r.ev.find((x) => x.startsWith(key)); return e ? e.split("@")[1].padStart(4) : "   -"; };
console.log("bot    dünya | 2.sv 3.sv 6.sv 9.sv | bakkal↑ manav kuruy. tekel | son: seviye  kasa     borç    iflas  ilan cirosu");
for (const mode of ["ucuz", "olcu", "kredi", "stok", "ilan"] as const)
  for (const seed of [11, 222, 3333]) {
    const r = runBot(seed, mode, 300), lv = (n: number) => String(r.lv[n] ?? "-").padStart(4);
    console.log(`${mode.padEnd(6)} ${String(seed).padStart(5)} | ${lv(2)} ${lv(3)} ${lv(6)} ${lv(9)} | ${at(r, "bakkal^1")}    ${at(r, "manav@")}  ${at(r, "kuruyemis@")}   ${at(r, "tekel@")} | ${String(r.level).padStart(10)} ${String(r.cash).padStart(7)} ${String(r.debt).padStart(8)}  ${String(r.dead ?? "yok").padEnd(5)} ${r.flip || ""}`);
  }
