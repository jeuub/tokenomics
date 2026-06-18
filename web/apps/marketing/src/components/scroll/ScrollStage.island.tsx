import { AsciiField } from "@tokenomics/engine-ascii";
import { SmoothScroll } from "@tokenomics/engine-motion";
import { useEffect, useRef } from "react";

import { registerBoot } from "../../acts/act0-boot/boot.timeline";
import { registerHero } from "../../acts/act1-hero/hero.timeline";
import { registerProblem } from "../../acts/act2-problem/problem.timeline";
import { registerMechanism } from "../../acts/act3-mechanism/mechanism.timeline";
import { registerDistribution } from "../../acts/act4-distribution/distribution.timeline";
import { registerProof } from "../../acts/act5-proof/proof.timeline";
import { registerTransparency } from "../../acts/act6-transparency/transparency.timeline";
import { registerByok } from "../../acts/act7-byok/byok.timeline";
import { registerPrice } from "../../acts/act8-price/price.timeline";
import { SCENE } from "../../runtime/field";
import { prefersReducedMotion } from "../../runtime/reduced-motion";
import type { ActContext } from "../../runtime/stage-context";

/**
 * THE orchestrator island (client:load). On mount in the browser it constructs
 * exactly ONE SmoothScroll and ONE AsciiField (a full-bleed aria-hidden substrate
 * canvas), wires the shared ActContext, and registers every act timeline in
 * scroll order via EXPLICIT imports (no barrels — see HARD INVARIANTS).
 *
 * Reduced-motion / SSR / no-WebGL: the field stays null, no register*() drives a
 * WebGL morph (the timelines themselves no-op via SmoothScroll/HorizontalPin), and
 * the prebaked stills baked into each act's SSR markup remain the visible state.
 */
export default function ScrollStage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Browser-only guard. (useEffect already never runs during SSR, but keep the
    // explicit check so the intent — and any future hoisting — stays correct.)
    if (typeof window === "undefined") return;

    const reducedMotion = prefersReducedMotion();

    const scroll = new SmoothScroll({ reducedMotion });
    scroll.init();

    // Reduced-motion -> skip WebGL entirely; the prebaked stills carry the visuals.
    let field: AsciiField | null = null;
    if (!reducedMotion && canvasRef.current) {
      const f = new AsciiField(canvasRef.current, { reducedMotion });
      if (f.supported) {
        f.setScene(SCENE);
        f.init();
        field = f;
      } else {
        f.destroy();
      }
    }

    const ctx: ActContext = { scroll, field, reducedMotion };

    // Registry order (act0..act8). Each builds its own timeline/pin and may drive
    // ctx.field?.morphTo(targetId, progress).
    registerBoot(ctx);
    registerHero(ctx);
    registerProblem(ctx);
    registerMechanism(ctx);
    registerDistribution(ctx);
    registerProof(ctx);
    registerTransparency(ctx);
    registerByok(ctx);
    registerPrice(ctx);

    // Recompute ScrollTrigger after the acts wired their pins/timelines.
    scroll.refresh();

    // Pause the field's RAF loop while the substrate canvas is offscreen.
    let io: IntersectionObserver | null = null;
    if (field && typeof IntersectionObserver !== "undefined" && canvasRef.current) {
      const f = field;
      io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          if (entry.isIntersecting) f.start();
          else f.stop();
        },
        { threshold: 0 },
      );
      io.observe(canvasRef.current);
    }

    // View Transitions lifecycle: tear down before a swap, re-init after a load.
    // We let unmount handle the common case; these guard Astro's client router.
    const onBeforeSwap = () => {
      io?.disconnect();
      io = null;
      field?.destroy();
      field = null;
      scroll.destroy();
    };
    const onPageLoad = () => {
      // A fresh island instance mounts on the new page; nothing to re-init here.
      // Hook kept for symmetry with the contract + future stateful re-init.
    };
    document.addEventListener("astro:before-swap", onBeforeSwap);
    document.addEventListener("astro:page-load", onPageLoad);

    return () => {
      document.removeEventListener("astro:before-swap", onBeforeSwap);
      document.removeEventListener("astro:page-load", onPageLoad);
      io?.disconnect();
      field?.destroy();
      scroll.destroy();
    };
  }, []);

  return (
    // Decorative ambient substrate — not focusable (no tabindex), pointer-events-none.
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative canvas, never focusable
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-dvh w-screen"
    />
  );
}
