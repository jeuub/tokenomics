import type { ModelKey } from "@tokenomics/pricing-core";
import { ScrambleText } from "@tokenomics/ui";
import { useState } from "react";

import { TURN_LOG } from "../../data/turn-log";
import { TurnRow } from "./TurnRow";

export interface TurnLogIslandProps {
  /** Section heading copy (provider-neutral, no numbers). */
  title: string;
  /** Default model the illustrated session runs on. */
  defaultModel?: ModelKey;
  rowLabels: { routedTo: string; why: string };
  /** Label for the "show all / show fewer" disclosure. */
  toggleLabels: { more: string; less: string };
}

const COLLAPSED_COUNT = 4;

/**
 * Transparency turn-log island (client:visible). Streams the routed-turn ledger
 * from data/turn-log.ts. The heading uses ScrambleText (reduced-motion -> instant
 * final text). All model names come from the data module only.
 */
export default function TurnLog({
  title,
  defaultModel = "sonnet",
  rowLabels,
  toggleLabels,
}: TurnLogIslandProps) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? TURN_LOG : TURN_LOG.slice(0, COLLAPSED_COUNT);
  const hasMore = TURN_LOG.length > COLLAPSED_COUNT;

  return (
    <div className="flex flex-col gap-ch4">
      <ScrambleText as="h2" text={title} />
      <ol className="flex flex-col">
        {rows.map((entry) => (
          <TurnRow key={entry.turn} entry={entry} defaultModel={defaultModel} labels={rowLabels} />
        ))}
      </ol>
      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start border border-border px-ch2 py-ch1 font-mono text-xs uppercase tracking-wider text-fg-muted hover:border-accent hover:text-accent"
          data-cursor="pointer"
          aria-expanded={expanded}
        >
          {expanded ? toggleLabels.less : toggleLabels.more}
        </button>
      ) : null}
    </div>
  );
}
