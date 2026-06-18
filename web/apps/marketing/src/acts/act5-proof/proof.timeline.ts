import type { ActContext } from "../../runtime/stage-context";

// Act 5 — measured savings. No substrate morph; the proof island animates its own bars
// + DecodeNumber on intersect. This timeline just pins the section briefly so the reveal
// has room. TODO(heavy): scrub-link the bar growth to scroll; scaffold = basic pin scrub.
export function registerProof(ctx: ActContext): void {
  ctx.scroll.timeline({
    trigger: "#act5",
    start: "top top",
    end: "bottom top",
    scrub: true,
    build: (tl) => {
      tl.to({}, { duration: 1, ease: "none" });
    },
  });
}
