// Landing controller — wires the section markup to our libs:
//   • engine-ascii  → MorphField (hero) + Substrate (background)
//   • engine-motion → (Lenis + GSAP imported directly here for the scroll story)
//   • pricing-core  → estimator math (single source)
//   • @tokenomics/ui/widgets → cursor, magnetic CTA, drag sliders, toggles, copy
import { MorphField, Substrate } from "@tokenomics/engine-ascii";
import { compactUsd, type DefaultModel, estimateLanding } from "@tokenomics/pricing-core";
import { copyButton, customCursor, dragSlider, magneticButton, segToggle } from "@tokenomics/ui/widgets";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const q = (id: string): HTMLElement | null => document.getElementById(id);

interface EstState {
  turns: number;
  ctx: number;
  effort: number;
  def: DefaultModel;
  third: boolean;
  midStr: string;
}

function initLanding(): void {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer:fine)").matches;
  let _booted = false;

  // ---- canvases via engine-ascii ----
  const fieldEl = q("field") as HTMLCanvasElement | null;
  const field = fieldEl ? new MorphField(fieldEl) : null;
  const subEl = q("substrate") as HTMLCanvasElement | null;
  const sub = subEl ? new Substrate(subEl, { reducedMotion: reduce }) : null;
  sub?.start();
  if (sub && !reduce) {
    addEventListener(
      "scroll",
      () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        sub.setBandTarget(scrollY / (max || 1));
      },
      { passive: true },
    );
  }

  // ---- estimator (math from pricing-core, widgets from ui) ----
  const est = setupEstimator();

  // ---- copy + deploy toggle ----
  const copy = q("copybtn");
  if (copy) {
    copyButton(
      copy,
      "export ANTHROPIC_BASE_URL=https://gw.tokenomics.dev\nexport ANTHROPIC_AUTH_TOKEN=tok_<your-token>",
    );
  }
  setupDeploy();

  addEventListener("resize", () => {
    field?.size();
    sub?.size();
  });

  if (reduce) {
    field?.render(0.62);
    endBoot(true);
    return;
  }
  boot();
  if (fine) {
    const cur = q("cursor");
    if (cur) customCursor(cur);
    const cta = q("cta");
    if (cta) {
      magneticButton(cta, q("ctalabel"), [
        "opus-4.8",
        "sonnet-4.6",
        "haiku-4.5",
        "deepseek-v4",
        "glm-4.6",
        "gemini-2.5",
        "qwen-flash",
      ]);
    }
  }
  setupScroll(field, est);

  // ---------- BOOT ----------
  function boot(): void {
    const el = q("bootline");
    const msg = "computing the cheapest route…";
    const scr = "#$0123456789OPUSHAIKabcdef/<>·";
    const start = performance.now();
    const total = 1300;
    setTimeout(() => endBoot(false), 2200);
    const iv = setInterval(() => {
      const frac = Math.min(1, (performance.now() - start) / total);
      const i = Math.floor(frac * msg.length);
      let s = msg.slice(0, i);
      for (let k = 0; k < 3 && i + k < msg.length; k++)
        s += scr[Math.floor(Math.random() * scr.length)];
      if (el) el.textContent = s;
      if (frac >= 1) {
        clearInterval(iv);
        if (el) el.textContent = msg;
        setTimeout(() => endBoot(false), 240);
      }
    }, 40);
  }
  function endBoot(instant: boolean): void {
    const b = q("boot");
    if (!b || _booted) return;
    _booted = true;
    b.style.transition = instant ? "none" : "opacity .55s ease";
    b.style.opacity = "0";
    setTimeout(() => {
      b.style.display = "none";
    }, instant ? 0 : 580);
  }

  // ---------- SCROLL STORY ----------
  function setupScroll(field: MorphField | null, est: EstState): void {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t: number) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    const prog = q("progbar");
    lenis.on("scroll", () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (prog) prog.style.width = `${100 * Math.min(1, scrollY / (max || 1))}%`;
    });

    // hero pin + right-sizing morph scrub
    const heroText = q("herotext");
    const cap = q("savingscap");
    ScrollTrigger.create({
      trigger: "#hero",
      start: "top top",
      end: "+=320%",
      pin: "#hero",
      scrub: true,
      onUpdate: (self) => {
        field?.render(self.progress);
        if (heroText) heroText.style.opacity = String(Math.max(0, 1 - self.progress * 1.5));
        if (cap) cap.style.opacity = String(Math.max(0, (self.progress - 0.5) * 2));
      },
    });

    // mechanism — horizontal pin
    const track = q("mechtrack");
    if (track) {
      ScrollTrigger.create({
        trigger: "#mech",
        start: "top top",
        end: () => `+=${track.scrollWidth}`,
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          const parent = track.parentElement;
          const dist = track.scrollWidth - (parent ? parent.clientWidth : innerWidth);
          gsap.set(track, { x: -dist * self.progress });
          const pick = q("pick");
          if (pick)
            pick.textContent =
              self.progress > 0.62 ? "to the task" : self.progress > 0.3 ? scrambleWord("to the task") : "sizing…";
        },
      });
    }

    // reveals
    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: 34,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    });

    // decode the savings number when the estimator enters
    if (q("savings")) {
      ScrollTrigger.create({
        trigger: "#proof",
        start: "top 72%",
        once: true,
        onEnter: () => decodeSavings(est),
      });
    }
  }

  function scrambleWord(w: string): string {
    const s = "OPUSHAIKSNET0123456789·";
    return w
      .split("")
      .map((c) => (c === " " ? " " : s[Math.floor(Math.random() * s.length)]))
      .join("");
  }

  // ---------- ESTIMATOR ----------
  function setupEstimator(): EstState {
    const state: EstState = { turns: 40000, ctx: 18, effort: 4, def: "opus", third: true, midStr: "$0" };

    const render = (decode: boolean): void => {
      const e = estimateLanding({ turns: state.turns, ctxK: state.ctx, effort: state.effort, def: state.def, third: state.third });
      state.midStr = compactUsd(e.monthly);
      const set = (id: string, v: string): void => {
        const el = q(id);
        if (el) el.textContent = v;
      };
      const sv = q("savings");
      if (sv && !decode) sv.textContent = state.midStr;
      set("estPct", `${Math.round(e.pct * 100)}% vs ${e.def === "opus" ? "Opus 4.8" : "Sonnet 4.6"}`);
      set("estRange", `range ${compactUsd(e.monthly * 0.82)}–${compactUsd(e.monthly * 1.18)} / mo · illustrative`);
      set("costDefault", `${compactUsd(e.base)} / mo`);
      set("costRouted", `${compactUsd(e.routed)} / mo`);
      const W = 22;
      const routedW = e.base > 0 ? Math.round((W * e.routed) / e.base) : 0;
      set("barDefault", "█".repeat(W));
      set("barRouted", "█".repeat(routedW) + "░".repeat(W - routedW));
      const pc = (x: number): string => `${Math.round(x * 100)}%`;
      const pool = e.third ? "third-party &amp; free" : "Haiku (Anthropic-only)";
      const mix = q("estMix");
      if (mix)
        mix.innerHTML =
          `<div>trivial ${pc(e.trivial)} &rarr; ${e.third ? "free tier" : "Haiku 4.5"}</div>` +
          `<div>routine ${pc(e.routine)} &rarr; ${pool}</div>` +
          `<div>medium ${pc(e.medium)} &rarr; ${e.third ? "GLM-4.6" : "Sonnet 4.6"}</div>` +
          `<div>reasoning + architecture ${pc(e.kept)} &rarr; <span style="color:#a9a9a2;">your model (kept)</span></div>`;
      set("estKept", `${pc(e.kept)} of turns`);
      set("effortval", `${e.effort} / 10`);
      set("estTurnsVal", e.turns.toLocaleString("en-US"));
      set("estCtxVal", `${e.ctxK}k tok`);
    };

    const slT = q("slTurns");
    if (slT) dragSlider(slT, { min: 2000, max: 150000, step: 1000, cells: 24, value: state.turns, onInput: (v) => { state.turns = v; render(false); } });
    const slC = q("slCtx");
    if (slC) dragSlider(slC, { min: 4, max: 48, step: 1, cells: 24, value: state.ctx, onInput: (v) => { state.ctx = v; render(false); } });
    const slE = q("slEffort");
    if (slE) dragSlider(slE, { min: 0, max: 10, step: 1, cells: 10, value: state.effort, onInput: (v) => { state.effort = v; render(false); } });

    segToggle(
      [{ el: q("defOpus"), key: "opus" }, { el: q("defSonnet"), key: "sonnet" }],
      (k) => { state.def = k as DefaultModel; render(false); },
    );

    const pool = q("poolToggle");
    const ps = q("poolState");
    if (pool)
      pool.addEventListener("click", () => {
        state.third = !state.third;
        pool.setAttribute("aria-checked", String(state.third));
        if (ps) ps.textContent = state.third ? "[x]" : "[ ]";
        render(false);
      });

    render(false);
    return state;
  }

  function decodeSavings(est: EstState): void {
    const sv = q("savings");
    if (!sv) return;
    const target = est.midStr || sv.textContent || "$0";
    const digits = "0123456789";
    let n = 0;
    const iv = setInterval(() => {
      n++;
      if (n > 11) {
        clearInterval(iv);
        sv.textContent = target;
        return;
      }
      sv.textContent = target.replace(/\d/g, () => digits[Math.floor(Math.random() * 10)] ?? "0");
    }, 52);
  }

  // ---------- DEPLOY TOGGLE ----------
  function setupDeploy(): void {
    const diag = q("depDiag");
    const dCloud =
      "  your machine        tokenomics cloud\n  ┌──────────┐         ┌──────────────┐\n  │  agent   │ ──TLS──▶ │  router      │\n  └──────────┘         │  BYOK (enc)  │ ──▶ providers\n                       └──────────────┘\n  keys: encrypted at rest in our vault";
    const dSelf =
      "  your machine                         \n  ┌────────────────────────────┐       \n  │  agent ──▶ tokenomics (1 bin)│ ──▶ providers\n  │           BYOK (enc, local)  │       \n  └────────────────────────────┘       \n  keys: never leave this machine";
    const set = segToggle(
      [{ el: q("depCloud"), key: "cloud" }, { el: q("depSelf"), key: "self" }],
      (k) => {
        if (diag) diag.textContent = k === "cloud" ? dCloud : dSelf;
      },
    );
    set("cloud");
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initLanding);
else initLanding();
