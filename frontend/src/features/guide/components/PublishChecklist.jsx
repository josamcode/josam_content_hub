import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

const BADGE_TONE = {
  required: "border-rose-200 bg-rose-50 text-rose-700",
  optional: "border-border bg-canvas text-muted",
  later: "border-sky-200 bg-sky-50 text-sky-700",
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5 10 17 19 7.5" />
    </svg>
  );
}

export function PublishChecklist({ content }) {
  const [checked, setChecked] = useState(() => new Set());

  const toggle = (i) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const reset = () => setChecked(new Set());

  const total = content.items.length;
  const done = checked.size;
  const percent = useMemo(
    () => (total === 0 ? 0 : Math.round((done / total) * 100)),
    [done, total]
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {content.eyebrow}
        </span>
        <h2 className="font-display text-2xl leading-tight text-ink">
          {content.title}
        </h2>
        <p className="text-sm text-muted">{content.subtitle}</p>
      </div>

      <Card padding="lg" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            {content.progress(done, total)}
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            {content.reset}
          </Button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${percent}%` }}
            aria-hidden="true"
          />
        </div>

        <ul className="flex flex-col divide-y divide-border">
          {content.items.map((item, i) => {
            const isChecked = checked.has(i);
            return (
              <li
                key={item.label}
                className="flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  onClick={() => toggle(i)}
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                    isChecked
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-border bg-surface text-transparent hover:border-ink/30"
                  )}
                >
                  <CheckIcon />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        "text-sm",
                        isChecked
                          ? "text-muted line-through"
                          : "font-medium text-ink"
                      )}
                    >
                      {item.label}
                    </p>
                    {item.badge && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em]",
                          BADGE_TONE[item.badge] || BADGE_TONE.optional
                        )}
                      >
                        {content.badges[item.badge] || item.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{item.hint}</p>
                </div>

                {item.link && (
                  <Link
                    to={item.link}
                    className="self-start text-[11px] font-medium text-accent hover:underline"
                  >
                    {item.linkLabel} →
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}
