import { EmptyState } from "../../../components/ui/EmptyState";
import { PlatformBadge } from "./PlatformBadge";
import { cn } from "../../../lib/cn";
import { attentionTypeTitle } from "../utils";

const SEVERITY_DOT = {
  critical: "bg-rose-500",
  warning: "bg-amber-500",
};

function SeverityRail({ severity }) {
  return (
    <span
      className={cn(
        "absolute left-0 top-0 h-full w-[3px] rounded-r-full",
        severity === "critical" ? "bg-rose-500" : "bg-amber-400"
      )}
      aria-hidden="true"
    />
  );
}

function AttentionRow({ item }) {
  const dotTone = SEVERITY_DOT[item.severity] || SEVERITY_DOT.warning;

  return (
    <li className="relative grid grid-cols-1 gap-2 pl-4 pr-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <SeverityRail severity={item.severity} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full", dotTone)} />
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
            {attentionTypeTitle(item.type)}
          </p>
        </div>
        <p className="mt-1 truncate text-sm text-ink">{item.title}</p>
        <p className="mt-0.5 text-xs text-muted">{item.message}</p>
      </div>
      <PlatformBadge platform={item.platform} />
    </li>
  );
}

export function NeedsAttentionList({ items = [] }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Everything is in order"
        description="No drafts, schedules, or reminders need a fix right now."
      />
    );
  }

  const ordered = [...items].sort((a, b) => {
    const score = (s) => (s === "critical" ? 0 : 1);
    return score(a.severity) - score(b.severity);
  });

  return (
    <ul className="divide-y divide-border">
      {ordered.map((item, idx) => (
        <AttentionRow
          key={`${item.type}-${item.platformPostId}-${item.reminderId || idx}`}
          item={item}
        />
      ))}
    </ul>
  );
}
