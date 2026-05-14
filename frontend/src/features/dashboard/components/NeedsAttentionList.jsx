import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { EmptyState } from "../../../components/ui/EmptyState";
import { PlatformBadge } from "./PlatformBadge";
import { cn } from "../../../lib/cn";
import { attentionTypeTitle } from "../utils";

const SEVERITY_DOT = {
  critical: "bg-rose-500",
  warning: "bg-amber-500",
};

function SeverityRail({ severity }) {
  return (
    <span
      className={cn(
        "absolute start-0 top-0 h-full w-[3px] rounded-e-full",
        severity === "critical" ? "bg-rose-500" : "bg-amber-400"
      )}
      aria-hidden="true"
    />
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

function AttentionRow({ item }) {
  const { t } = useTranslation(["common", "pages", "status"]);
  const dotTone = SEVERITY_DOT[item.severity] || SEVERITY_DOT.warning;
  const canOpen = Boolean(item.contentItemId);

  return (
    <li className="relative grid grid-cols-1 gap-3 py-3 pe-2 ps-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <SeverityRail severity={item.severity} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full", dotTone)} />
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
            {attentionTypeTitle(item.type, t)}
          </p>
        </div>
        <p className="mt-1 truncate text-sm text-ink">{item.title}</p>
        <p className="mt-0.5 text-xs text-muted">{item.message}</p>
      </div>
      <PlatformBadge platform={item.platform} />
      {canOpen ? (
        <Link
          to={`/content/${item.contentItemId}`}
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-ink hover:text-accent"
        >
          {t("openContent", { ns: "common" })}
          <ArrowIcon />
        </Link>
      ) : (
        <span className="text-[11px] text-muted/70">
          {t("noLink", { ns: "common" })}
        </span>
      )}
    </li>
  );
}

export function NeedsAttentionList({ items = [] }) {
  const { t } = useTranslation("pages");

  if (!items.length) {
    return (
      <EmptyState
        title={t("dashboard.empty.everythingInOrder.title")}
        description={t("dashboard.empty.everythingInOrder.description")}
      />
    );
  }

  const ordered = [...items].sort((a, b) => {
    const score = (s) => (s === "critical" ? 0 : 1);
    return score(a.severity) - score(b.severity);
  });

  return (
    <ul className="divide-y divide-border">
      {ordered.map((item, idx) => (
        <AttentionRow
          key={`${item.type}-${item.platformPostId}-${item.reminderId || idx}`}
          item={item}
        />
      ))}
    </ul>
  );
}
