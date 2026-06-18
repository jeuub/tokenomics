import { SmoothScroll } from "@tokenomics/engine-motion";
import { useEffect, useRef } from "react";

// Luminance ramps: sparse -> dense.
const RAMP = " .:-=+*#%@";
const RAMP_DENSE = ".:-=+*o#%@";
const ACCENT: [number, number, number] = [55, 224, 140]; // ~ --color-accent

// Hero signature grid (the "right-sizing" mass that thins as you scroll).
const HW = 92;
const HH = 16;

/**
 * Single ambient host for the landing:
 *  - a full-bleed 2D-canvas ASCII substrate (breathing field + a brightness band
 *    that sweeps with scroll),
 *  - the hero "right-sizing" signature: a dense ASCII mass (#hero-ascii) that thins
 *    to a lighter shape as the hero scrolls,
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
    const heroPre = document.getElementById("hero-ascii");

    const CELL = 14;
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
      ctx.font = `${CELL}px ui-monospace, "Geist Mono", monospace`;
      ctx.textBaseline = "top";
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
    };
    resize();
    window.addEventListener("resize", resize);

    const renderSubstrate = (time: number, sp: number): void => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      const bandY = (((sp * 1.7 - 0.35) % 1) + 1) % 1; // sweeps down with scroll
      for (let r = 0; r < rows; r++) {
        const y = r / rows;
        for (let c = 0; c < cols; c++) {
          const x = c / cols;
          let v = Math.sin(x * 6 + time);
          v += Math.sin(y * 5 - time * 0.7);
          v += Math.sin((x + y) * 4 + time * 0.5);
          v = (v / 3) * 0.5 + 0.5; // 0..1
          const glow = Math.max(0, 1 - Math.abs(y - bandY) * 2.6);
          const bright = Math.min(1, v * 0.6 + glow * 0.85);
          const ch = RAMP[Math.floor(bright * (RAMP.length - 1))] ?? " ";
          if (ch === " ") continue;
          ctx.fillStyle = `rgba(${ACCENT[0]},${ACCENT[1]},${ACCENT[2]},${(0.06 + bright * 0.4).toFixed(3)})`;
          ctx.fillText(ch, c * CELL, r * CELL);
        }
      }
    };

    // The hero signature: an overdense mass that right-sizes (thins) with scroll.
    const renderHero = (time: number): void => {
      if (!heroPre) return;
      const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)));
      const thin = 0.18 + p * 0.55; // higher threshold -> more empty cells -> "right-sized"
      let s = "";
      for (let y = 0; y < HH; y++) {
        const ny = y / HH;
        for (let x = 0; x < HW; x++) {
          const nx = x / HW;
          let v = Math.sin(nx * 13 + time * 1.4);
          v += Math.sin(ny * 8 - time * 1.1);
          v += Math.sin((nx + ny) * 9 + time * 0.7);
          v = (v / 3) * 0.5 + 0.5;
          s += v > thin ? (RAMP_DENSE[Math.floor(v * (RAMP_DENSE.length - 1))] ?? " ") : " ";
        }
        s += "\n";
      }
      heroPre.textContent = s;
    };

    let raf = 0;
    const frame = (tMs: number): void => {
      const time = tMs * 0.00035;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const sp = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      renderSubstrate(time, sp);
      renderHero(time);
    };

    if (reduced) {
      frame(0);
    } else {
      let last = 0;
      const loop = (t: number): void => {
        if (t - last > 45) {
          frame(t);
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
      for (const s of sections) s.setAttribute("data-reveal", "");
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
      for (const s of sections) io.observe(s);
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
    // Decorative ambient substrate — not focusable (no tabindex), pointer-events-none.
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative canvas, never focusable
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-dvh w-screen"
    />
  );
}
