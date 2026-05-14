import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

const TONE_STYLES = {
  critical: {
    card: "border-rose-300 bg-rose-50",
    badge: "bg-rose-500 text-white",
    label: "text-rose-700",
    cta: "text-rose-700 hover:text-rose-800",
  },
  warning: {
    card: "border-amber-300 bg-amber-50",
    badge: "bg-amber-500 text-white",
    label: "text-amber-800",
    cta: "text-amber-800 hover:text-amber-900",
  },
  accent: {
    card: "border-accent/30 bg-accent-soft",
    badge: "bg-accent text-white",
    label: "text-accent",
    cta: "text-accent hover:underline",
  },
  neutral: {
    card: "border-border bg-canvas/50",
    badge: "bg-ink text-canvas",
    label: "text-muted",
    cta: "text-ink hover:text-accent",
  },
};

function ArrowIcon() {
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
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

function ActionCard({ action }) {
  const tone = TONE_STYLES[action.tone] || TONE_STYLES.neutral;
  return (
    <Card
      padding="md"
      className={cn("flex h-full flex-col gap-3 border", tone.card)}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "text-[11px] font-medium uppercase tracking-[0.16em]",
            tone.label
          )}
        >
          {action.eyebrow}
        </p>
        {action.count !== undefined && (
          <span
            className={cn(
              "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-[11px] font-semibold tabular-nums",
              tone.badge
            )}
          >
            {action.count}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-display text-base leading-tight text-ink">
          {action.title}
        </h3>
        {action.message && (
          <p className="text-xs leading-relaxed text-ink/80">
            {action.message}
          </p>
        )}
      </div>

      <Link
        to={action.to}
        className={cn(
          "inline-flex w-fit items-center gap-1 text-xs font-medium",
          tone.cta
        )}
      >
        {action.cta || "Open"}
        <ArrowIcon />
      </Link>
    </Card>
  );
}

function buildActions(data, t) {
  const stats = data?.stats || {};
  const reminders = stats.reminders || {};
  const schedules = stats.schedules || {};
  const needsAttention = Array.isArray(data?.needsAttention)
    ? data.needsAttention
    : [];

  const overdueCount = reminders.overdue || 0;
  const todayCount = reminders.pendingToday || 0;
  const failedSchedulesCount = schedules.failed || 0;

  const readyNotScheduledCount = needsAttention.filter(
    (item) => item.type === "ready_not_scheduled"
  ).length;
  const draftsMissingTextCount = needsAttention.filter(
    (item) => item.type === "draft_platform_missing_text"
  ).length;
  const failedPostsCount = needsAttention.filter(
    (item) => item.type === "failed_platform_post"
  ).length;
  const failureCount = failedSchedulesCount + failedPostsCount;

  const actions = [];

  if (overdueCount > 0) {
    actions.push({
      key: "overdue",
      tone: "critical",
      eyebrow: t("dashboard.actionCenter.actions.overdue.eyebrow"),
      title: t("dashboard.actionCenter.actions.overdue.title"),
      message: t("dashboard.actionCenter.actions.overdue.message", {
        count: overdueCount,
      }),
      count: overdueCount,
      to: "/reminders",
      cta: t("dashboard.actions.openReminders"),
    });
  }

  if (failureCount > 0) {
    actions.push({
      key: "failed",
      tone: "critical",
      eyebrow: t("dashboard.actionCenter.actions.failed.eyebrow"),
      title: t("dashboard.actionCenter.actions.failed.title"),
      message: t("dashboard.actionCenter.actions.failed.message"),
      count: failureCount,
      to: "/publish-logs",
      cta: t("dashboard.actions.openPublishLogs"),
    });
  }

  if (todayCount > 0) {
    actions.push({
      key: "today",
      tone: "warning",
      eyebrow: t("dashboard.actionCenter.actions.today.eyebrow"),
      title: t("dashboard.actionCenter.actions.today.title"),
      message: t("dashboard.actionCenter.actions.today.message", {
        count: todayCount,
      }),
      count: todayCount,
      to: "/reminders",
      cta: t("dashboard.actions.openReminders"),
    });
  }

  if (readyNotScheduledCount > 0) {
    actions.push({
      key: "ready-not-scheduled",
      tone: "warning",
      eyebrow: t("dashboard.actionCenter.actions.readyNotScheduled.eyebrow"),
      title: t("dashboard.actionCenter.actions.readyNotScheduled.title"),
      message: t("dashboard.actionCenter.actions.readyNotScheduled.message"),
      count: readyNotScheduledCount,
      to: "/workflow",
      cta: t("dashboard.actions.openWorkflowBoard"),
    });
  }

  if (draftsMissingTextCount > 0) {
    actions.push({
      key: "drafts-missing-text",
      tone: "accent",
      eyebrow: t("dashboard.actionCenter.actions.draftsMissingText.eyebrow"),
      title: t("dashboard.actionCenter.actions.draftsMissingText.title"),
      message: t("dashboard.actionCenter.actions.draftsMissingText.message"),
      count: draftsMissingTextCount,
      to: "/workflow",
      cta: t("dashboard.actions.openWorkflowBoard"),
    });
  }

  return actions;
}

export function ActionCenter({ data }) {
  const { t } = useTranslation("pages");
  const actions = buildActions(data, t);

  if (actions.length === 0) {
    return (
      <Card padding="md" className="border-emerald-200 bg-emerald-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-700">
              {t("dashboard.actionCenter.title")}
            </p>
            <p className="mt-1 text-sm text-emerald-900">
              {t("dashboard.actionCenter.calmMessage")}
            </p>
          </div>
          <Link
            to="/workflow"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
          >
            {t("dashboard.actions.openWorkflowBoard")} <ArrowIcon />
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg leading-tight text-ink">
          {t("dashboard.actionCenter.title")}
        </h2>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          {t("dashboard.actionCenter.itemsToHandle", {
            count: actions.length,
          })}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <ActionCard key={action.key} action={action} />
        ))}
      </div>
    </section>
  );
}
