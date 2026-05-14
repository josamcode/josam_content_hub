import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { useAuth } from "../../auth/hooks/useAuth";
import { useDashboard } from "../hooks/useDashboard";
import { ActionCenter } from "../components/ActionCenter";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { NeedsAttentionList } from "../components/NeedsAttentionList";
import { PipelineOverview } from "../components/PipelineOverview";
import { RecentAttemptsList } from "../components/RecentAttemptsList";
import { ReminderList } from "../components/ReminderList";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { UpcomingPostsList } from "../components/UpcomingPostsList";

function sumValues(record) {
  if (!record) return 0;
  return Object.values(record).reduce(
    (acc, value) => acc + (typeof value === "number" ? value : 0),
    0
  );
}

function getRefreshLabel(isFetching, tCommon) {
  return isFetching ? tCommon("refreshing") : tCommon("refresh");
}

function SectionLinkAction({ to, children }) {
  return (
    <Button as={Link} to={to} variant="outline" size="sm">
      {children}
    </Button>
  );
}

function ErrorState({ message, onRetry }) {
  const { t } = useTranslation(["common", "pages"]);

  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        {t("dashboard.error.title", { ns: "pages" })}
      </p>
      <p className="mt-2 text-sm text-ink">{message}</p>
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("tryAgain", { ns: "common" })}
        </Button>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { t } = useTranslation(["common", "pages"]);
  const { user } = useAuth();
  const { data, isLoading, isError, error, isFetching, refetch } =
    useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow={
            user?.name
              ? `${t("dashboard.hello", { ns: "pages" })}, ${user.name.split(" ")[0]}`
              : t("dashboard.hello", { ns: "pages" })
          }
          title={t("dashboard.title", { ns: "pages" })}
          subtitle={t("dashboard.subtitle", { ns: "pages" })}
        />
        <ErrorState
          message={extractErrorMessage(
            error,
            t("dashboard.error.fallback", { ns: "pages" })
          )}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const stats = data?.stats || {};
  const content = stats.contentItems || {};
  const schedules = stats.schedules || {};
  const reminders = stats.reminders || {};
  const publishing = stats.publishing || {};

  const ideasCount = content.idea || 0;
  const readyCount = content.ready || 0;
  const scheduledCount =
    (schedules.scheduled || 0) + (schedules.manualPending || 0);
  const publishedThisMonth = publishing.publishedOrManualDoneThisMonth || 0;
  const failedThisMonth = publishing.failedAttemptsThisMonth || 0;

  const draftPlatformCount = stats.platformPosts?.draft || 0;
  const archivedCount = content.archived || 0;

  const totalInPipeline = sumValues({
    idea: content.idea,
    scripted: content.scripted,
    recorded: content.recorded,
    edited: content.edited,
    ready: content.ready,
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={
          user?.name
            ? `${t("dashboard.hello", { ns: "pages" })}, ${user.name.split(" ")[0]}`
            : t("dashboard.hello", { ns: "pages" })
        }
        title={t("dashboard.title", { ns: "pages" })}
        subtitle={t("dashboard.subtitle", { ns: "pages" })}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            loading={isFetching}
          >
            {getRefreshLabel(isFetching, t)}
          </Button>
        }
      />

      <ActionCenter data={data} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title={t("dashboard.sections.todayReminders.title", { ns: "pages" })}
          description={t("dashboard.sections.todayReminders.description", { ns: "pages" })}
          count={data?.todayReminders?.length}
          countTone={reminders.pendingToday ? "accent" : "neutral"}
          action={
            <SectionLinkAction to="/reminders">
              {t("dashboard.actions.openReminders", { ns: "pages" })}
            </SectionLinkAction>
          }
        >
          <ReminderList
            reminders={data?.todayReminders}
            variant="today"
          />
        </SectionCard>

        <SectionCard
          title={t("dashboard.sections.overdue.title", { ns: "pages" })}
          description={t("dashboard.sections.overdue.description", { ns: "pages" })}
          count={data?.overdueReminders?.length}
          countTone={data?.overdueReminders?.length ? "danger" : "neutral"}
          action={
            <SectionLinkAction to="/reminders">
              {t("dashboard.actions.openReminders", { ns: "pages" })}
            </SectionLinkAction>
          }
          className={
            data?.overdueReminders?.length ? "border-rose-200 bg-rose-50/40" : ""
          }
        >
          <ReminderList
            reminders={data?.overdueReminders}
            variant="overdue"
          />
        </SectionCard>
      </section>

      <SectionCard
        title={t("dashboard.sections.needsAttention.title", { ns: "pages" })}
        description={t("dashboard.sections.needsAttention.description", { ns: "pages" })}
        count={data?.needsAttention?.length}
        countTone={data?.needsAttention?.length ? "warning" : "neutral"}
        action={
          <SectionLinkAction to="/workflow">
            {t("dashboard.actions.openWorkflow", { ns: "pages" })}
          </SectionLinkAction>
        }
      >
        <NeedsAttentionList items={data?.needsAttention} />
      </SectionCard>

      <SectionCard
        title={t("dashboard.sections.upcomingPosts.title", { ns: "pages" })}
        description={t("dashboard.sections.upcomingPosts.description", { ns: "pages" })}
        count={data?.upcomingPosts?.length}
        countTone="neutral"
        action={
          <SectionLinkAction to="/calendar">
            {t("dashboard.actions.openCalendar", { ns: "pages" })}
          </SectionLinkAction>
        }
      >
        <UpcomingPostsList posts={data?.upcomingPosts} />
      </SectionCard>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("dashboard.stats.ideas.label", { ns: "pages" })}
          value={ideasCount}
          helper={
            totalInPipeline > 0
              ? t("dashboard.stats.ideas.helperWithCount", { ns: "pages", count: totalInPipeline })
              : t("dashboard.stats.ideas.helperEmpty", { ns: "pages" })
          }
        />
        <StatCard
          label={t("dashboard.stats.ready.label", { ns: "pages" })}
          value={readyCount}
          helper={
            draftPlatformCount > 0
              ? t("dashboard.stats.ready.helperWithCount", { ns: "pages", count: draftPlatformCount })
              : t("dashboard.stats.ready.helperEmpty", { ns: "pages" })
          }
        />
        <StatCard
          label={t("dashboard.stats.scheduled.label", { ns: "pages" })}
          value={scheduledCount}
          helper={
            schedules.manualPending
              ? t("dashboard.stats.scheduled.helperManual", { ns: "pages", count: schedules.manualPending })
              : t("dashboard.stats.scheduled.helperEmpty", { ns: "pages" })
          }
        />
        <StatCard
          accent
          label={t("dashboard.stats.publishedThisMonth.label", { ns: "pages" })}
          value={publishedThisMonth}
          trend={
            failedThisMonth > 0
              ? t("dashboard.stats.publishedThisMonth.trendFailed", { ns: "pages", count: failedThisMonth })
              : t("dashboard.stats.publishedThisMonth.trendOnTrack", { ns: "pages" })
          }
          helper={
            failedThisMonth > 0
              ? t("dashboard.stats.publishedThisMonth.helperFailed", { ns: "pages", count: failedThisMonth })
              : t("dashboard.stats.publishedThisMonth.helperEmpty", { ns: "pages" })
          }
        />
      </section>

      <PipelineOverview contentCounts={content} />

      <SectionCard
        title={t("dashboard.sections.recentAttempts.title", { ns: "pages" })}
        description={t("dashboard.sections.recentAttempts.description", { ns: "pages" })}
        count={data?.recentPublishAttempts?.length}
        countTone="neutral"
        action={
          <SectionLinkAction to="/publish-logs">
            {t("dashboard.actions.openPublishLogs", { ns: "pages" })}
          </SectionLinkAction>
        }
      >
        <RecentAttemptsList attempts={data?.recentPublishAttempts} />
      </SectionCard>

      {archivedCount > 0 && (
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted">
          {t("dashboard.archivedHidden", { ns: "pages", count: archivedCount })}
        </p>
      )}
    </div>
  );
}
