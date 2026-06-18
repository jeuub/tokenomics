import { cn } from "./cn";

export interface AsciiToggleProps {
  checked: boolean;
  onChange: (c: boolean) => void;
  labels: [string, string];
  label?: string;
  className?: string;
}

/** Real role=switch button with bracketed ASCII glyph + on/off text labels. */
export function AsciiToggle({ checked, onChange, labels, label, className }: AsciiToggleProps) {
  const [off, on] = labels;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-cursor="pointer"
      onClick={() => onChange(!checked)}
      className={cn(
        "font-mono text-sm text-fg border border-border px-3 py-1.5 hover:border-accent",
        className,
      )}
    >
      <span className={cn(!checked && "text-accent")}>{off}</span>
      <span aria-hidden="true" className="px-2 text-fg-muted">
        {checked ? "[=▐]" : "[▌=]"}
      </span>
      <span className={cn(checked && "text-accent")}>{on}</span>
    </button>
  );
}
