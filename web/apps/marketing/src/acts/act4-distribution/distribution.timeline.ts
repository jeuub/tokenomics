import type { ActContext } from "../../runtime/stage-context";
import { fieldConfig } from "./distribution.field.ts";

// Act 4 — where the turns go. Field resolves into the "sorted-tiers" arrangement as the
// turns settle into difficulty bands. TODO(heavy): animated tier histogram from MIX;
// scaffold = one scrub driving the morph.
export function registerDistribution(ctx: ActContext): void {
  ctx.scroll.timeline({
    trigger: "#act4",
    start: "top top",
    end: "bottom top",
    scrub: true,
    build: (tl) => {
      const p = { v: 0 };
      tl.to(p, {
        v: 1,
        ease: "none",
        onUpdate: () => ctx.field?.morphTo(fieldConfig.targetId, p.v),
      });
    },
  });
}
