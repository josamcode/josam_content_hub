import { forwardRef } from "react";

import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
  "disabled:cursor-not-allowed disabled:opacity-60 select-none";

const variants = {
  primary:
    "bg-ink text-canvas hover:bg-ink/90 active:bg-ink shadow-sm",
  accent:
    "bg-accent text-white hover:bg-accent/90 active:bg-accent shadow-sm",
  outline:
    "bg-surface text-ink border border-border hover:bg-canvas",
  ghost:
    "bg-transparent text-ink hover:bg-canvas",
  subtle:
    "bg-accent-soft text-accent hover:bg-accent-soft/80",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export const Button = forwardRef(function Button(
  {
    as: Component = "button",
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    className,
    children,
    type,
    ...props
  },
  ref
) {
  const isButton = Component === "button";
  return (
    <Component
      ref={ref}
      type={isButton ? type || "button" : type}
      disabled={isButton ? disabled || loading : undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      <span className={cn(loading && "opacity-90") + "flex items-center gap-2"}>{children}</span>
    </Component>
  );
});
