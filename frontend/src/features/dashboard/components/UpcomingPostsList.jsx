import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { EmptyState } from "../../../components/ui/EmptyState";
import { PlatformBadge } from "./PlatformBadge";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime, formatRelative } from "../utils";

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

function PostRow({ post }) {
  const { t, i18n } = useTranslation(["common", "pages"]);
  const locale = i18n.resolvedLanguage || i18n.language;
  const titleNode = post.contentItemId ? (
    <Link
      to={`/content/${post.contentItemId}`}
      className="truncate text-sm text-ink hover:text-accent"
    >
      {post.contentTitle}
    </Link>
  ) : (
    <span className="truncate text-sm text-ink">{post.contentTitle}</span>
  );

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        {titleNode}
        <p className="mt-0.5 text-[11px] text-muted">
          {formatDateTime(post.scheduledAt, locale)} -{" "}
          {formatRelative(post.scheduledAt, locale)}
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
        {post.contentItemId && (
          <Link
            to={`/content/${post.contentItemId}`}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-ink hover:text-accent"
          >
            {t("open", { ns: "common" })} <ArrowIcon />
          </Link>
        )}
      </div>
    </li>
  );
}

export function UpcomingPostsList({ posts = [] }) {
  const { t } = useTranslation("pages");

  if (!posts.length) {
    return (
      <EmptyState
        title={t("dashboard.empty.nothingOnRunway.title")}
        description={t("dashboard.empty.nothingOnRunway.description")}
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
