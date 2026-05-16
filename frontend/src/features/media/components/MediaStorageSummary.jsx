import { Card } from "../../../components/ui/Card";
import { formatFileSize, formatMediaType } from "../lib/mediaFormat";

const TYPES = ["video", "thumbnail", "image", "attachment"];

function SummaryCard({ label, value, helper, tone = "neutral" }) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50"
        : "";

  return (
    <Card padding="md" className={toneClass}>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl leading-none text-ink">
        {value}
      </p>
      {helper ? <p className="mt-2 text-xs text-muted">{helper}</p> : null}
    </Card>
  );
}

export function MediaStorageSummary({ summary, isLoading }) {
  const countsByType = summary?.countsByType || {};
  const sizeByType = summary?.sizeByType || {};

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padding="md" className="animate-pulse">
            <div className="h-3 w-24 rounded bg-canvas" />
            <div className="mt-3 h-7 w-16 rounded bg-canvas" />
            <div className="mt-3 h-3 w-32 rounded bg-canvas" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <SummaryCard
          label="DB media"
          value={(summary?.totalDbMediaCount || 0).toLocaleString()}
          helper={formatFileSize(summary?.totalDbFileSizeBytes || 0)}
        />
        <SummaryCard
          label="Upload volume"
          value={formatFileSize(summary?.uploadDirectorySizeBytes)}
          helper={
            summary?.uploadDirectorySizeError ||
            (summary?.uploadDirectorySizeIsUserScoped
              ? "User-owned upload folders"
              : "Best effort")
          }
        />
        <SummaryCard
          label="Missing"
          value={(summary?.missingFileCount || 0).toLocaleString()}
          helper="DB records whose files are missing"
          tone={summary?.missingFileCount ? "warning" : "neutral"}
        />
        <SummaryCard
          label="Deleted"
          value={(summary?.deletedMediaCount || 0).toLocaleString()}
          helper="Soft-deleted records kept for history"
          tone={summary?.deletedMediaCount ? "danger" : "neutral"}
        />
      </div>

      <Card padding="md">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {TYPES.map((type) => (
            <div key={type} className="rounded-lg border border-border bg-canvas/40 p-3">
              <p className="text-xs font-medium text-ink">
                {formatMediaType(type)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {(countsByType[type] || 0).toLocaleString()} files -{" "}
                {formatFileSize(sizeByType[type] || 0)}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
