// @tokenomics/pricing-core — the SINGLE source of the landing estimator's math.
// Zero deps. Ported verbatim from the approved design's computeEstimate().
// Illustrative blended list prices ($ / Mtok); the real number is measured on
// the user's own traffic. Keep these in one place so the site, scan and the
// dashboard never disagree.

export type DefaultModel = "opus" | "sonnet";

export const LANDING_PRICES = {
  opus: 15,
  sonnet: 3,
  haiku: 0.8,
  glm: 0.6,
  deepseek: 0.3,
  qwen: 0.2,
  gemini: 0.15,
  free: 0,
} as const;

export interface EstimateInput {
  /** turns per month */
  turns: number;
  /** average context per turn, in thousands of tokens */
  ctxK: number;
  /** quality headroom 0..10 — higher keeps more turns on your model */
  effort: number;
  /** the baseline model the agent would use without us */
  def: DefaultModel;
  /** allow third-party + free tiers in the routing pool */
  third: boolean;
}

export interface EstimateResult {
  turns: number;
  ctxK: number;
  effort: number;
  def: DefaultModel;
  third: boolean;
  /** monthly $ on the default model */
  base: number;
  /** monthly $ with routing */
  routed: number;
  /** monthly $ saved */
  monthly: number;
  /** fraction saved 0..1 */
  pct: number;
  trivial: number;
  routine: number;
  medium: number;
  kept: number;
}

export function estimateLanding(input: EstimateInput): EstimateResult {
  const { turns, ctxK, effort, def, third } = input;
  const P = LANDING_PRICES;
  const mtok = (ctxK + 1) / 1000; // ~1k output added
  const base = P[def] * mtok; // $/turn on the default

  // task distribution; effort shifts share toward "kept on your model"
  let trivial = 0.16;
  let routine = 0.44;
  let medium = 0.2;
  const kept = 0.2 + (effort / 10) * 0.3;
  const movable = trivial + routine + medium;
  const scale = (1 - kept) / movable;
  trivial *= scale;
  routine *= scale;
  medium *= scale;

  const mTrivial = third ? P.free : P.haiku;
  const mRoutine = third ? P.deepseek : P.haiku;
  const mMedium = third ? P.glm : P.sonnet;
  const routed =
    (trivial * mTrivial + routine * mRoutine + medium * mMedium + kept * P[def]) * mtok;

  const savePerTurn = Math.max(0, base - routed);
  const monthly = savePerTurn * turns;
  const pct = base > 0 ? savePerTurn / base : 0;
  return {
    turns,
    ctxK,
    effort,
    def,
    third,
    base: base * turns,
    routed: routed * turns,
    monthly,
    pct,
    trivial,
    routine,
    medium,
    kept,
  };
}

/** Compact $ formatter used by the estimate readouts ("$7.6k", "$420"). */
export function compactUsd(n: number): string {
  n = Math.max(0, Math.round(n));
  if (n >= 1000) {
    const k = n / 1000;
    return `$${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `$${n.toLocaleString("en-US")}`;
}
