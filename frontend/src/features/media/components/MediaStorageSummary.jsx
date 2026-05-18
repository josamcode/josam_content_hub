import { useTranslation } from "react-i18next";

import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";
import { formatFileSize } from "../lib/mediaFormat";

const TYPES = ["video", "thumbnail", "image", "attachment"];

function StatCard({ label, value, helper, tone = "neutral" }) {
  const palette = {
    neutral: "",
    warning: "border-amber-200/60 bg-amber-50/50",
    danger: "border-rose-200/60 bg-rose-50/50",
  };

  return (
    <Card
      padding="md"
      className={cn(
        "flex flex-col justify-between transition",
        palette[tone] || ""
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-[28px] leading-none text-ink">
        {value}
      </p>
      {helper ? (
        <p className="mt-2 text-[11px] leading-relaxed text-muted">{helper}</p>
      ) : null}
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card padding="md" className="animate-pulse">
      <div className="mb-3 h-3 w-20 rounded bg-canvas" />
      <div className="h-8 w-16 rounded bg-canvas" />
      <div className="mt-3 h-3 w-28 rounded bg-canvas" />
    </Card>
  );
}

function TypeBreakdownRow({ type, count, size, t }) {
  const countLabel =
    count === 1
      ? t("mediaLibrary.fileCount", { count })
      : t("mediaLibrary.filesCount", { count });

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-canvas/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink">
          {t(`mediaLibrary.types.${type}`, type)}
        </span>
        <span className="text-xs text-muted">{countLabel}</span>
      </div>
      <span className="text-sm tabular-nums text-ink">{formatFileSize(size)}</span>
    </div>
  );
}

export function MediaStorageSummary({ summary, isLoading }) {
  const { t } = useTranslation("pages");
  const countsByType = summary?.countsByType || {};
  const sizeByType = summary?.sizeByType || {};

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("mediaLibrary.summary.dbMedia")}
          value={(summary?.totalDbMediaCount || 0).toLocaleString()}
          helper={t("mediaLibrary.summary.dbMediaHelper")}
        />
        <StatCard
          label={t("mediaLibrary.summary.uploadVolume")}
          value={formatFileSize(summary?.uploadDirectorySizeBytes)}
          helper={
            summary?.uploadDirectorySizeError ||
            (summary?.uploadDirectorySizeIsUserScoped
              ? t("mediaLibrary.summary.uploadVolumeUserScoped")
              : t("mediaLibrary.summary.uploadVolumeBestEffort"))
          }
        />
        <StatCard
          label={t("mediaLibrary.summary.missing")}
          value={(summary?.missingFileCount || 0).toLocaleString()}
          helper={t("mediaLibrary.summary.missingHelper")}
          tone={summary?.missingFileCount ? "warning" : "neutral"}
        />
        <StatCard
          label={t("mediaLibrary.summary.deleted")}
          value={(summary?.deletedMediaCount || 0).toLocaleString()}
          helper={t("mediaLibrary.summary.deletedHelper")}
          tone={summary?.deletedMediaCount ? "danger" : "neutral"}
        />
      </div>

      <Card padding="md">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
          {t("mediaLibrary.summary.byType")}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map((type) => (
            <TypeBreakdownRow
              key={type}
              type={type}
              count={countsByType[type] || 0}
              size={sizeByType[type] || 0}
              t={t}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
