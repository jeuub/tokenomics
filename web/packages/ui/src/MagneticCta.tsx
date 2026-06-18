import { type ReactNode, useRef } from "react";
import { cn } from "./cn";

export interface MagneticCtaProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  strength?: number;
}

/**
 * Real <a> (when href) or <button>. On fine pointers the label trails the cursor;
 * the brackets stay put. Motion is gated by (pointer:fine) AND not reduced-motion.
 */
export function MagneticCta({
  href,
  onClick,
  children,
  className,
  strength = 0.3,
}: MagneticCtaProps) {
  const labelRef = useRef<HTMLSpanElement>(null);

  const canMove = (): boolean =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: fine)").matches === true &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches !== true;

  const onMove = (e: React.MouseEvent<HTMLElement>): void => {
    if (!canMove() || !labelRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * strength;
    const dy = (e.clientY - (r.top + r.height / 2)) * strength;
    labelRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const reset = (): void => {
    if (labelRef.current) labelRef.current.style.transform = "";
  };

  const cls = cn(
    "inline-flex items-center font-mono uppercase tracking-wider text-fg",
    "border border-accent px-4 py-2 transition-colors hover:bg-accent hover:text-bg",
    className,
  );
  const inner = (
    <>
      <span aria-hidden="true" className="text-accent">
        [
      </span>
      <span
        ref={labelRef}
        className="inline-block px-2 motion-safe:transition-transform motion-safe:duration-200"
      >
        {children}
      </span>
      <span aria-hidden="true" className="text-accent">
        ]
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cls}
        data-cursor="pointer"
        onMouseMove={onMove}
        onMouseLeave={reset}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls}
      data-cursor="pointer"
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {inner}
    </button>
  );
}
