import { SmoothScroll } from "@tokenomics/engine-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

// Hex-dump / matrix character set for the ambient field.
const MATRIX = "0123456789ABCDEF#x@%X=+*·:";

/**
 * Single ambient + motion host for the landing:
 *  - a full-bleed 2D-canvas matrix field (faint grey hex glyphs, row banding, two
 *    brighter rectangular "glitch" blocks near the side edges, slow flicker),
 *  - Lenis smooth scroll,
 *  - a GSAP entrance timeline for the hero and ScrollTrigger reveals per section.
 * Reduced-motion: one static frame, no RAF, no smooth scroll, no entrance/reveal.
 */
export default function ScrollStage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const CELL = 12;
    let cols = 0;
    let rows = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = (): void => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${CELL - 1}px "Geist Mono Variable", ui-monospace, monospace`;
      ctx.textBaseline = "top";
      cols = Math.ceil(w / CELL) + 1;
      rows = Math.ceil(h / CELL) + 1;
    };
    resize();
    window.addEventListener("resize", resize);

    // Rectangular "glitch" blocks (normalized coords) near the side edges.
    const inBlock = (nx: number, ny: number): number => {
      const left = nx < 0.15 && ny > 0.4 && ny < 0.68;
      const right = nx > 0.85 && ny > 0.34 && ny < 0.62;
      return left || right ? 0.42 : 0;
    };

    const render = (tMs: number): void => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      const time = tMs * 0.001;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const sp = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const bandY = ((sp * 1.3) % 1 + 1) % 1;
      for (let r = 0; r < rows; r++) {
        const ny = r / rows;
        const band = 0.012 * Math.sin(r * 0.8 + time * 0.5); // faint row banding
        for (let c = 0; c < cols; c++) {
          const nx = c / cols;
          const seed = c * 92821 + r * 1311;
          const flip = Math.floor(time * 1.1 + Math.sin(seed) * 4);
          const ch = MATRIX[(((seed + flip) % MATRIX.length) + MATRIX.length) % MATRIX.length] ?? "#";
          let a = 0.1 + band * 1.5;
          // vertical matrix-rain streaks: a bright head falls down each column.
          const colSpeed = 0.05 + ((c * 73) % 11) * 0.013;
          const headY = (((time * colSpeed + c * 0.0137) % 1) + 1) % 1;
          a += Math.max(0, 0.24 - Math.abs(ny - headY) * 0.55);
          // striped glitch blocks hugging the side edges.
          const blk = inBlock(nx, ny);
          if (blk > 0) a += blk * (r % 2 === 0 ? 1 : 0.45) * (0.9 + 0.1 * Math.sin(time * 2 + seed));
          a += Math.max(0, 0.05 - Math.abs(ny - bandY) * 0.1);
          if (a <= 0.02) continue;
          ctx.fillStyle = `rgba(168,186,176,${Math.min(0.6, a).toFixed(3)})`;
          ctx.fillText(ch, c * CELL, r * CELL);
        }
      }
    };

    let raf = 0;
    if (reduced) {
      render(0);
    } else {
      let last = 0;
      const loop = (t: number): void => {
        if (t - last > 55) {
          render(t);
          last = t;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    // Smooth scroll (best-effort).
    let scroll: SmoothScroll | null = null;
    try {
      scroll = new SmoothScroll({ reducedMotion: reduced });
      scroll.init();
    } catch {
      scroll = null;
    }

    // GSAP entrance + scroll reveals (skipped entirely under reduced-motion).
    const triggers: ScrollTrigger[] = [];
    const tweens: gsap.core.Tween[] = [];
    if (!reduced) {
      gsap.registerPlugin(ScrollTrigger);

      // Hero entrance: staggered rise/fade of the marked elements.
      const heroItems = gsap.utils.toArray<HTMLElement>("#act1 [data-anim]");
      if (heroItems.length) {
        tweens.push(
          gsap.from(heroItems, {
            y: 26,
            opacity: 0,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.1,
            delay: 0.05,
          }),
        );
      }

      // Per-section reveals (every section after the hero). gsap.from is no-JS-safe:
      // if JS never runs, content simply stays visible.
      const sections = gsap.utils.toArray<HTMLElement>("main section");
      sections.forEach((sec, i) => {
        if (i === 0) return;
        const items = sec.querySelectorAll<HTMLElement>(":scope > *");
        if (!items.length) return;
        const tw = gsap.from(items, {
          y: 30,
          opacity: 0,
          duration: 0.75,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: sec, start: "top 78%" },
        });
        tweens.push(tw);
        if (tw.scrollTrigger) triggers.push(tw.scrollTrigger);
      });

      ScrollTrigger.refresh();
    }

    const onBeforeSwap = (): void => {
      for (const t of triggers) t.kill();
      for (const tw of tweens) tw.kill();
      if (raf) cancelAnimationFrame(raf);
      scroll?.destroy();
    };
    document.addEventListener("astro:before-swap", onBeforeSwap);

    return () => {
      document.removeEventListener("astro:before-swap", onBeforeSwap);
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
      for (const t of triggers) t.kill();
      for (const tw of tweens) tw.kill();
      scroll?.destroy();
    };
  }, []);

  return (
    // Decorative ambient matrix — not focusable (no tabindex), pointer-events-none.
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative canvas, never focusable
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-dvh w-screen"
    />
  );
}
