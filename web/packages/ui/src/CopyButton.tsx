import { useEffect, useRef, useState } from "react";
import { cn } from "./cn";

export interface CopyButtonProps {
  text: string;
  resetMs?: number;
  className?: string;
}

/** '[ copy ]' -> '[ ✓ copied ]' via navigator.clipboard, with an aria-live status. */
export function CopyButton({ text, resetMs = 2000, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetMs);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      data-cursor="pointer"
      className={cn(
        "font-mono text-sm text-fg border border-border px-3 py-1 hover:border-accent",
        className,
      )}
    >
      <span aria-hidden="true">{copied ? "[ ✓ copied ]" : "[ copy ]"}</span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : "Copy to clipboard"}
      </span>
    </button>
  );
}
