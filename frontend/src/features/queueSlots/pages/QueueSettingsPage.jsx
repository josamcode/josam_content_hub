import { useMemo } from "react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { PLATFORMS } from "../../../lib/format";
import { QueuePlatformSection } from "../components/QueuePlatformSection";
import { QueueSlotSkeleton } from "../components/QueueSlotSkeleton";
import { useQueueSlots } from "../hooks/useQueueSlots";

const PLATFORM_ORDER = ["tiktok", "instagram", "youtube", "facebook"].filter((p) =>
  PLATFORMS.includes(p)
);

function groupByPlatform(slots) {
  const map = new Map(PLATFORM_ORDER.map((p) => [p, []]));
  for (const slot of slots) {
    if (!map.has(slot.platform)) map.set(slot.platform, []);
    map.get(slot.platform).push(slot);
  }
  for (const [, list] of map) {
    list.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.timeOfDay.localeCompare(b.timeOfDay);
    });
  }
  return map;
}

function ErrorBlock({ message, onRetry }) {
  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        Couldn't load queue slots
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

export function QueueSettingsPage() {
  const { data, isLoading, isError, error, refetch } = useQueueSlots({
    active: true,
  });

  const grouped = useMemo(() => groupByPlatform(data || []), [data]);
  const totalSlots = data?.length || 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Settings"
        title="Queue Settings"
        subtitle="Fixed posting times for each platform."
      />

      <Card padding="md" className="bg-ink text-canvas">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-canvas/70">
          Heads up
        </p>
        <p className="mt-2 text-sm leading-relaxed text-canvas/85">
          Queue slots are templates. They do not publish or schedule content
          automatically yet — use them as reusable posting times when you plan
          content manually.
        </p>
      </Card>

      {isLoading ? (
        <QueueSlotSkeleton count={4} />
      ) : isError ? (
        <ErrorBlock
          message={extractErrorMessage(
            error,
            "We couldn't reach the API just now."
          )}
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {totalSlots === 0 && (
            <EmptyState
              title="No queue slots yet."
              description="Add fixed posting times to plan content faster."
            />
          )}

          <div className="flex flex-col gap-4">
            {PLATFORM_ORDER.map((platform) => (
              <QueuePlatformSection
                key={platform}
                platform={platform}
                slots={grouped.get(platform) || []}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
