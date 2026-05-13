import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

function Bar({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-canvas", className)} />;
}

function CardSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      <Bar className="aspect-[16/9] w-full rounded-none rounded-t-2xl" />
      <div className="flex flex-col gap-3 p-5">
        <div className="flex gap-2">
          <Bar className="h-5 w-16 rounded-full" />
          <Bar className="h-5 w-24 rounded-full" />
        </div>
        <Bar className="h-5 w-4/5" />
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-3/5" />
        <div className="flex gap-2 pt-2">
          <Bar className="h-5 w-16 rounded-full" />
          <Bar className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <Bar className="h-3 w-24" />
          <Bar className="h-3 w-12" />
        </div>
      </div>
    </Card>
  );
}

export function ContentLibrarySkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
