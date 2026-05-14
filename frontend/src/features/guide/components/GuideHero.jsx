import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

const TONE_CLASS = {
  neutral: "border-border bg-canvas text-ink",
  accent: "border-accent/30 bg-accent-soft text-accent",
  soft: "border-border bg-surface text-muted",
};

function SparkIcon() {
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
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}

export function GuideHero({ content, lang, onLangChange, onStartTour }) {
  return (
    <Card padding="lg" className="overflow-hidden bg-ink text-canvas">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-canvas/20 bg-canvas/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-canvas/80">
            <SparkIcon />
            {content.eyebrow}
          </span>
          <h1 className="font-display text-3xl leading-tight text-canvas md:text-4xl">
            {content.title}
          </h1>
          <p className="text-sm leading-relaxed text-canvas/75 md:text-base">
            {content.subtitle}
          </p>
        </div>

        <div
          role="group"
          aria-label="Language"
          className="inline-flex items-center gap-1 rounded-full border border-canvas/20 bg-canvas/10 p-1"
        >
          <button
            type="button"
            onClick={() => onLangChange("en")}
            aria-pressed={lang === "en"}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              lang === "en"
                ? "bg-canvas text-ink"
                : "text-canvas/80 hover:text-canvas"
            )}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onLangChange("ar")}
            aria-pressed={lang === "ar"}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              lang === "ar"
                ? "bg-canvas text-ink"
                : "text-canvas/80 hover:text-canvas"
            )}
          >
            عربي
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="accent"
          size="md"
          onClick={onStartTour}
        >
          {content.actions.tour}
        </Button>
        <Button
          as={Link}
          to="/content/new"
          variant="outline"
          size="md"
          className="bg-canvas/10 text-canvas border-canvas/20 hover:bg-canvas/20"
        >
          {content.actions.create}
        </Button>
        <Button
          as={Link}
          to="/dashboard"
          variant="ghost"
          size="md"
          className="text-canvas hover:bg-canvas/10"
        >
          {content.actions.dashboard}
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {content.tags.map((tag) => (
          <div
            key={tag.label}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm",
              TONE_CLASS[tag.tone] || TONE_CLASS.neutral
            )}
          >
            {tag.label}
          </div>
        ))}
      </div>
    </Card>
  );
}
