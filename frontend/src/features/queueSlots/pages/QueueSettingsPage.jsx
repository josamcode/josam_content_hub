import { useMemo } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation(["common", "pages"]);

  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        {t("queueSettings.error.title", { ns: "pages" })}
      </p>
      <p className="mt-2 text-sm text-ink">{message}</p>
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("tryAgain", { ns: "common" })}
        </Button>
      </div>
    </Card>
  );
}

export function QueueSettingsPage() {
  const { t } = useTranslation("pages");
  const { data, isLoading, isError, error, refetch } = useQueueSlots({
    active: true,
  });

  const grouped = useMemo(() => groupByPlatform(data || []), [data]);
  const totalSlots = data?.length || 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("queueSettings.eyebrow")}
        title={t("queueSettings.title")}
        subtitle={t("queueSettings.subtitle")}
      />

      <Card padding="md" className="bg-ink text-canvas">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-canvas/70">
          {t("queueSettings.notice.eyebrow")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-canvas/85">
          {t("queueSettings.notice.body")}
        </p>
      </Card>

      {isLoading ? (
        <QueueSlotSkeleton count={4} />
      ) : isError ? (
        <ErrorBlock
          message={extractErrorMessage(
            error,
            t("queueSettings.error.fallback")
          )}
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {totalSlots === 0 && (
            <EmptyState
              title={t("queueSettings.empty.title")}
              description={t("queueSettings.empty.description")}
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
