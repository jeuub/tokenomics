import { describe, expect, it } from "vitest";
import { compactUsd, type EstimateInput, estimateLanding, LANDING_PRICES } from "./index.ts";

const base: EstimateInput = { turns: 40000, ctxK: 18, effort: 4, def: "opus", third: true };

describe("pricing-core", () => {
  it("exposes the verbatim landing prices", () => {
    expect(LANDING_PRICES.opus).toBe(15);
    expect(LANDING_PRICES.free).toBe(0);
    expect(LANDING_PRICES.deepseek).toBe(0.3);
  });

  it("routed is never more expensive than the default baseline", () => {
    const e = estimateLanding(base);
    expect(e.routed).toBeLessThanOrEqual(e.base + 1e-9);
    expect(e.monthly).toBeGreaterThanOrEqual(0);
    expect(e.pct).toBeGreaterThanOrEqual(0);
    expect(e.pct).toBeLessThanOrEqual(1);
  });

  it("higher effort keeps more turns and shrinks savings", () => {
    const lo = estimateLanding({ ...base, effort: 0 });
    const hi = estimateLanding({ ...base, effort: 10 });
    expect(hi.kept).toBeGreaterThan(lo.kept);
    expect(hi.monthly).toBeLessThan(lo.monthly);
  });

  it("Anthropic-only pool (third=false) saves less than the open pool", () => {
    const open = estimateLanding({ ...base, third: true });
    const anthro = estimateLanding({ ...base, third: false });
    expect(anthro.monthly).toBeLessThan(open.monthly);
  });

  it("shares (movable + kept) sum to 1", () => {
    const e = estimateLanding(base);
    expect(e.trivial + e.routine + e.medium + e.kept).toBeCloseTo(1, 10);
  });

  it("compactUsd formats k-values", () => {
    expect(compactUsd(7600)).toBe("$7.6k");
    expect(compactUsd(420)).toBe("$420");
  });
});
