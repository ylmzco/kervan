export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
/** Türkçe sayı biçimi. d verilmezse 2 ondalık. */
export const tl = (x: number, d?: number) =>
  x.toLocaleString("tr-TR", { minimumFractionDigits: d ?? 2, maximumFractionDigits: d ?? 2 });
