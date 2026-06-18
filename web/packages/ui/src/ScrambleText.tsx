import { createScramble } from "@tokenomics/engine-motion";
import { type ElementType, useEffect, useRef } from "react";

export interface ScrambleTextProps {
  text: string;
  as?: ElementType;
  durationMs?: number;
  className?: string;
}

/**
 * Renders `text` as SSR-safe static content, then reveals it with a scramble
 * effect on first visibility (immediate when no IntersectionObserver /
 * reduced-motion). The engine-motion scramble respects reduced-motion.
 */
export function ScrambleText({ text, as, durationMs = 1200, className }: ScrambleTextProps) {
  const Tag = (as ?? "span") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctrl = createScramble();
    let io: IntersectionObserver | null = null;
    const run = (): void => ctrl.to(el, text, { duration: durationMs / 1000 });
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
  }, [text, durationMs]);

  return (
    <Tag ref={ref as never} className={className}>
      {text}
    </Tag>
  );
}
