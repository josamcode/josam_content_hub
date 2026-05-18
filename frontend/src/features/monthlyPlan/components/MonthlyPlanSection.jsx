import { cn } from "../../../lib/cn";

export function MonthlyPlanSection({
  title,
  count,
  children,
  emptyMessage,
  className,
}) {
  const isEmpty = !count || count === 0;

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {count > 0 && (
          <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted">
            {count}
          </span>
        )}
      </div>

      {isEmpty ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      )}
    </section>
  );
}
