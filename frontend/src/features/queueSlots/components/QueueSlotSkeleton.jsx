import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

function Bar({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-canvas", className)} />;
}

function PlatformSectionSkeleton() {
  return (
    <Card padding="lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bar className="h-7 w-7 rounded-full" />
          <Bar className="h-5 w-28" />
        </div>
        <Bar className="h-8 w-20 rounded-md" />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Bar className="h-14 w-full rounded-xl" />
        <Bar className="h-14 w-full rounded-xl" />
      </div>
    </Card>
  );
}

export function QueueSlotSkeleton({ count = 4 }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PlatformSectionSkeleton key={i} />
      ))}
    </div>
  );
}
