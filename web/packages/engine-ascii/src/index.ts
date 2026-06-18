// @tokenomics/engine-ascii
// Framework-agnostic WebGL ASCII-halftone post effect built on OGL 1.0.11.
// Verified API (OGL 1.0.11): Renderer({ canvas, dpr, alpha }), renderer.gl,
// renderer.setSize(w, h), renderer.render({ scene }); Triangle(gl), Program(gl, { vertex, fragment, uniforms }), Mesh(gl, { geometry, program }).
//
// The effect samples a procedural plasma pattern, computes luminance, then quantizes it
// into a stepped ASCII-style ramp rendered as a glyph-cell halftone (no external atlas).
// Robust + dependency-free shading: stepped/posterized luminance per character cell.

import { Mesh, Program, Renderer, Triangle } from "ogl";

export interface AsciiFieldOptions {
  /** Device pixel ratio cap. Default: min(devicePixelRatio, 2). */
  dpr?: number;
  /** Number of luminance steps in the ASCII ramp. Default: 8. */
  levels?: number;
  /** Size of a glyph cell in CSS pixels. Default: 8. */
  cell?: number;
  /** Animation speed multiplier. Default: 1. */
  speed?: number;
  /** Foreground (glyph) color, linear 0..1 RGB. Default: greenish terminal. */
  color?: [number, number, number];
  /** Background color, linear 0..1 RGB. Default: near-black. */
  background?: [number, number, number];
  /**
   * When true, render a single static frame and never animate.
   * Caller should pass matchMedia('(prefers-reduced-motion: reduce)').matches.
   */
  reducedMotion?: boolean;
}

function resolveCanvas(target: HTMLCanvasElement | HTMLElement): {
  canvas: HTMLCanvasElement;
  owned: boolean;
  host: HTMLElement;
} {
  if (target instanceof HTMLCanvasElement) {
    return { canvas: target, owned: false, host: target.parentElement ?? target };
  }
  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  target.appendChild(canvas);
  return { canvas, owned: true, host: target };
}

const VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uCell;
uniform float uLevels;
uniform vec3 uColor;
uniform vec3 uBackground;

varying vec2 vUv;

// Cheap procedural plasma field -> luminance source.
float field(vec2 p, float t) {
  float v = 0.0;
  v += sin((p.x + t) * 3.1415);
  v += sin((p.y - t * 0.7) * 2.7);
  v += sin((p.x + p.y + t * 0.5) * 1.9);
  v += sin(length(p - 0.5) * 7.0 - t * 1.3);
  return v / 4.0; // -> ~[-1, 1]
}

// Stepped 5-dot halftone mask approximating an ASCII glyph for a given coverage level.
// level in [0,1]; cellUv in [0,1] within the character cell.
float glyphMask(vec2 cellUv, float level) {
  vec2 c = cellUv - 0.5;
  float d = length(c) * 2.0; // 0 center -> ~1 edge
  // Coverage grows with level: a filled disc whose radius tracks luminance.
  float radius = level * 1.15;
  float dot = 1.0 - smoothstep(radius - 0.15, radius, d);
  // Add a scanline texture so dense cells read as glyph strokes, not blobs.
  float stroke = step(0.5, fract(cellUv.y * 3.0)) * step(0.25, level);
  return clamp(max(dot, dot * stroke), 0.0, 1.0);
}

