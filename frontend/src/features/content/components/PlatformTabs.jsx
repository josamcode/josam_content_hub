import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { extractErrorMessage } from "../../../lib/axios";
import { cn } from "../../../lib/cn";
import { formatPlatform, formatStatus, statusTone } from "../../../lib/format";
import { FacebookPostForm } from "./composer/FacebookPostForm";
import { InstagramPostForm } from "./composer/InstagramPostForm";
import { TikTokPostForm } from "./composer/TikTokPostForm";
import { YouTubePostForm } from "./composer/YouTubePostForm";
import { usePlatformPosts } from "../hooks/usePlatformPosts";

const PLATFORM_DOT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

const FORMS = {
  youtube: YouTubePostForm,
  instagram: InstagramPostForm,
  tiktok: TikTokPostForm,
  facebook: FacebookPostForm,
};

const STATUS_TONE_CLASS = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  accent: "bg-accent",
  neutral: "bg-muted",
};

function statusDotClass(status) {
  return STATUS_TONE_CLASS[statusTone(status)] || STATUS_TONE_CLASS.neutral;
}

function TabsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-28 animate-pulse rounded-full bg-canvas"
          />
        ))}
      </div>
      <Card padding="lg">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded-md bg-canvas" />
          ))}
        </div>
      </Card>
    </div>
  );
}

export function PlatformTabs({ contentItemId, initialPlatform }) {
  const { data, isLoading, isError, error, refetch } = usePlatformPosts(contentItemId);
  const [activePlatform, setActivePlatform] = useState(initialPlatform || null);

  const posts = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  useEffect(() => {
    if (!posts.length) {
      setActivePlatform(null);
      return;
    }
    const stillValid = posts.find((p) => p.platform === activePlatform);
    if (!stillValid) {
      setActivePlatform(posts[0].platform);
    }
  }, [posts, activePlatform]);

  if (isLoading) return <TabsSkeleton />;

  if (isError) {
    return (
      <Card padding="lg" className="border-danger/30 bg-danger/5">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
          Couldn't load platform versions
        </p>
        <p className="mt-2 text-sm text-ink">
          {extractErrorMessage(error, "Unexpected error.")}
        </p>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        title="No platform versions yet"
        description="Set target platforms during content creation to spin up per-platform drafts."
      />
    );
  }

  const activePost = posts.find((p) => p.platform === activePlatform) || posts[0];
  const FormComponent = FORMS[activePost.platform];

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Platform versions"
        className="flex flex-wrap gap-2"
      >
        {posts.map((post) => {
          const isActive = post.platform === activePost.platform;
          return (
            <button
              key={post.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActivePlatform(post.platform)}
              className={cn(
                "group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                isActive
                  ? "border-ink/40 bg-ink text-canvas"
                  : "border-border bg-surface text-ink hover:border-ink/20 hover:bg-canvas"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  PLATFORM_DOT[post.platform] || "bg-muted",
                  isActive && "shadow-[0_0_0_2px_var(--color-canvas)]"
                )}
              />
              <span className="font-medium">{formatPlatform(post.platform)}</span>
              <span
                aria-label={formatStatus(post.status)}
                className={cn(
                  "ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em]",
                  isActive
                    ? "bg-canvas/15 text-canvas/90"
                    : "bg-canvas text-muted"
                )}
              >
                <span
                  className={cn("h-1 w-1 rounded-full", statusDotClass(post.status))}
                />
                {formatStatus(post.status)}
              </span>
            </button>
          );
        })}
      </div>

      <Card padding="lg" className="flex flex-col gap-5">
        {FormComponent ? (
          <FormComponent
            key={activePost.id}
            post={activePost}
            contentItemId={contentItemId}
          />
        ) : (
          <p className="text-sm text-muted">
            No editor available for {formatPlatform(activePost.platform)} yet.
          </p>
        )}
      </Card>
    </div>
  );
}
