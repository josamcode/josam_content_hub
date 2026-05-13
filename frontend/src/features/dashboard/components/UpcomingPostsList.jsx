import { EmptyState } from "../../../components/ui/EmptyState";
import { PlatformBadge } from "./PlatformBadge";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime, formatRelative } from "../utils";

function PostRow({ post }) {
  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{post.contentTitle}</p>
        <p className="mt-0.5 text-[11px] text-muted">
          {formatDateTime(post.scheduledAt)} · {formatRelative(post.scheduledAt)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PlatformBadge platform={post.platform} />
        <StatusBadge status={post.status} />
        {post.publishMode && (
          <span className="rounded-full border border-border bg-canvas px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted">
            {post.publishMode}
          </span>
        )}
      </div>
    </li>
  );
}

export function UpcomingPostsList({ posts = [] }) {
  if (!posts.length) {
    return (
      <EmptyState
        title="Nothing on the runway"
        description="Schedule a post from your content library to fill this list."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {posts.map((post) => (
        <PostRow key={post.id} post={post} />
      ))}
    </ul>
  );
}
