import { describe, expect, it } from "vitest";
import { ANTHROPIC_PRICES, type EstimateInput, estimate, MIX, PROVIDER_PRICES } from "./index.ts";

const base: EstimateInput = {
  turnsPerMonth: 1000,
  avgContextTokens: 20_000,
  defaultModel: "opus",
};

describe("pricing-core constants", () => {
  it("MIX shares sum to 1", () => {
    const sum = MIX.reduce((a, m) => a + m.share, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("exposes verbatim anchor prices", () => {
    expect(ANTHROPIC_PRICES.opus.outputPerM).toBe(25);
    expect(PROVIDER_PRICES.free).toEqual({ inputPerM: 0, outputPerM: 0 });
    expect(PROVIDER_PRICES.deepseek_v4_flash.inputPerM).toBe(0.14);
  });
});

describe("estimate()", () => {
  it("never routes more expensive than the default (per-tier clamp)", () => {
    const r = estimate(base);
    for (const t of r.perTier) {
      expect(t.routedUsd).toBeLessThanOrEqual(t.baselineUsd + 1e-9);
    }
    expect(r.routedUsd).toBeLessThanOrEqual(r.baselineUsd + 1e-9);
    expect(r.savedUsd).toBeGreaterThanOrEqual(0);
    expect(r.savedPct).toBeGreaterThanOrEqual(0);
    expect(r.savedPct).toBeLessThanOrEqual(1);
  });

  it("kept tier (hard) routes to exactly its baseline", () => {
    const r = estimate(base);
    const hard = r.perTier.find((t) => t.tier === "hard");
    expect(hard).toBeDefined();
    expect(hard?.routedUsd).toBeCloseTo(hard?.baselineUsd ?? -1, 10);
  });

  it("baseline scales monotonically with turns", () => {
    const lo = estimate({ ...base, turnsPerMonth: 500 });
    const hi = estimate({ ...base, turnsPerMonth: 2000 });
    expect(hi.baselineUsd).toBeGreaterThan(lo.baselineUsd);
    expect(hi.savedUsd).toBeGreaterThan(lo.savedUsd);
  });

  it("baseline scales monotonically with context size", () => {
    const lo = estimate({ ...base, avgContextTokens: 10_000 });
    const hi = estimate({ ...base, avgContextTokens: 80_000 });
    expect(hi.baselineUsd).toBeGreaterThan(lo.baselineUsd);
  });

  it("a pricier default model never reduces baseline cost", () => {
    const opus = estimate({ ...base, defaultModel: "opus" });
    const haiku = estimate({ ...base, defaultModel: "haiku" });
    expect(opus.baselineUsd).toBeGreaterThanOrEqual(haiku.baselineUsd);
  });

  it("zero turns => zero everything, no NaN", () => {
    const r = estimate({ ...base, turnsPerMonth: 0 });
    expect(r.baselineUsd).toBe(0);
    expect(r.routedUsd).toBe(0);
    expect(r.savedUsd).toBe(0);
    expect(r.savedPct).toBe(0);
  });
});
