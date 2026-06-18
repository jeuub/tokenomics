import type { ActContext } from "../../runtime/stage-context";

// Act 6 — every route is shown. The turn-log itself is a self-contained React island
// (components/transparency/TurnLog.island.tsx) that reveals on visibility; this timeline
// only pins the section so the ledger has room to stream in. No substrate morph here.
// TODO(heavy): scrub-link the row reveal to scroll; scaffold = one basic scrub.
export function registerTransparency(ctx: ActContext): void {
  ctx.scroll.timeline({
    trigger: "#act6",
    start: "top top",
    end: "bottom top",
    scrub: true,
    build: (tl) => {
      tl.to({}, { duration: 1, ease: "none" });
    },
  });
}
