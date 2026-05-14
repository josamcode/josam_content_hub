import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { PlatformIcon } from "../../../components/ui/PlatformIcon";
import { cn } from "../../../lib/cn";

const PLATFORM_ACCENT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

function MetaRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </span>
      <div className="text-sm text-ink text-right">{children}</div>
    </div>
  );
}

function FieldChips({ values }) {
  if (!Array.isArray(values) || values.length === 0) {
    return <span className="text-sm text-muted">—</span>;
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="rounded-full border border-border bg-canvas px-2 py-0.5 text-[11px] capitalize text-ink"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

export function PlatformSettingsCard({ data }) {
  const accent = PLATFORM_ACCENT[data.platform] || "bg-muted";

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white",
            accent
          )}
        >
          <PlatformIcon platform={data.platform} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl leading-tight text-ink">
              {data.name}
            </h2>
            <Badge tone={data.statusTone || "neutral"}>
              {data.currentStatus}
            </Badge>
          </div>
          {data.summary && (
            <p className="mt-1 text-sm text-muted">{data.summary}</p>
          )}
        </div>
      </header>

      <div className="rounded-xl border border-border bg-canvas/40 px-4 py-2">
        <MetaRow label="Default publish mode">
          <span className="capitalize">{data.defaultPublishMode}</span>
        </MetaRow>
        <MetaRow label="Auto publish">
          <Badge tone={data.autoPublish?.tone || "neutral"}>
            {data.autoPublish?.label || "—"}
          </Badge>
        </MetaRow>
        <MetaRow label="Manual workflow">
          <Badge tone={data.manualWorkflow?.tone || "neutral"}>
            {data.manualWorkflow?.label || "—"}
          </Badge>
        </MetaRow>
        <MetaRow label="Required content fields">
          <FieldChips values={data.requiredFields} />
        </MetaRow>
        <MetaRow label="Optional content fields">
          <FieldChips values={data.optionalFields} />
        </MetaRow>
      </div>

      {(data.notes || data.futurePlan) && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {data.notes && (
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                Notes
              </p>
              <p className="mt-1 text-sm text-ink">{data.notes}</p>
            </div>
          )}
          {data.futurePlan && (
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                Future integration plan
              </p>
              <p className="mt-1 text-sm text-ink">{data.futurePlan}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          Not connected · MVP manual workflow
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          title="Coming later"
        >
          Connect · coming later
        </Button>
      </div>
    </Card>
  );
}
