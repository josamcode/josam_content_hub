import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

function Bar({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-canvas", className)} />;
}

function CardSkeleton({ rows = 3 }) {
  return (
    <Card padding="lg">
      <Bar className="h-4 w-40" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Bar key={i} className="h-3 w-full" />
        ))}
      </div>
    </Card>
  );
}

export function ContentDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="border-b border-border pb-6">
        <Bar className="h-3 w-24" />
        <Bar className="mt-3 h-9 w-3/5" />
        <div className="mt-3 flex gap-2">
          <Bar className="h-5 w-20 rounded-full" />
          <Bar className="h-5 w-28 rounded-full" />
        </div>
      </div>
      <CardSkeleton rows={4} />
      <CardSkeleton rows={6} />
      <CardSkeleton rows={3} />
    </div>
  );
}
