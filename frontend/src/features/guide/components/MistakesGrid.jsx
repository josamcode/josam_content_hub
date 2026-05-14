import { Card } from "../../../components/ui/Card";

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

function XIcon() {
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
      <path d="M6 6l12 12M6 18 18 6" />
    </svg>
  );
}

function MistakeList({ items, tone }) {
  const isDo = tone === "do";
  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span
          className={
            isDo
              ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"
              : "inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white"
          }
        >
          {isDo ? <CheckIcon /> : <XIcon />}
        </span>
        <h3 className="text-sm font-semibold text-ink">
          {isDo ? "Do" : "Don't"}
        </h3>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.label}
            className={
              isDo
                ? "rounded-xl border border-emerald-200 bg-emerald-50 p-3"
                : "rounded-xl border border-rose-200 bg-rose-50 p-3"
            }
          >
            <p
              className={
                isDo
                  ? "text-sm font-medium text-emerald-900"
                  : "text-sm font-medium text-rose-900"
              }
            >
              {item.label}
            </p>
            {item.hint && (
              <p
                className={
                  isDo
                    ? "mt-1 text-xs text-emerald-800/80"
                    : "mt-1 text-xs text-rose-800/80"
                }
              >
                {item.hint}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function MistakesGrid({ content }) {
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
        <MistakeList items={content.dos} tone="do" />
        <MistakeList items={content.donts} tone="dont" />
      </div>
    </section>
  );
}
