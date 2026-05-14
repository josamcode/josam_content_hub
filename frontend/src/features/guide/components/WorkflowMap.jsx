import { useState } from "react";

import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

const TONE_BY_STATUS = {
  idea: "bg-canvas text-ink",
  scripted: "bg-canvas text-ink",
  recorded: "bg-canvas text-ink",
  edited: "bg-canvas text-ink",
  ready: "bg-accent-soft text-accent",
  scheduled: "bg-amber-50 text-amber-700",
  published: "bg-emerald-50 text-emerald-700",
};

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-muted"
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

export function WorkflowMap({ content }) {
  const stages = content.stages;
  const [activeIndex, setActiveIndex] = useState(0);
  const active = stages[activeIndex];

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

      <Card padding="lg" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          {stages.map((stage, i) => (
            <div key={stage.status} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-pressed={i === activeIndex}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  i === activeIndex
                    ? "border-ink bg-ink text-canvas"
                    : "border-border bg-surface text-ink hover:border-ink/20 hover:bg-canvas"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-fit items-center justify-center rounded-md px-1.5 text-[10px] font-medium uppercase tracking-wide",
                    i === activeIndex
                      ? "bg-canvas/15 text-canvas/90"
                      : TONE_BY_STATUS[stage.status] || "bg-canvas text-ink"
                  )}
                >
                  {i + 1}
                </span>
                <span>{stage.label}</span>
              </button>
              {i < stages.length - 1 && (
                <span className="hidden sm:inline">
                  <ArrowRightIcon />
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-canvas/40 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              Meaning
            </p>
            <p className="mt-1 text-sm text-ink">{active.meaning}</p>
          </div>
          <div className="rounded-xl border border-border bg-canvas/40 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              Typical action
            </p>
            <p className="mt-1 text-sm text-ink">{active.action}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700">
              Common mistake
            </p>
            <p className="mt-1 text-sm text-amber-900">{active.mistake}</p>
          </div>
        </div>
      </Card>
    </section>
  );
}
