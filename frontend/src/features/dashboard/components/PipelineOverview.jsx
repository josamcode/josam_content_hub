import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

const PIPELINE_STAGES = [
  { status: "idea", label: "Idea" },
  { status: "scripted", label: "Scripted" },
  { status: "recorded", label: "Recorded" },
  { status: "edited", label: "Edited" },
  { status: "ready", label: "Ready" },
  { status: "scheduled", label: "Scheduled" },
  { status: "published", label: "Published" },
];

const TONE_BY_STATUS = {
  idea: "bg-canvas text-ink",
  scripted: "bg-canvas text-ink",
  recorded: "bg-canvas text-ink",
  edited: "bg-canvas text-ink",
  ready: "bg-accent-soft text-accent",
  scheduled: "bg-amber-50 text-amber-700",
  published: "bg-emerald-50 text-emerald-700",
};

function ArrowIcon() {
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
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

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

export function PipelineOverview({ contentCounts = {} }) {
  const { t } = useTranslation(["pages", "status"]);
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 1024;
  });

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="pipeline-overview-content"
          className="group flex flex-1 items-center gap-2 text-start"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              {t("dashboard.sections.pipeline.eyebrow", { ns: "pages" })}
            </p>
            <h2 className="font-display text-lg leading-tight text-ink">
              {t("dashboard.sections.pipeline.title", { ns: "pages" })}
            </h2>
          </div>
          <ChevronIcon open={open} />
        </button>
        <Button as={Link} to="/workflow" variant="outline" size="sm">
          {t("dashboard.actions.openWorkflowBoard", { ns: "pages" })}
          <ArrowIcon />
        </Button>
      </div>

      {open && (
        <div
          id="pipeline-overview-content"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7"
        >
          {PIPELINE_STAGES.map((stage) => {
            const count = contentCounts[stage.status] || 0;
            const tone = TONE_BY_STATUS[stage.status] || "bg-canvas text-ink";
            return (
              <div
                key={stage.status}
                className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-3"
              >
                <span className="text-[11px] uppercase tracking-wide text-muted">
                  {t(stage.status, { ns: "status", defaultValue: stage.label })}
                </span>
                <span
                  className={cn(
                    "inline-flex h-7 w-fit items-center justify-center rounded-md px-2 text-base font-semibold tabular-nums",
                    tone
                  )}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
