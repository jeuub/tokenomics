import type { ActContext } from "../../runtime/stage-context";
import { fieldConfig } from "./problem.field.ts";

// Act 2 — the cost of overkill. Field pushes to the "max" (overdense) extreme to
// visualize sending every turn to the biggest model.
// TODO(heavy): density meter + waste highlight; scaffold = one scrub.
export function registerProblem(ctx: ActContext): void {
  ctx.scroll.timeline({
    trigger: "#act2",
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
