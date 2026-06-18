// @tokenomics/engine-motion
// Framework-agnostic smooth-scroll + scroll-linked animation engine.
// Built on Lenis 1.3.23 and GSAP 3.15 ScrollTrigger.
//
// Verified recipe (Lenis 1.3 + GSAP):
//   import { Lenis } from 'lenis'
//   const lenis = new Lenis({ autoRaf: false })          // we drive RAF via gsap.ticker
//   lenis.on('scroll', ScrollTrigger.update)
//   gsap.ticker.add((time) => lenis.raf(time * 1000))    // seconds -> ms
//   gsap.ticker.lagSmoothing(0)
//
// Short-circuits to a native/no-op implementation when prefers-reduced-motion is set
// or when there is no window (SSR).

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lenis } from "lenis";

export interface SmoothScrollOptions {
  /** Lenis lerp factor (0..1). Default Lenis behavior if omitted. */
  lerp?: number;
  /** Lenis duration (seconds) for wheel-driven scrolling. */
  duration?: number;
  /** Override reduced-motion detection (mainly for testing). */
  reducedMotion?: boolean;
  /** Root element to scroll. Defaults to window/document. */
  wrapper?: HTMLElement | Window;
  /** Content element. Defaults to document.documentElement. */
  content?: HTMLElement;
}

/** Spec for a scroll-linked GSAP timeline created via SmoothScroll.timeline(). */
export interface ScrollTimelineSpec {
  /** Trigger element or selector. */
  trigger: Element | string;
  start?: string;
  end?: string;
  /** true | number — link timeline progress to scroll. Default: true. */
  scrub?: boolean | number;
  pin?: boolean | Element | string;
  markers?: boolean;
  /** Build the animation onto the supplied timeline. */
  build: (tl: gsap.core.Timeline) => void;
}

function isReducedMotion(override?: boolean): boolean {
  if (typeof override === "boolean") return override;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let pluginRegistered = false;
function ensurePlugin(): void {
  if (pluginRegistered) return;
  if (typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  pluginRegistered = true;
}

export class SmoothScroll {
  private lenis: Lenis | null = null;
  private opts: SmoothScrollOptions;
  private tickerCb: ((time: number) => void) | null = null;
  private triggers: ScrollTrigger[] = [];
  /** True when smooth scroll is active (not SSR, not reduced-motion). */
  readonly active: boolean;

  constructor(opts: SmoothScrollOptions = {}) {
    this.opts = opts;
    this.active = typeof window !== "undefined" && !isReducedMotion(opts.reducedMotion);
  }

  init(): void {
    // SSR / reduced-motion: no-op. ScrollTrigger (if used via timeline()) will fall
    // back to the browser's native scroll position, which is correct and accessible.
    if (!this.active) {
      ensurePlugin();
      return;
    }

    ensurePlugin();

    this.lenis = new Lenis({
      autoRaf: false, // GSAP ticker drives raf instead of Lenis's internal loop
      lerp: this.opts.lerp,
      duration: this.opts.duration,
      wrapper: this.opts.wrapper as Window,
      content: this.opts.content,
    });

    // Keep ScrollTrigger in sync with Lenis-driven scroll position.
    this.lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker (seconds -> milliseconds).
    this.tickerCb = (time: number) => {
      this.lenis?.raf(time * 1000);
    };
    gsap.ticker.add(this.tickerCb);
    gsap.ticker.lagSmoothing(0);
  }

  /** Programmatic scroll. Falls back to native when inactive. */
  scrollTo(target: number | string | HTMLElement, options?: Record<string, unknown>): void {
    if (this.lenis) {
      this.lenis.scrollTo(target as any, options as any);
      return;
    }
    if (typeof window === "undefined") return;
    if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: "auto" });
    } else {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      (el as HTMLElement | null)?.scrollIntoView();
    }
  }

  /**
   * Register a scroll-linked GSAP timeline. Returns the created timeline
   * (or null when inactive / SSR). The associated ScrollTrigger is tracked
   * and torn down by destroy().
   */
  timeline(spec: ScrollTimelineSpec): gsap.core.Timeline | null {
    if (typeof window === "undefined") return null;
    ensurePlugin();

    // When reduced-motion is on, still build the timeline but jump to its end
    // state immediately (no scrubbing), so content is visible and final.
    if (!this.active) {
      const tl = gsap.timeline({ paused: true });
      spec.build(tl);
      tl.progress(1);
      return tl;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spec.trigger,
        start: spec.start ?? "top top",
        end: spec.end ?? "bottom top",
        scrub: spec.scrub ?? true,
        pin: spec.pin,
        markers: spec.markers ?? false,
      },
    });
    spec.build(tl);
    if (tl.scrollTrigger) this.triggers.push(tl.scrollTrigger);
    return tl;
  }

  /** Recompute ScrollTrigger measurements (call after layout changes). */
  refresh(): void {
    if (typeof window === "undefined") return;
    ScrollTrigger.refresh();
  }

  destroy(): void {
    for (const t of this.triggers) {
      try {
        t.kill();
      } catch {
        /* ignore */
      }
    }
    this.triggers = [];

    if (this.tickerCb) {
      gsap.ticker.remove(this.tickerCb);
      this.tickerCb = null;
    }
    if (this.lenis) {
      this.lenis.off("scroll", ScrollTrigger.update);
      this.lenis.destroy();
      this.lenis = null;
    }
  }
}

export default SmoothScroll;
