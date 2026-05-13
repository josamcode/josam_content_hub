import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

export function StatCard({
  label,
  value,
  helper,
  trend,
  accent = false,
  className,
}) {
  const display =
    typeof value === "number"
      ? value.toLocaleString()
      : value || "—";

  return (
    <Card
      padding="md"
      className={cn(
        "flex flex-col gap-5",
        accent && "bg-ink text-canvas",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-[11px] font-medium uppercase tracking-[0.18em]",
            accent ? "text-canvas/60" : "text-muted"
          )}
        >
          {label}
        </p>
        {trend && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider text-nowrap",
              accent
                ? "bg-canvas/10 text-canvas/80"
                : "bg-accent-soft text-accent"
            )}
          >
            {trend}
          </span>
        )}
      </div>

      <p
        className={cn(
          "font-display text-4xl leading-none",
          accent ? "text-canvas" : "text-ink"
        )}
      >
        {display}
      </p>

      {helper && (
        <p
          className={cn(
            "text-xs leading-relaxed",
            accent ? "text-canvas/65" : "text-muted"
          )}
        >
          {helper}
        </p>
      )}
    </Card>
  );
}
