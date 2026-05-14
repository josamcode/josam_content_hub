import { useMemo } from "react";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Spinner } from "../../../components/ui/Spinner";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { PlatformSettingsCard } from "../components/PlatformSettingsCard";
import { usePlatformSettings } from "../hooks/usePlatformSettings";
import {
  INTEGRATION_ROADMAP,
  PLATFORM_ORDER,
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

function sortSettings(list) {
  const index = new Map(PLATFORM_ORDER.map((p, i) => [p, i]));
  return [...list].sort((a, b) => {
    const aIdx = index.has(a.platform) ? index.get(a.platform) : 99;
    const bIdx = index.has(b.platform) ? index.get(b.platform) : 99;
    return aIdx - bIdx;
  });
}

function LoadingState() {
  return (
    <Card padding="lg" className="flex items-center justify-center gap-3">
      <Spinner size="md" />
      <p className="text-sm text-muted">Loading platform settings…</p>
    </Card>
  );
}

function ErrorBlock({ message, onRetry }) {
  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        Couldn't load platform settings
      </p>
      <p className="mt-2 text-sm text-ink">{message}</p>
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Card>
  );
}

export function PlatformSettingsPage() {
  const { data, isLoading, isError, error, refetch } = usePlatformSettings();

  const sorted = useMemo(() => sortSettings(data || []), [data]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Settings"
        title="Platform Settings"
        subtitle="Defaults and templates per platform."
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
              Defaults only
            </p>
            <p className="mt-1 text-sm">
              These settings store defaults and templates per platform. They
              don't connect OAuth accounts, don't auto-publish, and don't create
              platform accounts. Publishing stays manual-first until official
              integrations land.
            </p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorBlock
          message={extractErrorMessage(
            error,
            "We couldn't reach the API just now."
          )}
          onRetry={() => refetch()}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No platform settings yet."
          description="Settings will be created automatically the first time you load this page."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          }
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {sorted.map((setting) => (
            <PlatformSettingsCard key={setting.platform} setting={setting} />
          ))}
        </section>
      )}

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
