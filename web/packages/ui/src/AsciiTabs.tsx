import { type ReactNode, useId, useState } from "react";
import { cn } from "./cn";

export interface AsciiTab {
  id: string;
  label: string;
  panel: ReactNode;
}
export interface AsciiTabsProps {
  tabs: AsciiTab[];
  initial?: string;
  className?: string;
}

/** Accessible tablist/tab/tabpanel; the selected tab renders as '[ label ]'. */
export function AsciiTabs({ tabs, initial, className }: AsciiTabsProps) {
  const base = useId();
  const [active, setActive] = useState<string>(initial ?? tabs[0]?.id ?? "");
  return (
    <div className={cn("font-mono", className)}>
      <div role="tablist" className="flex gap-2">
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${base}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              data-cursor="pointer"
              onClick={() => setActive(t.id)}
              className={cn("px-2 py-1 text-sm", selected ? "text-accent" : "text-fg-muted")}
            >
              {selected ? `[ ${t.label} ]` : t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={t.id !== active}
          className="pt-3"
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
