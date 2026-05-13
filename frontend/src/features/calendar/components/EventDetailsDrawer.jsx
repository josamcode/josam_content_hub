import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { extractErrorMessage } from "../../../lib/axios";
import { cn } from "../../../lib/cn";
import { formatScheduledAtInTimezone } from "../../../lib/datetime";
import {
  formatPlatform,
  formatStatus,
  statusTone,
} from "../../../lib/format";
import { cancelSchedule } from "../api/calendarApi";

const PLATFORM_DOT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M6 18 18 6" />
    </svg>
  );
}

function MetaRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </span>
      <div className="text-sm text-ink text-right">{children}</div>
    </div>
  );
}

export function EventDetailsDrawer({ event, open, onClose }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!open) {
      setConfirming(false);
      setFeedback(null);
    }
  }, [open, event?.id]);

  useEffect(() => {
    setConfirming(false);
    setFeedback(null);
  }, [event?.id]);

  const cancelMutation = useMutation({
    mutationFn: () => cancelSchedule(event?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      if (event?.contentItemId) {
        queryClient.invalidateQueries({
          queryKey: ["content-item", event.contentItemId],
        });
      }
      if (event?.platformPostId) {
        queryClient.invalidateQueries({
          queryKey: ["platform-posts", event.contentItemId],
        });
        queryClient.setQueryData(
          ["schedule-for-platform-post", event.platformPostId],
          null
        );
      }
      setFeedback({ tone: "success", message: "Schedule cancelled." });
      setConfirming(false);
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: extractErrorMessage(
          error,
          "We couldn't cancel this schedule just now."
        ),
      });
    },
  });

  const cancelled = event?.status === "cancelled" || feedback?.tone === "success";
  const cancelling = cancelMutation.isPending;

  return (
    <div
      className={cn(
        "fixed inset-0 z-30",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/30 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Schedule details"
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-canvas shadow-xl transition-transform duration-200 ease-out",
          "sm:w-[420px]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              Scheduled event
            </p>
            <h2 className="mt-1 font-display text-xl leading-tight text-ink line-clamp-2">
              {event?.contentTitle || "Untitled"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted transition hover:bg-canvas hover:text-ink"
          >
            <XIcon />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {event && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-ink">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      PLATFORM_DOT[event.platform] || "bg-muted"
                    )}
                  />
                  {formatPlatform(event.platform)}
                </span>
                <Badge tone={statusTone(event.status)}>
                  {formatStatus(event.status)}
                </Badge>
              </div>

              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <MetaRow label="Scheduled at">
                  <p className="font-medium text-ink">
                    {formatScheduledAtInTimezone(
                      event.scheduledAt,
                      event.timezone
                    )}
                  </p>
                  <p className="text-[11px] text-muted">{event.timezone}</p>
                </MetaRow>
                <MetaRow label="Publish mode">
                  <span className="capitalize">{event.publishMode || "manual"}</span>
                </MetaRow>
                <MetaRow label="Schedule status">
                  <Badge tone={statusTone(event.status)}>
                    {formatStatus(event.status)}
                  </Badge>
                </MetaRow>
                <MetaRow label="Platform post status">
                  <Badge tone={statusTone(event.platformPostStatus)}>
                    {formatStatus(event.platformPostStatus)}
                  </Badge>
                </MetaRow>
              </div>

              {feedback && (
                <div
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm",
                    feedback.tone === "error"
                      ? "border-danger/30 bg-danger/5 text-ink"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  )}
                >
                  {feedback.tone === "error" && (
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
                      Cancel failed
                    </p>
                  )}
                  <p className={feedback.tone === "error" ? "mt-1" : undefined}>
                    {feedback.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="border-t border-border bg-surface px-5 py-4">
          {event ? (
            <div className="flex flex-col gap-2">
              {!cancelled && (
                <>
                  {confirming ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      <p className="font-medium">Cancel this schedule?</p>
                      <p className="mt-1 text-[12px] text-amber-900/80">
                        Reminder will be cancelled. The platform post returns to
                        ready and can be rescheduled.
                      </p>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirming(false)}
                          disabled={cancelling}
                        >
                          Keep schedule
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          loading={cancelling}
                          onClick={() => cancelMutation.mutate()}
                        >
                          {cancelling ? "Cancelling" : "Yes, cancel"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setFeedback(null);
                        setConfirming(true);
                      }}
                    >
                      Cancel schedule
                    </Button>
                  )}
                </>
              )}

              <div className="flex items-center gap-2">
                <Button
                  as={Link}
                  to={`/content/${event.contentItemId}`}
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={onClose}
                >
                  Open content
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              Close
            </Button>
          )}
        </footer>
      </aside>
    </div>
  );
}
