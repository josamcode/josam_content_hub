import { useState } from "react";

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

function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false);
  return (
    <Card padding="none" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-start justify-between gap-3 px-4 py-3 text-start transition hover:bg-canvas/40",
          open ? "border-b border-border" : "border-b border-transparent"
        )}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-canvas text-[11px] font-medium text-muted"
          >
            {index + 1}
          </span>
          <h3 className="text-sm font-medium text-ink">{item.q}</h3>
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="px-4 py-3">
          <p className="text-sm leading-relaxed text-ink/90">{item.a}</p>
        </div>
      )}
    </Card>
  );
}

export function GuideFAQ({ content }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {content.eyebrow}
        </span>
        <h2 className="font-display text-2xl leading-tight text-ink">
          {content.title}
        </h2>
      </div>
      <div className="flex flex-col gap-2">
        {content.items.map((item, i) => (
          <FAQItem key={item.q} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
