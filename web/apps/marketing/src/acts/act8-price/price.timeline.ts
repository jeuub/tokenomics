import type { ActContext } from "../../runtime/stage-context";

// Act 8 — connect your keys (final CTA). No substrate morph; hold the closing frame.
// TODO(heavy): CTA magnetic settle + snippet reveal; scaffold = basic pin scrub.
export function registerPrice(ctx: ActContext): void {
  ctx.scroll.timeline({
    trigger: "#act8",
    start: "top top",
    end: "bottom top",
    scrub: true,
    build: (tl) => {
      tl.to({}, { duration: 1, ease: "none" });
    },
  });
}
