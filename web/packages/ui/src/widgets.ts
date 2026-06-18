// @tokenomics/ui/widgets — framework-agnostic UI element behaviors used by the
// landing (and reusable elsewhere). No React, no deps. Each takes DOM nodes the
// markup already provides and wires the interaction; styling lives in the markup.

/** Custom caret cursor: ▌ over empty space, > over interactives. pointer:fine only. */
export function customCursor(cursorEl: HTMLElement): () => void {
  const style = document.createElement("style");
  style.textContent =
    "@media (pointer:fine){ html,body,*,a,button,input,[data-cursor]{ cursor:none !important; } }";
  document.head.appendChild(style);
  const onMove = (e: PointerEvent): void => {
    cursorEl.style.opacity = "1";
    cursorEl.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
  };
  const onOver = (e: Event): void => {
    const t = e.target as Element | null;
    const i = t?.closest?.("[data-cursor],a,button,input");
    cursorEl.textContent = i ? ">" : "▌";
    cursorEl.style.fontSize = i ? "20px" : "18px";
  };
  addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("mouseover", onOver);
  return () => {
    removeEventListener("pointermove", onMove);
    document.removeEventListener("mouseover", onOver);
    style.remove();
  };
}

/** Magnetic CTA: label trails the pointer; on hover it shuffles model names. */
export function magneticButton(
  btn: HTMLElement,
  label: HTMLElement | null,
  models: string[],
  resting = "[ connect your keys ]",
): void {
  btn.addEventListener("mousemove", (e) => {
    const r = btn.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * 0.3;
    const dy = (e.clientY - (r.top + r.height / 2)) * 0.4;
    btn.style.transform = `translate(${dx}px,${dy}px)`;
    if (label) label.style.transform = `translate(${dx * 0.4}px,0)`;
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "";
    if (label) label.style.transform = "";
  });
  btn.addEventListener("mouseenter", () => {
    if (!label) return;
    let n = 0;
    const iv = setInterval(() => {
      label.textContent = `[ ${models[Math.floor(Math.random() * models.length)]} ]`;
      if (++n > 6) {
        clearInterval(iv);
        label.textContent = resting;
      }
    }, 55);
  });
}

export interface DragSliderOptions {
  min: number;
  max: number;
  step: number;
  cells: number;
  value: number;
  onInput: (value: number) => void;
}

/** ASCII drag-slider over a [████░░] <pre>: pointer drag + arrow keys. */
export function dragSlider(el: HTMLElement, opts: DragSliderOptions): void {
  const { min, max, step, cells } = opts;
  let value = opts.value;
  const draw = (): void => {
    const f = Math.round(((value - min) / (max - min)) * cells);
    el.textContent = `[${"█".repeat(f)}${"░".repeat(cells - f)}]`;
    el.setAttribute("aria-valuenow", String(value));
  };
  const commit = (v: number): void => {
    value = Math.min(max, Math.max(min, Math.round(v / step) * step));
    draw();
    opts.onInput(value);
  };
  const fromX = (clientX: number): number => {
    const r = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return min + frac * (max - min);
  };
  let drag = false;
  el.addEventListener("pointerdown", (e) => {
    drag = true;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    commit(fromX(e.clientX));
    e.preventDefault();
  });
  el.addEventListener("pointermove", (e) => {
    if (drag) commit(fromX(e.clientX));
  });
  el.addEventListener("pointerup", () => {
    drag = false;
  });
  el.addEventListener("pointercancel", () => {
    drag = false;
  });
  el.addEventListener("keydown", (e) => {
    const d =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? step
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -step
          : 0;
    if (!d) return;
    e.preventDefault();
    commit(value + d);
  });
  draw();
}

/** Two-button segmented toggle (e.g. Opus/Sonnet, cloud/self-host). */
export function segToggle(
  buttons: Array<{ el: HTMLElement | null; key: string }>,
  onPick: (key: string) => void,
  active = "#6cf0a8",
  fg = "#e6e6e1",
  bg = "#0a0a0b",
): (key: string) => void {
  const set = (key: string): void => {
    for (const b of buttons) {
      if (!b.el) continue;
      const on = b.key === key;
      b.el.style.background = on ? active : "transparent";
      b.el.style.color = on ? bg : fg;
      b.el.setAttribute("aria-checked", String(on));
    }
    onPick(key);
  };
  for (const b of buttons) b.el?.addEventListener("click", () => set(b.key));
  return set;
}

/** Copy-to-clipboard button with a transient "[ ✓ copied ]" state. */
export function copyButton(btn: HTMLElement, text: string, idle = "[ copy ]"): void {
  btn.addEventListener("click", () => {
    try {
      navigator.clipboard?.writeText(text);
    } catch {
      /* ignore */
    }
    btn.textContent = "[ ✓ copied ]";
    setTimeout(() => {
      btn.textContent = idle;
    }, 1500);
  });
}
