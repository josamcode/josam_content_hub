import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

function Bar({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-canvas",
        className
      )}
    />
  );
}

function StatSkeleton() {
  return (
    <Card padding="md" className="flex flex-col gap-5">
      <Bar className="h-3 w-20" />
      <Bar className="h-10 w-24" />
      <Bar className="h-3 w-32" />
    </Card>
  );
}

function SectionSkeleton({ rows = 3 }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <Bar className="h-4 w-40" />
        <Bar className="mt-2 h-3 w-56" />
      </div>
      <div className="flex flex-col gap-3 px-5 py-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex flex-1 flex-col gap-2">
              <Bar className="h-3 w-3/5" />
              <Bar className="h-3 w-2/5" />
            </div>
            <Bar className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-border pb-6">
        <Bar className="h-3 w-32" />
        <Bar className="mt-3 h-9 w-56" />
        <Bar className="mt-3 h-3 w-72" />
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionSkeleton />
        <SectionSkeleton />
      </section>

      <SectionSkeleton rows={4} />
      <SectionSkeleton rows={4} />
    </div>
  );
}
