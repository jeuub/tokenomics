import { createScramble } from "@tokenomics/engine-motion";
import { useEffect, useRef } from "react";

export interface DecodeNumberProps {
  value: number;
  format?: (v: number) => string;
  durationMs?: number;
  className?: string;
}

// Digit-noise charset — the value DECODES from this, it does not count up.
const NOISE = "0123456789.,$%KM ";

/**
 * Reveals the REAL formatted value by decoding it out of digit-noise (never an
 * incrementing count-up — honest by construction). Reduced-motion shows the value.
 */
export function DecodeNumber({ value, format, durationMs = 1200, className }: DecodeNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const final = format ? format(value) : String(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctrl = createScramble();
    let io: IntersectionObserver | null = null;
    const run = (): void => ctrl.to(el, final, { duration: durationMs / 1000, chars: NOISE });
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          run();
          io?.disconnect();
        }
      });
      io.observe(el);
    } else {
      run();
    }
    return () => {
      io?.disconnect();
      ctrl.destroy();
    };
  }, [final, durationMs]);

  // The text content is the final value, so screen readers read it verbatim;
  // no aria-label needed (and a bare <span> doesn't support one).
  return (
    <span ref={ref} className={className}>
      {final}
    </span>
  );
}
