import type { ModelKey } from "@tokenomics/pricing-core";

import { routeLabel, type TurnLogEntry } from "../../data/turn-log";

export interface TurnRowProps {
  entry: TurnLogEntry;
  /** Default model the session runs on (resolves `routedTo === null` rows). */
  defaultModel: ModelKey;
  /** Localized labels (no model names — those resolve from the data module). */
  labels: { routedTo: string; why: string };
}

/**
 * One row of the transparency turn-log. Renders "which model ran and why" using
 * ONLY data from the entry plus routeLabel() — both from data/turn-log.ts, the
 * single place model-name literals are allowed (HARD INVARIANT).
 */
export function TurnRow({ entry, defaultModel, labels }: TurnRowProps) {
  const model = routeLabel(entry.routedTo, defaultModel);
  const kept = entry.routedTo === null;

  return (
    <li className="flex flex-col gap-ch1 border-b border-border/50 py-ch2 font-mono text-sm">
      <div className="flex flex-wrap items-baseline gap-ch2">
        <span className="text-accent">#{entry.turn}</span>
        <span className="text-fg-muted">{entry.tier}</span>
      </div>

      <div className="flex flex-wrap items-baseline gap-ch2">
        <span className="text-fg-muted">{labels.routedTo}:</span>
        <span className={kept ? "text-fg-muted" : "text-fg"}>{model}</span>
        {kept ? <span className="text-fg-muted">(kept)</span> : null}
      </div>

      <p className="text-xs text-fg-muted">
        {labels.why}: {entry.reason}
      </p>
    </li>
  );
}
