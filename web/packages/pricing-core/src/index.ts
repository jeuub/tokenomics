// @tokenomics/pricing-core — the SINGLE numeric source of truth.
// Zero runtime deps. ALL model pricing + the routing-savings estimate live here;
// the marketing app only ever FORMATS what this module returns. No %/$ is hardcoded
// anywhere else in the landing.
//
// Numbers are verbatim from the agreed NUMBERS block ($ per 1,000,000 tokens).
// estimate() is a direct port of scan/tokenomics-scan.mjs `estimate()`.

export type ModelKey = "opus" | "sonnet" | "haiku";

export type ProviderId =
  | "free"
  | "qwen_flash"
  | "deepseek_v4_flash"
  | "deepseek_v4_pro"
  | "glm46"
  | "glm45_air"
  | "gemini_flash_lite";

export interface Price {
  inputPerM: number;
  outputPerM: number;
  cacheReadPerM?: number;
  cacheWritePerM?: number;
}

// Anthropic-tier prices ($/1M). cacheRead is the warm-cache input rate used as the
// baseline context cost (a turn re-reads its context from cache each time).
export const ANTHROPIC_PRICES: Record<ModelKey, Price> = {
  opus: { inputPerM: 5, outputPerM: 25, cacheReadPerM: 0.5, cacheWritePerM: 6.25 },
  sonnet: { inputPerM: 3, outputPerM: 15, cacheReadPerM: 0.3, cacheWritePerM: 3.75 },
  haiku: { inputPerM: 1, outputPerM: 5, cacheReadPerM: 0.1, cacheWritePerM: 1.25 },
};

// Routing targets ($/1M). These are charged at their plain input/output rates.
export const PROVIDER_PRICES: Record<ProviderId, Price> = {
  free: { inputPerM: 0, outputPerM: 0 },
  qwen_flash: { inputPerM: 0.05, outputPerM: 0.4 },
  deepseek_v4_flash: { inputPerM: 0.14, outputPerM: 0.28 },
  deepseek_v4_pro: { inputPerM: 0.435, outputPerM: 0.87 },
  glm46: { inputPerM: 0.6, outputPerM: 2.2 },
  glm45_air: { inputPerM: 0.2, outputPerM: 1.1 },
  gemini_flash_lite: { inputPerM: 0.1, outputPerM: 0.4 },
};

export type Tier = "trivial" | "routine" | "medium" | "hard";

export interface MixTier {
  tier: Tier;
  share: number;
  /** null = the turn is kept on your default model (no cheaper-and-sufficient route). */
  routed: ProviderId | null;
  avgOutputTokens: number;
}

// Illustrative task distribution (shares sum to 1.0). Verbatim from NUMBERS block.
export const MIX: MixTier[] = [
  { tier: "trivial", share: 0.25, routed: "free", avgOutputTokens: 150 },
  { tier: "routine", share: 0.35, routed: "deepseek_v4_flash", avgOutputTokens: 350 },
  { tier: "medium", share: 0.25, routed: "glm46", avgOutputTokens: 600 },
  { tier: "hard", share: 0.15, routed: null, avgOutputTokens: 900 },
];

export interface EstimateInput {
  turnsPerMonth: number;
  avgContextTokens: number;
  defaultModel: ModelKey;
}

export interface EstimateTierResult {
  tier: Tier;
  baselineUsd: number;
  routedUsd: number;
}

export interface EstimateResult {
  baselineUsd: number;
  routedUsd: number;
  savedUsd: number;
  savedPct: number;
  perTier: EstimateTierResult[];
}

/**
 * Per-tier monthly cost on the user's default model (baseline) vs the routed plan.
 *
 * baseline(tier) = turns * share * (avgContext * dCacheRead/1e6 + avgOutput * dOutput/1e6)
 *   where dCacheRead/dOutput are the DEFAULT model's cacheReadPerM/outputPerM.
 * routed(tier)   = if routed === null -> baseline
 *                  else turns * share * (avgContext * p.inputPerM/1e6 + avgOutput * p.outputPerM/1e6)
 * routedUsd      = min(routed, baseline)  // a route is NEVER more expensive than the default.
 */
export function estimate(input: EstimateInput): EstimateResult {
  const { turnsPerMonth, avgContextTokens, defaultModel } = input;
  const def = ANTHROPIC_PRICES[defaultModel];
  const dCacheRead = def.cacheReadPerM ?? def.inputPerM;
  const dOutput = def.outputPerM;

  const perTier: EstimateTierResult[] = [];
  let baselineUsd = 0;
  let routedUsd = 0;

  for (const m of MIX) {
    const turns = turnsPerMonth * m.share;
    const baseline =
      (turns * (avgContextTokens * dCacheRead)) / 1e6 +
      (turns * (m.avgOutputTokens * dOutput)) / 1e6;

    let routed: number;
    if (m.routed === null) {
      routed = baseline;
    } else {
      const p = PROVIDER_PRICES[m.routed];
      routed =
        (turns * (avgContextTokens * p.inputPerM)) / 1e6 +
        (turns * (m.avgOutputTokens * p.outputPerM)) / 1e6;
    }
    // Never route to something more expensive than just keeping the default.
    routed = Math.min(routed, baseline);

    perTier.push({ tier: m.tier, baselineUsd: baseline, routedUsd: routed });
    baselineUsd += baseline;
    routedUsd += routed;
  }

  const savedUsd = baselineUsd - routedUsd;
  const savedPct = baselineUsd > 0 ? savedUsd / baselineUsd : 0;

  return { baselineUsd, routedUsd, savedUsd, savedPct, perTier };
}
