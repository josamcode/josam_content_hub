import { Link } from "react-router-dom";

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

function getRefreshLabel(isFetching) {
  return isFetching ? "Refreshing" : "Refresh";
}

function SectionLinkAction({ to, children }) {
  return (
    <Button as={Link} to={to} variant="outline" size="sm">
      {children}
    </Button>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        Couldn't load dashboard
      </p>
      <p className="mt-2 text-sm text-ink">{message}</p>
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, isFetching, refetch } =
    useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow={user?.name ? `Hello, ${user.name.split(" ")[0]}` : "Hello"}
          title="Dashboard"
          subtitle="Your content machine today."
        />
        <ErrorState
          message={extractErrorMessage(
            error,
            "We couldn't reach the API just now."
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
        eyebrow={user?.name ? `Hello, ${user.name.split(" ")[0]}` : "Hello"}
        title="Dashboard"
        subtitle="Your content machine today."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            loading={isFetching}
          >
            {getRefreshLabel(isFetching)}
          </Button>
        }
      />

      <ActionCenter data={data} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Today's reminders"
          description="Things you asked yourself to handle today."
          count={data?.todayReminders?.length}
          countTone={reminders.pendingToday ? "accent" : "neutral"}
          action={
            <SectionLinkAction to="/reminders">Open reminders</SectionLinkAction>
          }
        >
          <ReminderList
            reminders={data?.todayReminders}
            variant="today"
          />
        </SectionCard>

        <SectionCard
          title="Overdue"
          description="Slipped past their window — clear these first."
          count={data?.overdueReminders?.length}
          countTone={data?.overdueReminders?.length ? "danger" : "neutral"}
          action={
            <SectionLinkAction to="/reminders">Open reminders</SectionLinkAction>
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
        title="Needs attention"
        description="Drafts missing text, ready posts without a slot, failed publishes — fix these to keep moving."
        count={data?.needsAttention?.length}
        countTone={data?.needsAttention?.length ? "warning" : "neutral"}
        action={
          <SectionLinkAction to="/workflow">Open workflow</SectionLinkAction>
        }
      >
        <NeedsAttentionList items={data?.needsAttention} />
      </SectionCard>

      <SectionCard
        title="Upcoming posts"
        description="The next pieces moving toward publish."
        count={data?.upcomingPosts?.length}
        countTone="neutral"
        action={
          <SectionLinkAction to="/calendar">Open calendar</SectionLinkAction>
        }
      >
        <UpcomingPostsList posts={data?.upcomingPosts} />
      </SectionCard>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ideas"
          value={ideasCount}
          helper={
            totalInPipeline > 0
              ? `${totalInPipeline} pieces total in the pipeline`
              : "Fresh sparks waiting to be developed."
          }
        />
        <StatCard
          label="Ready"
          value={readyCount}
          helper={
            draftPlatformCount > 0
              ? `${draftPlatformCount} platform drafts still need work`
              : "All polished — nothing waiting on you to draft."
          }
        />
        <StatCard
          label="Scheduled"
          value={scheduledCount}
          helper={
            schedules.manualPending
              ? `${schedules.manualPending} need manual publishing`
              : "Queued and on the calendar."
          }
        />
        <StatCard
          accent
          label="Published this month"
          value={publishedThisMonth}
          trend={failedThisMonth > 0 ? `${failedThisMonth} failed` : "On track"}
          helper={
            failedThisMonth > 0
              ? `${failedThisMonth} attempt${failedThisMonth === 1 ? "" : "s"} failed this month.`
              : "No failed publish attempts this month."
          }
        />
      </section>

      <PipelineOverview contentCounts={content} />

      <SectionCard
        title="Recent publish attempts"
        description="Most recent publish actions across every platform."
        count={data?.recentPublishAttempts?.length}
        countTone="neutral"
        action={
          <SectionLinkAction to="/publish-logs">
            Open publish logs
          </SectionLinkAction>
        }
      >
        <RecentAttemptsList attempts={data?.recentPublishAttempts} />
      </SectionCard>

      {archivedCount > 0 && (
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted">
          {archivedCount} archived item{archivedCount === 1 ? "" : "s"} hidden from this view
        </p>
      )}
    </div>
  );
}
