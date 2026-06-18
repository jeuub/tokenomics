// Shared context object threaded through every act's register*() fn.
// Types only — no behavior. The concrete instances are built in ScrollStage.island.tsx.
import type { AsciiField } from "@tokenomics/engine-ascii";
import type { SmoothScroll } from "@tokenomics/engine-motion";

export interface ActContext {
  /** The single SmoothScroll instance for the page. */
  scroll: SmoothScroll;
  /** The single AsciiField, or null under reduced-motion / no-WebGL. */
  field: AsciiField | null;
  /** Snapshot of the reduced-motion preference at mount time. */
  reducedMotion: boolean;
}
