import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

function WarnIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
      <path d="m12 3 10 18H2L12 3z" />
    </svg>
  );
}

export function DefaultsExplainer({ content }) {
  const [tab, setTab] = useState(content.tabs[0]?.key || "platform");
  const active = content.tabs.find((t) => t.key === tab) || content.tabs[0];

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
        <div
          role="tablist"
          aria-label="Defaults layers"
          className="flex flex-wrap gap-2"
        >
          {content.tabs.map((t) => {
            const isActive = t.key === active.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  isActive
                    ? "border-ink bg-ink text-canvas"
                    : "border-border bg-surface text-ink hover:border-ink/20 hover:bg-canvas"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-canvas/40 p-4">
          <p className="text-sm text-ink">{active.body}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {active.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-ink/90">
                <span
                  aria-hidden="true"
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/60"
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {active.link && (
            <div className="mt-4">
              <Button
                as={Link}
                to={active.link}
                variant="outline"
                size="sm"
              >
                {active.linkLabel}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
            <WarnIcon />
          </span>
          <p>{content.warning}</p>
        </div>
      </Card>
    </section>
  );
}
