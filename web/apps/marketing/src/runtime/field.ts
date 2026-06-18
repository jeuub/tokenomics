// The named morph-target set for THIS landing, plus the per-act field config shape.
// Inert data: ScrollStage feeds SCENE into field.setScene(); acts reference targetId.
import type { SceneConfig } from "@tokenomics/engine-ascii";

export interface ActFieldConfig {
  /** Morph target id from SCENE.targets that this act drives the field toward. */
  targetId: string;
  cell?: number;
  color?: [number, number, number];
}

// Five named shapes the substrate morphs between as the page scrolls.
// Order mirrors the narrative: overdense -> right-sized -> max -> sorted-tiers -> lock.
export const SCENE: SceneConfig = {
  targets: [
    { id: "overdense" },
    { id: "right-sized" },
    { id: "max" },
    { id: "sorted-tiers" },
    { id: "lock" },
  ],
  cell: 8,
  levels: 8,
};
