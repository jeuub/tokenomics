// Presentation-only Intl formatters. NO pricing logic — that lives in @tokenomics/pricing-core.

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const tokensFmt = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const format = {
  /** Whole dollars when |n| >= 100, else two decimals. */
  usd(n: number): string {
    return Math.abs(n) >= 100 ? usdWhole.format(n) : usd2.format(n);
  },
  /** Accepts a 0..1 ratio OR an already-scaled percent (>1). */
  pct(n: number): string {
    const ratio = n > 1 ? n / 100 : n;
    return `${Math.round(ratio * 100)}%`;
  },
  /** Compact token counts (e.g. 20k, 1.2M). */
  tokens(n: number): string {
    return tokensFmt.format(n);
  },
} as const;

export type FormatHelpers = typeof format;
