import { useId } from "react";
import { cn } from "./cn";

export interface AsciiSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  step?: number;
  label?: string;
  renderLabel?: (value: number, bar: string) => string;
  cells?: number;
  className?: string;
}

function makeBar(value: number, min: number, max: number, cells: number): string {
  const ratio = max > min ? (value - min) / (max - min) : 0;
  const filled = Math.round(ratio * cells);
  return "█".repeat(filled) + "░".repeat(Math.max(0, cells - filled));
}

/** Real <input type=range> with an aria-hidden ASCII readout ('[██████░░░░] 6'). */
export function AsciiSlider({
  value,
  min,
  max,
  onChange,
  step = 1,
  label,
  renderLabel,
  cells = 10,
  className,
}: AsciiSliderProps) {
  const id = useId();
  const bar = makeBar(value, min, max, cells);
  const readout = renderLabel ? renderLabel(value, bar) : `[${bar}] ${value}`;
  return (
    <div className={cn("font-mono text-sm text-fg", className)}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-xs uppercase tracking-wider text-fg-muted">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="accent-accent"
        />
        <span aria-hidden="true" className="whitespace-pre text-fg-muted">
          {readout}
        </span>
      </div>
    </div>
  );
}
