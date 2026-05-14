import { Card } from "../../../components/ui/Card";

export function WeeklyRoutine({ content }) {
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

      <Card padding="lg">
        <ol className="flex flex-col">
          {content.days.map((entry, i) => (
            <li
              key={entry.day}
              className="grid grid-cols-[auto_1fr] items-start gap-4 border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0"
            >
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[12px] font-medium text-canvas">
                  {i + 1}
                </span>
                {i < content.days.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="mt-1 h-full min-h-[1.5rem] w-px bg-border"
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                    {entry.day}
                  </p>
                  <h3 className="text-sm font-semibold text-ink">
                    {entry.focus}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-muted">{entry.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}
