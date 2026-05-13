import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

export function SectionCard({
  title,
  description,
  count,
  countTone = "neutral",
  action,
  children,
  className,
  bodyClassName,
}) {
  return (
    <Card padding="none" className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[20px] leading-tight text-ink">
              {title}
            </h2>
            {typeof count === "number" && (
              <Badge tone={countTone}>{count}</Badge>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-muted">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("flex-1 px-5 py-4", bodyClassName)}>{children}</div>
    </Card>
  );
}
