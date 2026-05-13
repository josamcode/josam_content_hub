import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { cn } from "../../../lib/cn";
import {
  formatDateTime,
  formatPlatform,
  formatStatus,
  statusTone,
} from "../../../lib/format";

const PLATFORM_DOT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

function ExternalIcon() {
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
      <path d="M14 4h6v6" />
      <path d="M10 14 20 4" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function PostCard({ post }) {
  const hasTitle = Boolean(post.title?.trim());
  const hasCaption = Boolean(post.caption?.trim());
  const hashtagCount = Array.isArray(post.hashtags) ? post.hashtags.length : 0;
  const tagCount = Array.isArray(post.tags) ? post.tags.length : 0;

  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-white text-[11px] font-semibold leading-none",
              PLATFORM_DOT[post.platform] || "bg-muted"
            )}
            aria-hidden="true"
          >
            {formatPlatform(post.platform).charAt(0)}
          </span>
          <div>
            <p className="text-sm font-medium text-ink">
              {formatPlatform(post.platform)}
            </p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
              Updated {formatDateTime(post.updatedAt)}
            </p>
          </div>
        </div>
        <Badge tone={statusTone(post.status)}>{formatStatus(post.status)}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
        <p
          className={cn(
            "line-clamp-2",
            hasTitle ? "text-ink" : "text-muted/80 italic"
          )}
        >
          {hasTitle ? post.title : "No platform title yet"}
        </p>
        <p
          className={cn(
            "line-clamp-2",
            hasCaption ? "text-muted" : "text-muted/70 italic"
          )}
        >
          {hasCaption ? post.caption : "No caption yet"}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {hashtagCount > 0 && (
          <span className="rounded-full border border-border bg-canvas px-2 py-0.5 text-[11px] text-muted">
            {hashtagCount} hashtag{hashtagCount === 1 ? "" : "s"}
          </span>
        )}
        {tagCount > 0 && (
          <span className="rounded-full border border-border bg-canvas px-2 py-0.5 text-[11px] text-muted">
            {tagCount} tag{tagCount === 1 ? "" : "s"}
          </span>
        )}
        {post.platformPostUrl ? (
          <a
            href={post.platformPostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
          >
            View live <ExternalIcon />
          </a>
        ) : null}
      </div>
    </li>
  );
}

export function PlatformPostsSummary({ posts = [] }) {
  if (!posts.length) {
    return (
      <EmptyState
        title="No platform versions yet"
        description="Add target platforms to this idea to spin up per-platform drafts."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </ul>
  );
}
