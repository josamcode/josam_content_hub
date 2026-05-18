import { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { Card } from "../../../../components/ui/Card";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { Select } from "../../../../components/ui/Select";
import { TimePicker } from "../../../../components/ui/TimePicker";
import { cn } from "../../../../lib/cn";
import {
  formatPlatform,
  formatStatus,
  statusTone,
} from "../../../../lib/format";
import { formatScheduledAtInTimezone } from "../../../../lib/datetime";
import { useScheduleMatrix } from "../../hooks/useScheduleMatrix";

const PLATFORM_DOT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

const ACTIVE_STATUSES = new Set(["scheduled", "manual_pending", "processing"]);

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5 10 17 19 7.5" />
    </svg>
  );
}

function AlertIcon() {
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
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

function WavesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12h2M6 8h2M6 16h2M10 6h2M10 18h2M14 9h2M14 15h2M18 10h2M18 14h2M22 12h0" />
    </svg>
  );
}

export function ScheduleMatrix({ contentItemId, platformPosts }) {
  const { t } = useTranslation(["common", "pages", "status"]);

  const {
    rows,
    isLoading,
    setRowEnabled,
    setRowDate,
    setRowTime,
    setRowMode,
    saveAll,
    cancelRow,
    applySameDate,
    offsetTimes,
    rowErrors,
    globalError,
    globalSuccess,
    savingRows,
    clearMessages,
  } = useScheduleMatrix({ contentItemId, platformPosts });

  const posts = Array.isArray(platformPosts) ? platformPosts : [];

  useEffect(() => {
    if (!globalSuccess) return;
    const timer = setTimeout(() => clearMessages(), 4000);
    return () => clearTimeout(timer);
  }, [globalSuccess, clearMessages]);

  useEffect(() => {
    if (!globalError) return;
    const timer = setTimeout(() => clearMessages(), 6000);
    return () => clearTimeout(timer);
  }, [globalError, clearMessages]);

  const publishModeOptions = useMemo(
    () => [
      {
        value: "manual",
        label: t("calendar.publishModes.manual", { ns: "pages" }),
      },
      {
        value: "reminder",
        label: t("calendar.publishModes.reminder", { ns: "pages" }),
      },
      {
        value: "auto",
        label: t("calendar.publishModes.auto", { ns: "pages" }),
      },
    ],
    [t]
  );

  const enabledCount = useMemo(
    () => posts.filter((p) => rows[p.id]?.enabled).length,
    [posts, rows]
  );

  if (posts.length === 0) {
    return (
      <Card padding="lg">
        <div className="flex flex-col gap-3">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              {t("contentDetail.scheduleMatrix.title", { ns: "pages" })}
            </span>
            <p className="mt-1 text-sm text-muted">
              {t("contentDetail.scheduleMatrix.description", { ns: "pages" })}
            </p>
          </div>
          <p className="text-sm text-muted">
            {t("contentDetail.scheduleMatrix.emptyPlatforms", { ns: "pages" })}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="flex flex-col gap-5">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            {t("contentDetail.scheduleMatrix.title", { ns: "pages" })}
          </span>
          <p className="mt-1 text-sm text-muted">
            {t("contentDetail.scheduleMatrix.description", { ns: "pages" })}
          </p>
        </div>

        {globalSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckIcon />
            </span>
            {t(`contentDetail.scheduleMatrix.${globalSuccess.code}`, {
              ns: "pages",
              count: globalSuccess.count,
            })}
          </div>
        )}

        {globalError && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-ink">
            <span className="mt-0.5 shrink-0 text-danger">
              <AlertIcon />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
                {t("contentDetail.saveError.title", { ns: "pages" })}
              </p>
              <p className="mt-1">
                {t(`contentDetail.scheduleMatrix.${globalError.code}`, {
                  ns: "pages",
                })}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={applySameDate}
            disabled={enabledCount < 2}
          >
            <CalendarIcon />
            {t("contentDetail.scheduleMatrix.applySameDate", { ns: "pages" })}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={offsetTimes}
            disabled={enabledCount < 2}
          >
            <WavesIcon />
            {t("contentDetail.scheduleMatrix.offsetTimes", { ns: "pages" })}
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={saveAll}
            disabled={enabledCount === 0}
          >
            {t("contentDetail.scheduleMatrix.saveSchedules", { ns: "pages" })}
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Spinner />
            {t("loading", { ns: "common" })}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_72px_1fr_1fr_1fr_auto] gap-3 items-center">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted px-1">
              {t("platform", { ns: "common" })}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted text-center">
              {t("contentDetail.scheduleMatrix.enabled", { ns: "pages" })}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted px-1">
              {t("contentDetail.scheduleMatrix.date", { ns: "pages" })}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted px-1">
              {t("contentDetail.scheduleMatrix.time", { ns: "pages" })}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted px-1">
              {t("contentDetail.scheduleMatrix.mode", { ns: "pages" })}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted px-1">
              {t("contentDetail.scheduleMatrix.currentSchedule", {
                ns: "pages",
              })}
            </span>
          </div>

          {posts.map((post) => {
            const row = rows[post.id];
            if (!row) return null;

            const isSaving = savingRows[post.id] || false;
            const rowError = rowErrors[post.id] || null;
            const hasActiveSchedule =
              row.hasExistingSchedule &&
              row.existingSchedule &&
              ACTIVE_STATUSES.has(row.existingSchedule.status);

            return (
              <MatrixRow
                key={post.id}
                post={post}
                row={row}
                rowError={rowError}
                isSaving={isSaving}
                hasActiveSchedule={hasActiveSchedule}
                publishModeOptions={publishModeOptions}
                onEnabledChange={(enabled) => setRowEnabled(post.id, enabled)}
                onDateChange={(date) => setRowDate(post.id, date)}
                onTimeChange={(time) => setRowTime(post.id, time)}
                onModeChange={(mode) => setRowMode(post.id, mode)}
                onCancel={() => cancelRow(post.id)}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function MatrixRow({
  post,
  row,
  rowError,
  isSaving,
  hasActiveSchedule,
  publishModeOptions,
  onEnabledChange,
  onDateChange,
  onTimeChange,
  onModeChange,
  onCancel,
}) {
  const { t } = useTranslation(["common", "pages", "status"]);
  const isPast =
    row.date &&
    row.time &&
    (() => {
      const d = new Date(`${row.date}T${row.time}:00`);
      return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
    })();

  return (
    <div
      className={cn(
        "group rounded-2xl border transition",
        isSaving ? "border-accent/40 bg-accent-soft/10" : "border-border bg-surface",
        row.enabled ? "" : "opacity-60"
      )}
    >
      {/* Desktop row */}
      <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_72px_1fr_1fr_1fr_auto] gap-3 items-start px-4 py-3">
        {/* Platform */}
        <div className="flex items-center gap-2 pt-2">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              PLATFORM_DOT[post.platform] || "bg-muted"
            )}
          />
          <span className="text-sm font-medium text-ink">
            {formatPlatform(post.platform)}
          </span>
        </div>

        {/* Enabled */}
        <div className="flex justify-center pt-2">
          <label className="inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="sr-only"
              checked={row.enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
            />
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition",
                row.enabled
                  ? "border-ink/40 bg-ink text-canvas"
                  : "border-border bg-surface text-muted hover:border-ink/20"
              )}
            >
              {row.enabled ? (
                <CheckIcon />
              ) : (
                <span className="text-xs">—</span>
              )}
            </span>
          </label>
        </div>

        {/* Date */}
        <DatePicker
          value={row.date}
          onChange={(e) => onDateChange(e.target.value)}
          disabled={!row.enabled}
          placeholder={t("contentDetail.scheduleMatrix.date", { ns: "pages" })}
        />

        {/* Time */}
        <TimePicker
          value={row.time}
          onChange={(e) => onTimeChange(e.target.value)}
          disabled={!row.enabled}
          placeholder={t("contentDetail.scheduleMatrix.time", { ns: "pages" })}
          minuteStep={5}
        />

        {/* Mode */}
        <Select
          options={publishModeOptions}
          value={row.publishMode}
          onChange={(e) => onModeChange(e.target.value)}
          disabled={!row.enabled}
        />

        {/* Status */}
        <div className="flex items-center gap-2 pt-2">
          {isSaving ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
              <Spinner />
              {t("saving", { ns: "common" })}
            </span>
          ) : hasActiveSchedule ? (
            <div className="flex flex-col items-end gap-1">
              <Badge tone="warning">
                {formatStatus(row.existingSchedule.status, t)}
              </Badge>
              <span className="text-[10px] text-muted text-end leading-tight">
                {formatScheduledAtInTimezone(
                  row.existingSchedule.scheduledAt,
                  row.existingSchedule.timezone
                )}
              </span>
            </div>
          ) : (
            <Badge tone={statusTone(post.status)}>
              {formatStatus(post.status, t)}
            </Badge>
          )}

          {hasActiveSchedule && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md p-1 text-muted opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
              title={t("cancel", { ns: "common" })}
            >
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
                <path d="M6 6l12 12M6 18 18 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile card */}
      <div className="flex flex-col gap-3 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                PLATFORM_DOT[post.platform] || "bg-muted"
              )}
            />
            <span className="text-sm font-medium text-ink">
              {formatPlatform(post.platform)}
            </span>
            {isSaving ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                <Spinner />
              </span>
            ) : hasActiveSchedule ? (
              <Badge tone="warning">
                {formatStatus(row.existingSchedule.status, t)}
              </Badge>
            ) : (
              <Badge tone={statusTone(post.status)}>
                {formatStatus(post.status, t)}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveSchedule && (
              <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                {t("cancel", { ns: "common" })}
              </Button>
            )}
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="sr-only"
                checked={row.enabled}
                onChange={(e) => onEnabledChange(e.target.checked)}
              />
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition",
                  row.enabled
                    ? "border-ink/40 bg-ink text-canvas"
                    : "border-border bg-surface text-muted hover:border-ink/20"
                )}
              >
                {row.enabled ? <CheckIcon /> : <span className="text-xs">—</span>}
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            value={row.date}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={!row.enabled}
            placeholder={t("contentDetail.scheduleMatrix.date", {
              ns: "pages",
            })}
          />
          <TimePicker
            value={row.time}
            onChange={(e) => onTimeChange(e.target.value)}
            disabled={!row.enabled}
            placeholder={t("contentDetail.scheduleMatrix.time", {
              ns: "pages",
            })}
            minuteStep={5}
          />
        </div>

        <Select
          options={publishModeOptions}
          value={row.publishMode}
          onChange={(e) => onModeChange(e.target.value)}
          disabled={!row.enabled}
        />

        {hasActiveSchedule && row.existingSchedule && (
          <p className="text-xs text-muted">
            {formatScheduledAtInTimezone(
              row.existingSchedule.scheduledAt,
              row.existingSchedule.timezone
            )}
          </p>
        )}

        {isPast && row.enabled && (
          <p className="text-xs text-amber-700">
            {t("contentDetail.scheduleMatrix.pastWarning", { ns: "pages" })}
          </p>
        )}
      </div>

      {/* Row error */}
      {rowError && (
        <div className="border-t border-danger/20 bg-danger/5 px-4 py-2 text-xs text-danger rounded-b-2xl">
          {rowError}
        </div>
      )}

      {/* Past warning on desktop */}
      {isPast && row.enabled && !rowError && (
        <div className="hidden md:block border-t border-amber-200 bg-amber-50 px-4 py-1.5 text-[10px] uppercase tracking-wide text-amber-700 rounded-b-2xl">
          {t("contentDetail.scheduleMatrix.pastWarning", { ns: "pages" })}
        </div>
      )}
    </div>
  );
}
