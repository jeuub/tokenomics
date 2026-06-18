import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";

export type ButtonVariant = "solid" | "outline" | "ghost";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  "inline-flex items-center justify-center gap-2 font-mono uppercase tracking-wider " +
  "border transition-colors duration-150 select-none cursor-pointer " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-accent focus-visible:ring-offset-bg " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  solid: "bg-accent text-bg border-accent " + "hover:bg-accent-strong hover:border-accent-strong",
  outline: "bg-transparent text-fg border-border " + "hover:border-accent hover:text-accent",
  ghost: "bg-transparent text-fg-muted border-transparent " + "hover:text-fg hover:bg-surface",
};

const sizes: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5",
  md: "text-sm px-4 py-2",
};

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "solid", size = "md", type = "button", className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
});
