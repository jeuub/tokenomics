import type { ReactNode } from "react";
import { cn } from "./cn";

export interface SelfDrawingBoxProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

/**
 * Box-drawing frame. Static by default; a motion-safe sweep can be layered on
 * via the `motion-safe:` reveal in the implementation pass. Optional label notch.
 */
export function SelfDrawingBox({ children, label, className }: SelfDrawingBoxProps) {
  return (
    <div className={cn("relative border border-border p-4 font-mono", className)}>
      {label && (
        <span className="absolute -top-2 left-3 bg-bg px-1 text-xs uppercase tracking-wider text-fg-muted">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}
