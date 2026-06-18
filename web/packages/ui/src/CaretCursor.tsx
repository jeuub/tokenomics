import { useEffect, useRef, useState } from "react";
import { cn } from "./cn";

export interface CaretCursorProps {
  className?: string;
}

/**
 * Fixed custom caret (▌) that becomes '>' over interactive elements.
 * Enabled only on fine pointers without reduced-motion; otherwise renders nothing
 * (the native cursor is used).
 */
export function CaretCursor({ className }: CaretCursorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia?.("(pointer: fine)").matches === true;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    if (!fine || reduced) return;
    setEnabled(true);
    const onMove = (e: MouseEvent): void => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const t = e.target as Element | null;
      setPointer(Boolean(t?.closest?.("[data-cursor='pointer'], a, button")));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!enabled) return null;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed left-0 top-0 z-50 -translate-x-1/2 -translate-y-1/2 font-mono text-accent motion-safe:animate-pulse",
        className,
      )}
    >
      {pointer ? ">" : "▌"}
    </div>
  );
}
