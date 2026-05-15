import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/ui/Button";
import { extractErrorMessage } from "../../../lib/axios";
import { cn } from "../../../lib/cn";
import { useDeleteQueueSlot } from "../hooks/useDeleteQueueSlot";
import { dayName, formatTime12h } from "../lib/queueSlotConstants";
import { QueueSlotForm } from "./QueueSlotForm";

function ClockIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function QueueSlotCard({ slot }) {
  const { t } = useTranslation(["common", "pages"]);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  const deleteMutation = useDeleteQueueSlot(slot.id, {
    onSuccess: () => {
      setError(null);
      setConfirming(false);
    },
    onError: (err) => {
      setError(
        extractErrorMessage(
          err,
          t("queueSettings.slotCard.deactivateErrorFallback", { ns: "pages" })
        )
      );
    },
  });

  if (editing) {
    return (
      <QueueSlotForm
        mode="edit"
        slot={slot}
        onCancel={() => setEditing(false)}
        onSuccess={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-surface p-4",
        "sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-canvas text-muted"
        >
          <ClockIcon />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg leading-tight text-ink">
            {t(`queueSettings.days.${slot.dayOfWeek}`, {
              ns: "pages",
              defaultValue: dayName(slot.dayOfWeek),
            })}{" "}
            - {formatTime12h(slot.timeOfDay)}
          </p>
          <p className="text-xs text-muted">
            {t("queueSettings.slotCard.timezoneAndTime", {
              ns: "pages",
              timezone: slot.timezone,
              time: slot.timeOfDay,
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {confirming ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-sm text-amber-900">
            <span className="text-[11px] uppercase tracking-[0.16em]">
              {t("queueSettings.slotCard.confirmDeactivate", { ns: "pages" })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={deleteMutation.isPending}
            >
              {t("queueSettings.actions.keep", { ns: "pages" })}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending
                ? t("queueSettings.actions.deactivating", { ns: "pages" })
                : t("queueSettings.actions.confirm", { ns: "pages" })}
            </Button>
          </div>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              {t("edit", { ns: "common" })}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setError(null);
                setConfirming(true);
              }}
            >
              {t("queueSettings.actions.deactivate", { ns: "pages" })}
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="basis-full rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            {t("queueSettings.slotCard.deactivateErrorTitle", { ns: "pages" })}
          </p>
          <p className="mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
