import { Badge } from "../../../components/ui/Badge";
import { Card, CardDescription, CardTitle } from "../../../components/ui/Card";
import { PageHeader } from "../../../components/shared/PageHeader";
import { useAuth } from "../../auth/hooks/useAuth";

const SUMMARY_TILES = [
  {
    key: "ideas",
    label: "Ideas",
    description: "Sparks waiting to grow into drafts.",
    tone: "neutral",
  },
  {
    key: "ready",
    label: "Ready",
    description: "Polished and waiting for a slot.",
    tone: "accent",
  },
  {
    key: "scheduled",
    label: "Scheduled",
    description: "On the calendar, queued to publish.",
    tone: "warning",
  },
  {
    key: "published",
    label: "Published",
    description: "Out in the world. Out of your head.",
    tone: "success",
  },
];

function SummaryCard({ tile }) {
  return (
    <Card padding="md" className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            {tile.label}
          </p>
          <p className="mt-3 font-display text-4xl leading-none text-ink">
            —
          </p>
        </div>
        <Badge tone={tile.tone}>Pending</Badge>
      </div>
      <p className="text-sm leading-relaxed text-muted">{tile.description}</p>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={user?.name ? `Hello, ${user.name.split(" ")[0]}` : "Hello"}
        title="Dashboard"
        subtitle="Your content machine today."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_TILES.map((tile) => (
          <SummaryCard key={tile.key} tile={tile} />
        ))}
      </section>

      <Card padding="lg" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>What you'll see here next</CardTitle>
            <CardDescription className="mt-1">
              Once the dashboard API is wired up, this space will show your real numbers, your reminders for today, and the next pieces moving toward publish.
            </CardDescription>
          </div>
          <Badge tone="accent">Phase 2.2</Badge>
        </div>
        <ul className="mt-2 grid grid-cols-1 gap-2 text-sm text-muted sm:grid-cols-2">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Live counts for ideas, ready, scheduled and published
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Today's reminders surfaced at the top
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Next scheduled content with platform tags
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Quick links into Content Library and Calendar
          </li>
        </ul>
      </Card>
    </div>
  );
}
