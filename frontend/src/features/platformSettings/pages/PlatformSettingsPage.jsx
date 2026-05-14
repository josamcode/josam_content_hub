import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { PageHeader } from "../../../components/shared/PageHeader";
import { PlatformSettingsCard } from "../components/PlatformSettingsCard";
import {
  INTEGRATION_ROADMAP,
  PLATFORM_SETTINGS,
} from "../lib/platformSettings";

function InfoIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01" />
      <path d="M11 12h1v5h1" />
    </svg>
  );
}

export function PlatformSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Settings"
        title="Platform Settings"
        subtitle="Platform defaults and publishing strategy."
      />

      <Card padding="md" className="border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3 text-amber-900">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white"
          >
            <InfoIcon />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em]">
              Read-only
            </p>
            <p className="mt-1 text-sm">
              Platform settings are read-only in this MVP. Publishing is
              manual-first until official integrations are added.
            </p>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {PLATFORM_SETTINGS.map((platform) => (
          <PlatformSettingsCard key={platform.platform} data={platform} />
        ))}
      </section>

      <Card padding="lg">
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            What's next
          </p>
          <h2 className="font-display text-xl leading-tight text-ink">
            Integration roadmap
          </h2>
          <p className="text-sm text-muted">
            The order we expect real platform integrations to land. Dates aren't
            promised — manual workflow stays the default until each one ships.
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {INTEGRATION_ROADMAP.map((step, idx) => (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-xl border border-border bg-canvas/40 p-3"
            >
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-medium text-canvas"
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-ink">{step.title}</p>
                  <Badge tone={step.tone || "neutral"}>{step.status}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