void main() {
  vec2 res = max(uResolution, vec2(1.0));
  float cell = max(uCell, 2.0);

  // Snap to glyph cell grid.
  vec2 px = vUv * res;
  vec2 cellId = floor(px / cell);
  vec2 cellUv = fract(px / cell);
  vec2 cellCenter = (cellId + 0.5) * cell / res;

  // Sample the field at the cell center, derive luminance.
  float raw = field(cellCenter * 2.0 - 1.0, uTime);
  float lum = clamp(raw * 0.5 + 0.5, 0.0, 1.0);

  // Posterize luminance into discrete ASCII ramp levels.
  float levels = max(uLevels, 2.0);
  float quant = floor(lum * levels) / (levels - 1.0);
  quant = clamp(quant, 0.0, 1.0);

  float mask = glyphMask(cellUv, quant);
  vec3 rgb = mix(uBackground, uColor, mask * quant);
  gl_FragColor = vec4(rgb, 1.0);
}
`;

export class AsciiField {
  private renderer: Renderer | null = null;
  private mesh: Mesh | null = null;
  private program: Program | null = null;
  private host: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ownedCanvas: boolean;
  private opts: Required<Omit<AsciiFieldOptions, "reducedMotion">> & { reducedMotion: boolean };
  private raf = 0;
  private running = false;
  private resizeObserver: ResizeObserver | null = null;
  /** True when WebGL is unavailable; the effect becomes a safe no-op. */
  readonly supported: boolean;

  constructor(canvasOrEl: HTMLCanvasElement | HTMLElement, opts: AsciiFieldOptions = {}) {
    const dprDefault =
      typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    this.opts = {
      dpr: opts.dpr ?? dprDefault,
      levels: opts.levels ?? 8,
      cell: opts.cell ?? 8,
      speed: opts.speed ?? 1,
      color: opts.color ?? [0.18, 0.95, 0.55],
      background: opts.background ?? [0.03, 0.04, 0.05],
      reducedMotion: opts.reducedMotion ?? false,
    };

    const resolved = resolveCanvas(canvasOrEl);
    this.canvas = resolved.canvas;
    this.ownedCanvas = resolved.owned;
    this.host = resolved.host;

    // Headless / SSR / no-WebGL guard. Attempt to construct the OGL renderer;
    // any failure (no document, no GL context) downgrades to an inert instance.
    let supported = false;
    if (typeof window !== "undefined") {
      try {
        const renderer = new Renderer({
          canvas: this.canvas,
          dpr: this.opts.dpr,
          alpha: false,
          antialias: false,
          depth: false,
        });
        if (renderer.gl) {
          this.renderer = renderer;
          supported = true;
        }
      } catch {
        supported = false;
      }
    }
    this.supported = supported;
  }

  init(): void {
    if (!this.supported || !this.renderer) return;
    const gl = this.renderer.gl;
    const geometry = new Triangle(gl);
    this.program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uCell: { value: this.opts.cell },
        uLevels: { value: this.opts.levels },
        uColor: { value: this.opts.color },
        uBackground: { value: this.opts.background },
      },
    });
    this.mesh = new Mesh(gl, { geometry, program: this.program });

    this.resize();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.host);
    } else if (typeof window !== "undefined") {
      window.addEventListener("resize", this.onWindowResize, { passive: true });
    }

    if (this.opts.reducedMotion) {
      // Static fallback: render a single frame, do not animate.
      this.update(0);
      return;
    }
    this.start();
  }

  private onWindowResize = (): void => this.resize();

  resize(): void {
    if (!this.renderer || !this.program) return;
    const rect = this.host.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width || this.canvas.clientWidth || 1));
    const h = Math.max(1, Math.floor(rect.height || this.canvas.clientHeight || 1));
    this.renderer.setSize(w, h);
    const gl = this.renderer.gl;
    this.program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
  }

  private start(): void {
    if (this.running || !this.supported) return;
    this.running = true;
    const loop = (t: number) => {
      if (!this.running) return;
      this.update(t * 0.001);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  /** Render one frame. `t` is elapsed time in seconds. */
  update(t: number): void {
    if (!this.renderer || !this.mesh || !this.program) return;
    this.program.uniforms.uTime.value = t * this.opts.speed;
    this.renderer.render({ scene: this.mesh });
  }

  destroy(): void {
    this.stop();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    } else if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.onWindowResize);
    }
    // Best-effort GL teardown.
    const gl = this.renderer?.gl as
      | (WebGLRenderingContext & { getExtension(name: string): any })
      | undefined;
    try {
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      /* ignore */
    }
    if (this.ownedCanvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.renderer = null;
    this.mesh = null;
    this.program = null;
  }
}

export default AsciiField;
