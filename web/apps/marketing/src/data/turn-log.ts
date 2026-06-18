// THE ONLY FILE allowed to contain model-name literals (HARD INVARIANT).
// Everything else (acts, hero, i18n, pricing-core) stays provider-neutral and refers
// to providers only via pricing-core's opaque ProviderId / ModelKey.
//
// This is the display data for Act 6 (transparency): a per-turn routing log showing
// which model ran for each turn and why. Provider ids map 1:1 onto pricing-core.
import type { ModelKey, ProviderId, Tier } from "@tokenomics/pricing-core";

export interface TurnLogEntry {
  /** 1-based turn index in the session. */
  turn: number;
  /** Difficulty tier the router assigned. */
  tier: Tier;
  /** Provider the turn was routed to (null = kept on the user's default model). */
  routedTo: ProviderId | null;
  /** Human-facing reason the route was chosen (provider-neutral phrasing). */
  reason: string;
}

// Human-facing display names — the ONLY model-name strings in the app.
export const PROVIDER_LABELS: Record<ProviderId, string> = {
  free: "local / free",
  qwen_flash: "Qwen Flash",
  deepseek_v4_flash: "DeepSeek V4 Flash",
  deepseek_v4_pro: "DeepSeek V4 Pro",
  glm46: "GLM-4.6",
  glm45_air: "GLM-4.5 Air",
  gemini_flash_lite: "Gemini Flash Lite",
};

export const DEFAULT_MODEL_LABELS: Record<ModelKey, string> = {
  opus: "Opus",
  sonnet: "Sonnet",
  haiku: "Haiku",
};

/** Label for a route target, falling back to the default-model label when kept. */
export function routeLabel(routedTo: ProviderId | null, defaultModel: ModelKey): string {
  return routedTo === null ? DEFAULT_MODEL_LABELS[defaultModel] : PROVIDER_LABELS[routedTo];
}

/**
 * Verbatim example rows from the copy spec, kept as structured display data.
 * These are pre-rendered one-liners (model name + tier + delta) shown in the
 * transparency act's ticker. The model-name literals are allowed ONLY here.
 * `kept` === route stayed on the user's default model (no cheaper-sufficient option).
 */
export interface TurnLogExample {
  turn: number;
  /** Display model/route name (verbatim). */
  model: string;
  /** Display tier/category (verbatim). */
  category: string;
  /** Verbatim outcome chip, e.g. "−79%" or "kept(needed)". */
  outcome: string;
  /** True when the turn was kept on the default model. */
  kept: boolean;
}

export const TURN_LOG_EXAMPLES: TurnLogExample[] = [
  { turn: 241, model: "deepseek-v4-flash", category: "routine", outcome: "−79%", kept: false },
  { turn: 242, model: "free tier", category: "trivial", outcome: "−100%", kept: false },
  { turn: 243, model: "glm-4.6", category: "medium", outcome: "−38%", kept: false },
  { turn: 244, model: "sonnet-4.6", category: "reasoning", outcome: "kept(needed)", kept: true },
  { turn: 245, model: "opus-4.8", category: "architecture", outcome: "kept(!keep)", kept: true },
];

// Illustrative session log for the transparency act.
export const TURN_LOG: TurnLogEntry[] = [
  { turn: 1, tier: "trivial", routedTo: "qwen_flash", reason: "short edit, no tools" },
  { turn: 2, tier: "routine", routedTo: "glm45_air", reason: "single-file change" },
  { turn: 3, tier: "trivial", routedTo: "gemini_flash_lite", reason: "rename + format" },
  { turn: 4, tier: "medium", routedTo: "deepseek_v4_flash", reason: "multi-step refactor" },
  { turn: 5, tier: "routine", routedTo: "glm46", reason: "test scaffolding" },
  { turn: 6, tier: "hard", routedTo: null, reason: "cross-module reasoning kept on default" },
  { turn: 7, tier: "medium", routedTo: "deepseek_v4_pro", reason: "long-context diff review" },
  { turn: 8, tier: "trivial", routedTo: "free", reason: "lint fix, local model" },
];
