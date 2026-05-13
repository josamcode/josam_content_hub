import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

function Bar({ className }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-canvas", className)} />
  );
}

function ReminderCardSkeleton() {
  return (
    <Card padding="lg">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Bar className="h-5 w-16 rounded-full" />
          <Bar className="h-5 w-20 rounded-full" />
        </div>
        <Bar className="h-3 w-28" />
      </div>
      <Bar className="mt-4 h-6 w-3/5" />
      <Bar className="mt-2 h-3 w-2/5" />
      <Bar className="mt-4 h-3 w-full" />
      <Bar className="mt-2 h-3 w-5/6" />
      <Bar className="mt-2 h-3 w-3/5" />
      <div className="mt-4 flex gap-2">
        <Bar className="h-5 w-16 rounded-full" />
        <Bar className="h-5 w-12 rounded-full" />
        <Bar className="h-5 w-14 rounded-full" />
      </div>
      <Bar className="mt-5 h-10 w-full rounded-lg" />
    </Card>
  );
}

export function ReminderListSkeleton({ count = 3 }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ReminderCardSkeleton key={i} />
      ))}
    </div>
  );
}
