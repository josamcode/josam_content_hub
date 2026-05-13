import { cn } from "../../../lib/cn";

const TABS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "done", label: "Done" },
];

export function ReminderTabs({ value, onChange, counts }) {
  return (
    <div
      role="tablist"
      aria-label="Reminder ranges"
      className="flex flex-wrap gap-2"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === value;
        const count = counts?.[tab.key];
        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              isActive
                ? "border-ink/40 bg-ink text-canvas"
                : "border-border bg-surface text-ink hover:border-ink/20 hover:bg-canvas",
              tab.key === "overdue" && !isActive && "text-rose-700 border-rose-200 bg-rose-50/60 hover:bg-rose-50"
            )}
          >
            <span className="font-medium">{tab.label}</span>
            {typeof count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em]",
                  isActive
                    ? "bg-canvas/15 text-canvas/90"
                    : tab.key === "overdue"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-canvas text-muted"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
