import type { ActContext } from "../../runtime/stage-context";
import { fieldConfig } from "./hero.field.ts";

// Act 1 — hero. Field settles from boot's overdense state into the "right-sized" shape
// as the H1 holds. TODO(heavy): scramble-in headline + camera move; scaffold = one scrub.
export function registerHero(ctx: ActContext): void {
  ctx.scroll.timeline({
    trigger: "#act1",
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
