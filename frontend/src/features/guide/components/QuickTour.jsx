import { forwardRef, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

export const QuickTour = forwardRef(function QuickTour({ content }, ref) {
  const [index, setIndex] = useState(0);
  const steps = content.steps;
  const step = steps[index];
  const total = steps.length;

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(total - 1, i + 1));

  return (
    <section ref={ref} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {content.eyebrow}
        </span>
        <h2 className="font-display text-2xl leading-tight text-ink">
          {content.title}
        </h2>
        <p className="text-sm text-muted">{content.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setIndex(i)}
            aria-pressed={i === index}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
              i === index
                ? "border-ink bg-ink text-canvas"
                : i < index
                  ? "border-border bg-canvas text-ink"
                  : "border-border bg-surface text-muted hover:text-ink"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                i === index
                  ? "bg-canvas/15 text-canvas"
                  : "bg-canvas text-ink"
              )}
            >
              {i + 1}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      <Card padding="lg" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              {`Step ${index + 1} / ${total}`}
            </p>
            <h3 className="font-display text-xl leading-tight text-ink">
              {step.label}
            </h3>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-ink/90">{step.body}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-canvas/40 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              {content.page}
            </p>
            <Link
              to={step.page}
              className="mt-1 inline-flex text-sm font-medium text-accent hover:underline"
            >
              {step.pageLabel} →
            </Link>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700">
              {content.done}
            </p>
            <p className="mt-1 text-sm text-emerald-900">{step.done}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={index === 0}
          >
            ← {content.prev}
          </Button>
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {index + 1} / {total}
          </span>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={goNext}
            disabled={index === total - 1}
          >
            {content.next} →
          </Button>
        </div>
      </Card>
    </section>
  );
});
