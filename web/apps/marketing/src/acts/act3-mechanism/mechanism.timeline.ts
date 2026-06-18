import { HorizontalPin } from "@tokenomics/engine-motion";
import type { ActContext } from "../../runtime/stage-context";

// Act 3 — how routing works. A horizontally-pinned conveyor of turns moving through
// the gateway. No field here (mechanism is a discrete diagram, not the substrate).
// TODO(heavy): per-stage stamping (size -> route -> tool-passthrough); scaffold pins +
// translates the track once. reduced-motion / coarse-pointer -> native vertical scroll.
let pin: HorizontalPin | null = null;

export function registerMechanism(ctx: ActContext): void {
  pin = new HorizontalPin({
    trigger: "#act3",
    container: "#act3-track",
    reducedMotion: ctx.reducedMotion,
    end: "+=300%",
    build: (tl) => {
      // Basic placeholder beat so the timeline is non-empty.
      tl.to({}, { duration: 1 });
    },
  });
  pin.init();
}
