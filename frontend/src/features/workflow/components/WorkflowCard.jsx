import { Link } from "react-router-dom";

import { Card } from "../../../components/ui/Card";
import { Select } from "../../../components/ui/Select";
import { extractErrorMessage } from "../../../lib/axios";
import { cn } from "../../../lib/cn";
import {
  formatCategory,
  formatDate,
  formatPlatform,
} from "../../../lib/format";
import { useUpdateContentItem } from "../../content/hooks/useUpdateContentItem";
import { WORKFLOW_STATUS_OPTIONS } from "../lib/workflow";

const PLATFORM_TONES = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

function PlatformDot({ platform }) {
  return (
    <span
      title={formatPlatform(platform)}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-canvas px-1.5 py-0.5 text-[10px] text-ink"
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          PLATFORM_TONES[platform] || "bg-muted"
        )}
      />
      {formatPlatform(platform)}
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

export function WorkflowCard({ item }) {
  const platforms = Array.isArray(item.platforms) ? item.platforms : [];

  const mutation = useUpdateContentItem(item.id);

  const handleStatusChange = (event) => {
    const nextStatus = event.target.value;
    if (!nextStatus || nextStatus === item.status) return;
    mutation.mutate({ status: nextStatus });
  };

  const updating = mutation.isPending;
  const errorMessage = mutation.isError
    ? extractErrorMessage(mutation.error, "Couldn't update status.")
    : null;

  return (
    <Card padding="none" className="flex flex-col overflow-hidden">
      <Link
        to={`/content/${item.id}`}
        className="group flex flex-col gap-2 px-3 pt-3"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-border bg-canvas px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
            {formatCategory(item.category)}
          </span>
        </div>
        <h3 className="line-clamp-2 font-display text-[15px] leading-snug text-ink transition group-hover:text-accent">
          {item.title || "Untitled"}
        </h3>
        {item.hook && (
          <p className="line-clamp-2 text-xs text-muted">{item.hook}</p>
        )}
      </Link>

      <div className="flex flex-col gap-2 px-3 pt-2 pb-3">
        {platforms.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {platforms.map((platform) => (
              <PlatformDot key={platform} platform={platform} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>Created {formatDate(item.createdAt)}</span>
          <Link
            to={`/content/${item.id}`}
            className="inline-flex items-center gap-1 font-medium text-ink hover:text-accent"
          >
            Open
            <ArrowIcon />
          </Link>
        </div>

        <div className="pt-1">
          <Select
            label="Move to"
            options={WORKFLOW_STATUS_OPTIONS}
            value={item.status}
            onChange={handleStatusChange}
            disabled={updating}
          />
          {updating && (
            <p className="mt-1 text-[11px] text-muted">Updating status…</p>
          )}
          {errorMessage && (
            <p className="mt-1 rounded-md border border-danger/30 bg-danger/5 px-2 py-1 text-[11px] text-ink">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
