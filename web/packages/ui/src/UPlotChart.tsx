import { useLayoutEffect, useRef } from "react";
import type { AlignedData, Options } from "uplot";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

export interface UPlotChartProps {
  data: AlignedData;
  /** uPlot options minus width/height, which are managed by the adapter. */
  options: Omit<Options, "width" | "height"> & Partial<Pick<Options, "width" | "height">>;
  className?: string;
}

/**
 * Thin React adapter over uPlot 1.6. Creates the plot once via
 * `new uPlot(opts, data, target)`, pushes data with `setData`, sizes to the
 * container via ResizeObserver (`setSize`), and tears down with `destroy`.
 */
export function UPlotChart({ data, options, className }: UPlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  // Create / destroy the plot when options change identity. Data updates are
  // handled by the separate effect below, so `data` is intentionally excluded.
  // biome-ignore lint/correctness/useExhaustiveDependencies: plot is recreated only on options change; data is pushed via setData in the effect below
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el == null) return;

    const rect = el.getBoundingClientRect();
    const opts: Options = {
      ...options,
      width: options.width ?? Math.max(1, Math.round(rect.width)),
      height: options.height ?? Math.max(1, Math.round(rect.height || 300)),
    };

    const plot = new uPlot(opts, data, el);
    plotRef.current = plot;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry == null) return;
      const w = Math.max(1, Math.round(entry.contentRect.width));
      const h = Math.max(1, Math.round(entry.contentRect.height || opts.height));
      plot.setSize({ width: w, height: h });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      plot.destroy();
      plotRef.current = null;
    };
  }, [options]);

  // Push data updates into the existing plot without recreating it.
  useLayoutEffect(() => {
    plotRef.current?.setData(data);
  }, [data]);

  return <div ref={containerRef} className={className} />;
}
