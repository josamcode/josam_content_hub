import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import {
  formatDateTime,
  formatPlatform,
  formatRelative,
  formatStatus,
  statusTone,
} from "../../../lib/format";

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

export function PublishHistorySummary({ attempts = [] }) {
  if (!attempts.length) {
    return (
      <EmptyState
        title="No publish attempts yet"
        description="Manual and automatic publish actions will appear here."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {attempts.map((attempt) => {
        const platform = attempt.platform || attempt.platformPost?.platform;
        const url = attempt.platformPostUrl || attempt.platformPost?.platformPostUrl;

        return (
          <li
            key={attempt.id}
            className="grid grid-cols-1 gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1.4fr_auto_auto_auto] sm:items-center sm:gap-4"
          >
            <div className="min-w-0">
              <p className="text-sm text-ink">
                {formatPlatform(platform)}
                {attempt.publishMode ? (
                  <span className="text-muted"> · {attempt.publishMode}</span>
                ) : null}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {formatDateTime(attempt.attemptedAt)} ·{" "}
                {formatRelative(attempt.attemptedAt)}
              </p>
            </div>
            <Badge tone={statusTone(attempt.status)}>
              {formatStatus(attempt.status)}
            </Badge>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
              >
                View <ExternalIcon />
              </a>
            ) : (
              <span className="text-[11px] text-muted">—</span>
            )}
            <span className="hidden sm:inline" />
          </li>
        );
      })}
    </ul>
  );
}
