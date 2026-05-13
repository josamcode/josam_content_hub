import { cn } from "../../lib/cn";

const paddings = {
  none: "p-0",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  className,
  padding = "md",
  as: Component = "div",
  ...props
}) {
  return (
    <Component
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-[0_1px_0_rgba(20,20,20,0.02)]",
        paddings[padding],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("mb-3 flex items-start justify-between gap-3", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("text-sm font-semibold tracking-tight text-ink", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p className={cn("text-sm text-muted", className)} {...props} />
  );
}
