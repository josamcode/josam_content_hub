import { Card } from "../../../components/ui/Card";

function SkeletonBlock({ className }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-canvas ${className || ""}`}
    />
  );
}

function SkeletonCard() {
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <SkeletonBlock className="h-32 w-full rounded-xl" />
      <div className="flex gap-2">
        <SkeletonBlock className="h-5 w-16 rounded-full" />
        <SkeletonBlock className="h-5 w-20 rounded-full" />
      </div>
      <SkeletonBlock className="h-6 w-3/4" />
      <SkeletonBlock className="h-4 w-full" />
      <div className="flex gap-1.5">
        <SkeletonBlock className="h-5 w-16 rounded-full" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>
    </Card>
  );
}

export function MonthlyPlanSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-9 w-64" />
        <SkeletonBlock className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padding="md" className="flex flex-col gap-2">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-7 w-12" />
            <SkeletonBlock className="h-3 w-24" />
          </Card>
        ))}
      </div>

      <Card padding="md" className="flex flex-col gap-3">
        <SkeletonBlock className="h-9 w-full" />
      </Card>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <SkeletonBlock className="h-5 w-40" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <SkeletonCard key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
