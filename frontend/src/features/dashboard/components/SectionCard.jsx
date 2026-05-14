import { useState } from "react";

import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        "shrink-0 text-muted transition-transform duration-150",
        open ? "rotate-180" : "rotate-0"
      )}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function SectionCard({
  title,
  description,
  count,
  countTone = "neutral",
  action,
  children,
  className,
  bodyClassName,
  collapsible = false,
  defaultOpen = true,
  contentId,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = collapsible ? open : true;
  const resolvedContentId =
    contentId ||
    (collapsible
      ? `${String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-content`
      : undefined);

  return (
    <Card padding="none" className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-controls={resolvedContentId}
            className="group flex min-w-0 flex-1 items-start gap-2 text-start"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
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
            <ChevronIcon open={isOpen} />
          </button>
        ) : (
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
        )}
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {isOpen && (
        <div
          id={resolvedContentId}
          className={cn("flex-1 px-5 py-4", bodyClassName)}
        >
          {children}
        </div>
      )}
    </Card>
  );
}
