// @tokenomics/engine-ascii — framework-agnostic 2D-canvas glyph engines for the
// landing. Two renderers, ported from the approved design:
//   • MorphField  — the hero "right-sizing" field: excess glyph mass (p=0) thins
//     down to the task footprint (p=1); the emptiness that opens up is savings.
//   • Substrate   — a frozen low-contrast halftone whose brightness band tracks
//     scroll progress (only brightness moves).
// No DOM framework, no deps. Each owns one <canvas>.

function hash(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

const FONT = (px: number): string => `${px}px 'Geist Mono','JetBrains Mono',monospace`;

export class MorphField {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fs = 18;
  private lh = 21;
  private chW: number;
  private cols = 0;
  private rows = 0;
  /** current morph progress 0..1 */
  p = 0;
  private ramp = " .·:-=+ox#%@█";

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("MorphField: 2d context unavailable");
    this.ctx = ctx;
    this.chW = this.fs * 0.6;
    this.size();
  }

  size(): void {
    const host = this.canvas.parentElement;
    if (!host) return;
    const r = host.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, r.width * dpr);
    this.canvas.height = Math.max(1, r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.font = FONT(this.fs);
    this.ctx.textBaseline = "top";
    this.chW = this.ctx.measureText("M").width || this.fs * 0.6;
    this.cols = Math.ceil(r.width / this.chW) + 1;
    this.rows = Math.ceil(r.height / this.lh) + 1;
    this.render(this.p);
  }

  render(p: number): void {
    this.p = p;
    const ctx = this.ctx;
    const C = this.cols;
    const R = this.rows;
    const ramp = this.ramp;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.font = FONT(this.fs);
    ctx.textBaseline = "top";
    for (let y = 0; y < R; y++) {
      const ny = y / R - 0.5;
      const band = 1 - Math.min(1, Math.abs(ny) / 0.34);
      for (let x = 0; x < C; x++) {
        const nx = x / C - 0.5;
        const e = (nx * nx) / (0.37 * 0.37) + (ny * ny) / (0.3 * 0.3);
        if (e < 1) continue; // quiet ellipse keeps the headline legible
        const fade = e < 1.5 ? (e - 1) / 0.5 : 1;
        const h = hash(x, y);
        const necessity = band * 0.82 + h * 0.18;
        const thr = p * (0.52 + 0.46 * hash(x * 1.7, y * 0.9));
        if (necessity < thr) continue; // trimmed → negative space (savings)
        const front = necessity < thr + 0.05; // cut-edge cells glow
        const heavy = (1 - p) * 0.62 + necessity * 0.38;
        const gi = Math.max(1, Math.min(ramp.length - 1, Math.round(heavy * (ramp.length - 1))));
        const ch = ramp[gi];
        let col: string;
        let a: number;
        if (front && p > 0.02) {
          col = "108,240,168";
          a = 0.9 * fade;
        } else {
          const lv = 96 + Math.round(heavy * 70);
          col = `${lv},${lv},${lv - 6}`;
          a = (0.14 + 0.34 * heavy) * fade;
        }
        ctx.fillStyle = `rgba(${col},${a})`;
        ctx.fillText(ch ?? "#", x * this.chW, y * this.lh);
      }
    }
  }
}

export interface SubstrateOptions {
  reducedMotion?: boolean;
}

export class Substrate {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sfs = 16;
  private slh = 22;
  private band = 0.5;
  private bandTarget = 0.5;
  private scw = 9.6;
  private scols = 0;
  private srows = 0;
  private glyphs = "·.,:;'\"`~-=|/\\";
  private raf = 0;
  private last = 0;
  private reduce: boolean;

  constructor(canvas: HTMLCanvasElement, opts: SubstrateOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Substrate: 2d context unavailable");
    this.ctx = ctx;
    this.reduce = opts.reducedMotion ?? false;
    this.size();
  }

  size(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, window.innerWidth * dpr);
    this.canvas.height = Math.max(1, window.innerHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.font = FONT(this.sfs);
    this.ctx.textBaseline = "top";
    this.scw = this.ctx.measureText("M").width || 9.6;
    this.scols = Math.ceil(window.innerWidth / this.scw) + 1;
    this.srows = Math.ceil(window.innerHeight / this.slh) + 1;
  }

  /** 0..1 — where the brightness band sits (driven by scroll progress). */
  setBandTarget(v: number): void {
    this.bandTarget = Math.min(1, Math.max(0, v));
  }

  draw(now: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.font = FONT(this.sfs);
    ctx.textBaseline = "top";
    this.band += (this.bandTarget - this.band) * 0.06;
    const bandRow = this.band * this.srows;
    const sig = this.srows * 0.26;
    const sig2 = 2 * sig * sig;
    const tph = (now / 15000) * Math.PI * 2;
    const G = this.glyphs;
    const R = this.srows;
    const C = this.scols;
    for (let y = 0; y < R; y++) {
      const dy = y - bandRow;
      const bandB = Math.exp(-(dy * dy) / sig2);
      for (let x = 0; x < C; x++) {
        if ((x + y) % 2 !== 0) continue; // dither — halftone feel + half the draws
        const h = hash(x * 0.7, y * 1.3);
        const breath = 0.5 + 0.5 * Math.sin(tph + h * 6.28);
        const a = 0.016 + 0.02 * breath + 0.05 * bandB;
        ctx.fillStyle = `rgba(176,176,168,${a})`;
        ctx.fillText(G[(x * 7 + y * 13) % G.length] ?? ".", x * this.scw, y * this.slh);
      }
    }
  }

  start(): void {
    if (this.reduce) {
      this.draw(0);
      return;
    }
    const loop = (now: number): void => {
      if (now - this.last > 40) {
        this.draw(now);
        this.last = now;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}
