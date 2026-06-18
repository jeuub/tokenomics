import type { ActContext } from "../../runtime/stage-context";
import { fieldConfig } from "./boot.field.ts";

// Act 0 — boot. The substrate fades up toward the first shape.
// TODO(heavy): glyph-rain boot sequence; for the scaffold this is one basic scrub
// that drives the field toward the "overdense" target.
export function registerBoot(ctx: ActContext): void {
  ctx.scroll.timeline({
    trigger: "#act0",
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
