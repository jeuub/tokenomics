import type { ActContext } from "../../runtime/stage-context";
import { fieldConfig } from "./byok.field.ts";

// Act 7 — bring your own keys. Field morphs into the "lock" shape (keys/ownership).
// TODO(heavy): key-insertion animation synced to the install snippet; scaffold = one scrub.
export function registerByok(ctx: ActContext): void {
  ctx.scroll.timeline({
    trigger: "#act7",
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
