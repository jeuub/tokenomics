import type { HTMLAttributes } from "react";

export interface AsciiDividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Character repeated to form the rule. */
  glyph?: string;
  /** Accessible label; defaults to a presentational separator. */
  label?: string;
}

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Decorative ASCII rule. Static by default; any motion is opt-in and gated by
 * `motion-safe:` so `prefers-reduced-motion: reduce` keeps it fully static.
 */
export function AsciiDivider({ glyph = "─", label, className, ...rest }: AsciiDividerProps) {
  const aria = label
    ? { role: "separator" as const, "aria-label": label }
    : { role: "presentation" as const, "aria-hidden": true };
  return (
    <div
      {...aria}
      className={cx(
        "font-mono text-border leading-none overflow-hidden whitespace-nowrap select-none",
        "motion-safe:opacity-90",
        className,
      )}
      {...rest}
    >
      {glyph.repeat(120)}
    </div>
  );
}
