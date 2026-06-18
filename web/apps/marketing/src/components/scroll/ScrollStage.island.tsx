import { SmoothScroll } from "@tokenomics/engine-motion";
import { useEffect, useRef } from "react";

// Hex-dump / matrix character set for the ambient field.
const MATRIX = "0123456789ABCDEF#x@%X=+*·:";

/**
 * Single ambient host for the landing:
 *  - a full-bleed 2D-canvas matrix field (dense, faint grey hex glyphs that slowly
 *    flicker, with two brighter glitch patches near the side edges and a subtle
 *    scroll-linked brightness band),
 *  - Lenis smooth scroll + IntersectionObserver section reveals.
 * Reduced-motion: one static frame, no RAF, no smooth scroll, no reveal-hiding.
 */
export default function ScrollStage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const CELL = 13;
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
      ctx.font = `${CELL - 1}px ui-monospace, "Geist Mono", monospace`;
      ctx.textBaseline = "top";
      cols = Math.ceil(w / CELL) + 1;
      rows = Math.ceil(h / CELL) + 1;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = (tMs: number): void => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      const time = tMs * 0.001;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const sp = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      // Two brighter glitch patches that bob slowly near the side edges.
      const b1x = 0.07;
      const b1y = 0.52 + Math.sin(time * 0.5) * 0.07;
      const b2x = 0.94;
      const b2y = 0.44 + Math.cos(time * 0.42) * 0.07;
      const bandY = ((sp * 1.3) % 1 + 1) % 1;
      for (let r = 0; r < rows; r++) {
        const ny = r / rows;
        for (let c = 0; c < cols; c++) {
          const nx = c / cols;
          const seed = c * 92821 + r * 1311;
          const flip = Math.floor(time * 1.3 + Math.sin(seed) * 4);
          const ch = MATRIX[((seed + flip) % MATRIX.length + MATRIX.length) % MATRIX.length] ?? "#";
          let a = 0.04;
          a += Math.max(0, 0.13 - Math.hypot(nx - b1x, ny - b1y) * 0.55);
          a += Math.max(0, 0.13 - Math.hypot(nx - b2x, ny - b2y) * 0.55);
          a += Math.max(0, 0.05 - Math.abs(ny - bandY) * 0.12);
          ctx.fillStyle = `rgba(214,222,228,${a.toFixed(3)})`;
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
        if (t - last > 60) {
          render(t);
          last = t;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    let scroll: SmoothScroll | null = null;
    try {
      scroll = new SmoothScroll({ reducedMotion: reduced });
      scroll.init();
    } catch {
      scroll = null;
    }

    let io: IntersectionObserver | null = null;
    if (!reduced && typeof IntersectionObserver !== "undefined") {
      const sections = Array.from(document.querySelectorAll<HTMLElement>("main section"));
      // Don't hide the hero (first section) — it is the LCP and must paint instantly.
      for (const s of sections.slice(1)) s.setAttribute("data-reveal", "");
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io?.unobserve(e.target);
            }
          }
        },
        { threshold: 0.12 },
      );
      for (const s of sections.slice(1)) io.observe(s);
    }

    const onBeforeSwap = (): void => {
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      scroll?.destroy();
    };
    document.addEventListener("astro:before-swap", onBeforeSwap);

    return () => {
      document.removeEventListener("astro:before-swap", onBeforeSwap);
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
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
