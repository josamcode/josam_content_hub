import { useState } from "react";

import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
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

function ConceptCard({ card, content }) {
  const [open, setOpen] = useState(false);
  return (
    <Card padding="none" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-canvas/40",
          open ? "border-b border-border" : "border-b border-transparent"
        )}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink">{card.name}</h3>
          <p className="mt-1 text-sm text-muted">{card.def}</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
          <span className="hidden sm:inline">
            {open ? content.collapse : content.expand}
          </span>
          <ChevronIcon open={open} />
        </div>
      </button>
      {open && (
        <div className="px-4 py-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-canvas/40 p-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                {content.example}
              </p>
              <p className="mt-1 text-sm text-ink">{card.example}</p>
            </div>
            <div className="rounded-lg border border-border bg-canvas/40 p-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                {content.where}
              </p>
              <p className="mt-1 text-sm text-ink">{card.where}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function ConceptCards({ content }) {
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {content.cards.map((card) => (
          <ConceptCard key={card.name} card={card} content={content} />
        ))}
      </div>
    </section>
  );
}
