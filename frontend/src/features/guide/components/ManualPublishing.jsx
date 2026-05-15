import { Card } from "../../../components/ui/Card";

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
      className="text-muted rtl:rotate-180"
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

export function ManualPublishing({ content }) {
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
        <ol className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2">
          {content.steps.map((step, i) => (
            <li key={step.label} className="flex flex-1 items-stretch gap-2">
              <div className="flex flex-1 flex-col gap-1 rounded-xl border border-border bg-canvas/40 p-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                  {`Step ${i + 1}`}
                </span>
                <p className="text-sm font-medium text-ink">{step.label}</p>
                <p className="text-xs leading-relaxed text-muted">
                  {step.body}
                </p>
              </div>
              {i < content.steps.length - 1 && (
                <div className="flex items-center justify-center">
                  <ArrowRightIcon />
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700">
            {content.why.title}
          </p>
          <p className="mt-1 text-sm text-amber-900">{content.why.body}</p>
        </div>
      </Card>
    </section>
  );
}
