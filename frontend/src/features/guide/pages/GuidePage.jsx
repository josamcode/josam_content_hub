import { Card } from "../../../components/ui/Card";
import { PageHeader } from "../../../components/shared/PageHeader";

export function GuidePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Support"
        title="Guide coming soon"
        subtitle="A full learning center for JoSam Content Hub will be added in the next phase."
      />

      <Card padding="lg">
        <p className="text-sm leading-relaxed text-muted">
          The guide will walk through how Content Items, Platform Posts,
          Schedules, Reminders, and Publish Logs fit together — plus a
          recommended weekly routine and common pitfalls. Check back soon.
        </p>
      </Card>
    </div>
  );
}
