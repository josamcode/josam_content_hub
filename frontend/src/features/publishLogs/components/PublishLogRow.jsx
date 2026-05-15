import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Badge } from "../../../components/ui/Badge";
import { cn } from "../../../lib/cn";
import { formatDateTime, formatPlatform } from "../../../lib/format";
import { attemptStatusLabel, attemptStatusTone } from "../lib/attemptStatus";

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

function PlatformChip({ platform }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-ink whitespace-nowrap">
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          PLATFORM_DOT[platform] || "bg-muted"
        )}
      />
      {formatPlatform(platform)}
    </span>
  );
}

export function PublishLogRow({ attempt }) {
  const { t, i18n } = useTranslation(["common", "pages"]);
  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";
  const date = formatDateTime(attempt.attemptedAt, locale);
  const publishMode = attempt.publishMode
    ? t(`publishLogs.publishModes.${attempt.publishMode}`, {
        ns: "pages",
        defaultValue: attempt.publishMode,
      })
    : "-";
  const failedErrorMessage =
    attempt.status === "failed" ? attempt.errorMessage : null;

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-canvas/50">
      <td className="px-4 py-3 align-top">
        <Link
          to={`/content/${attempt.contentItemId}`}
          className="font-medium text-ink hover:underline line-clamp-2"
        >
          {attempt.contentTitle || t("untitled", { ns: "common" })}
        </Link>
        <p className="mt-0.5 text-[11px] text-muted sm:hidden">{date}</p>
        {attempt.status === "failed" && (
          <p className="mt-1 max-w-md text-xs text-danger/90 line-clamp-2">
            <span className="font-medium">
              {t("publishLogs.errorDetails", { ns: "pages" })}:{" "}
            </span>
            {failedErrorMessage ||
              t("publishLogs.noErrorDetails", { ns: "pages" })}
          </p>
        )}
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <PlatformChip platform={attempt.platform} />
      </td>
      <td className="hidden px-4 py-3 align-top sm:table-cell">
        <span className="text-sm capitalize text-ink">{publishMode}</span>
      </td>
      <td className="px-4 py-3 align-top">
        <Badge tone={attemptStatusTone(attempt.status)}>
          {attemptStatusLabel(attempt.status, t)}
        </Badge>
      </td>
      <td className="hidden px-4 py-3 align-top text-sm text-muted whitespace-nowrap sm:table-cell">
        {date}
      </td>
      <td className="px-4 py-3 align-top text-end">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            to={`/content/${attempt.contentItemId}`}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-ink transition hover:border-ink/20"
          >
            {t("openContent", { ns: "common" })}
          </Link>
          {attempt.platformPostUrl ? (
            <a
              href={attempt.platformPostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-accent transition hover:border-accent/30"
            >
              {t("publishLogs.actions.openPost", { ns: "pages" })}{" "}
              <ExternalIcon />
            </a>
          ) : (
            <span className="text-[11px] text-muted">-</span>
          )}
        </div>
      </td>
    </tr>
  );
}
