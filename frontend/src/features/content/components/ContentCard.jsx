import { Link } from "react-router-dom";

import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";
import {
  formatCategory,
  formatDate,
  formatPlatform,
  formatStatus,
  statusTone,
} from "../../../lib/format";
import { ContentThumbnail } from "./ContentThumbnail";

function PlatformDot({ platform }) {
  const TONES = {
    youtube: "bg-rose-500",
    instagram: "bg-fuchsia-500",
    facebook: "bg-sky-500",
    tiktok: "bg-zinc-900",
  };
  return (
    <span
      title={formatPlatform(platform)}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-ink"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", TONES[platform] || "bg-muted")} />
      {formatPlatform(platform)}
    </span>
  );
}

function ArrowIcon() {
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
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

export function ContentCard({ item }) {
  const platforms = Array.isArray(item.platforms) ? item.platforms : [];

  return (
    <Card
      padding="none"
      className="group flex h-full flex-col overflow-hidden transition hover:border-ink/20"
    >
      <ContentThumbnail title={item.title} category={item.category} />

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(item.status)}>{formatStatus(item.status)}</Badge>
          <span className="rounded-full border border-border bg-canvas px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted">
            {formatCategory(item.category)}
          </span>
        </div>

        <div className="flex-1">
          <h3 className="font-display text-xl leading-snug text-ink">
            {item.title || "Untitled"}
          </h3>
          {item.hook && (
            <p className="mt-2 line-clamp-2 text-sm text-muted">{item.hook}</p>
          )}
        </div>

        {platforms.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((platform) => (
              <PlatformDot key={platform} platform={platform} />
            ))}
          </div>
        ) : (
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            No platforms set
          </p>
        )}

        <div className="mt-1 flex items-center justify-between border-t border-border pt-4 text-xs text-muted">
          <span>Created {formatDate(item.createdAt)}</span>
          <Link
            to={`/content/${item.id}`}
            className="inline-flex items-center gap-1 font-medium text-ink transition group-hover:gap-2 hover:text-accent"
          >
            Open
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </Card>
  );
}
