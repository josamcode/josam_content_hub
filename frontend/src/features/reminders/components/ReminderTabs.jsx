import { useTranslation } from "react-i18next";

import { cn } from "../../../lib/cn";

const TABS = ["today", "upcoming", "overdue", "done"];

export function ReminderTabs({ value, onChange, counts }) {
  const { t } = useTranslation("pages");

  return (
    <div
      role="tablist"
      aria-label={t("reminders.tabs.ariaLabel")}
      className="flex flex-wrap gap-2"
    >
      {TABS.map((key) => {
        const isActive = key === value;
        const count = counts?.[key];
        return (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              isActive
                ? "border-ink/40 bg-ink text-canvas"
                : "border-border bg-surface text-ink hover:border-ink/20 hover:bg-canvas",
              key === "overdue" &&
                !isActive &&
                "border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-50"
            )}
          >
            <span className="font-medium">
              {t(`reminders.tabs.${key}`)}
            </span>
            {typeof count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em]",
                  isActive
                    ? "bg-canvas/15 text-canvas/90"
                    : key === "overdue"
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
