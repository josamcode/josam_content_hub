import { Badge } from "../../../components/ui/Badge";
import { formatStatus, statusTone } from "../../../lib/format";
import { WorkflowCard } from "./WorkflowCard";

export function WorkflowColumn({ status, items }) {
  const tone = statusTone(status);
  return (
    <section
      aria-label={`${formatStatus(status)} column`}
      className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl"
    >
      <header className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Badge tone={tone}>{formatStatus(status)}</Badge>
        </div>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] tabular-nums text-muted">
          {items.length}
        </span>
      </header>

      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface/40 px-3 py-6 text-center text-xs text-muted">
            Nothing here
          </p>
        ) : (
          items.map((item) => <WorkflowCard key={item.id} item={item} />)
        )}
      </div>
    </section>
  );
}
