import { type EstimateInput, type EstimateResult, estimate } from "@tokenomics/pricing-core";
import { AsciiSlider, AsciiToggle, DecodeNumber, format } from "@tokenomics/ui";
import { useMemo, useState } from "react";

export interface ProofIslandProps {
  /** Localized labels (provider-neutral, numbers-free) injected from the SSR section. */
  labels: {
    baseline: string;
    routed: string;
    saved: string;
    proofLine: string;
    turnsLabel: string;
    contextLabel: string;
    modelLabel: string;
    modelLow: string;
    modelHigh: string;
  };
}

// Default-model toggle maps to pricing-core ModelKey WITHOUT printing model names.
// The two positions are abstract ("lighter default" vs "heavier default").
const LIGHT = "haiku" as const;
const HEAVY = "opus" as const;

/**
 * Act 5 interactive proof: sliders feed pricing-core.estimate(); bars + DecodeNumber
 * render the REAL computed result. ALL numeric logic lives in pricing-core; this island
 * only formats. reduced-motion is handled inside DecodeNumber (shows the value).
 */
export default function Proof({ labels }: ProofIslandProps) {
  const [turns, setTurns] = useState(2000);
  const [context, setContext] = useState(12000);
  const [heavy, setHeavy] = useState(true);

  const input: EstimateInput = useMemo(
    () => ({
      turnsPerMonth: turns,
      avgContextTokens: context,
      defaultModel: heavy ? HEAVY : LIGHT,
    }),
    [turns, context, heavy],
  );

  const result: EstimateResult = useMemo(() => estimate(input), [input]);

  // Bar widths are derived purely from the computed numbers (baseline = 100%).
  const routedPct = result.baselineUsd > 0 ? (result.routedUsd / result.baselineUsd) * 100 : 0;

  return (
    <div className="flex flex-col gap-ch4 font-mono text-fg">
      <div className="flex flex-col gap-ch2">
        <AsciiSlider
          value={turns}
          min={200}
          max={20000}
          onChange={setTurns}
          renderLabel={(v) => `${labels.turnsLabel} ${format.tokens(v)}`}
        />
        <AsciiSlider
          value={context}
          min={2000}
          max={64000}
          onChange={setContext}
          renderLabel={(v) => `${labels.contextLabel} ${format.tokens(v)}`}
        />
        <AsciiToggle
          checked={heavy}
          onChange={setHeavy}
          labels={[labels.modelLow, labels.modelHigh]}
        />
      </div>

      <dl className="flex flex-col gap-ch1" aria-live="polite">
        <Bar label={labels.baseline} pct={100} value={format.usd(result.baselineUsd)} />
        <Bar label={labels.routed} pct={routedPct} value={format.usd(result.routedUsd)} />
        <div className="flex items-baseline justify-between border-t border-border pt-ch1">
          <dt className="text-fg-muted">{labels.saved}</dt>
          <dd className="text-accent">
            <DecodeNumber value={result.savedUsd} format={(n) => format.usd(n)} />{" "}
            <span className="text-fg-muted">(</span>
            <DecodeNumber value={result.savedPct} format={(n) => format.pct(n)} />
            <span className="text-fg-muted">)</span>
          </dd>
        </div>
      </dl>

      <p className="text-fg-muted text-sm">{labels.proofLine}</p>
    </div>
  );
}

function Bar({ label, pct, value }: { label: string; pct: number; value: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex items-center gap-ch2">
      <dt className="w-measure-sm shrink-0 text-fg-muted">{label}</dt>
      <div className="relative h-[1lh] grow border border-border bg-surface" aria-hidden="true">
        {/* TODO(heavy): scrub-linked grow + glyph fill. Static width = real ratio. */}
        <div
          className="motion-safe:transition-[width] absolute inset-y-0 left-0 bg-accent"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <dd className="w-ch12 shrink-0 text-right">{value}</dd>
    </div>
  );
}
