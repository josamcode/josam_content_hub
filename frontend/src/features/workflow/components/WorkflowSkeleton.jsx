import { cn } from "../../../lib/cn";

function Bar({ className }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-canvas", className)} />
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3">
      <Bar className="h-4 w-20 rounded-full" />
      <Bar className="h-4 w-4/5" />
      <Bar className="h-3 w-3/5" />
      <div className="flex gap-1 pt-1">
        <Bar className="h-4 w-12 rounded-full" />
        <Bar className="h-4 w-12 rounded-full" />
      </div>
      <Bar className="mt-2 h-9 w-full" />
    </div>
  );
}

function ColumnSkeleton() {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-border bg-canvas/40 p-3">
      <div className="flex items-center justify-between px-1">
        <Bar className="h-5 w-20 rounded-full" />
        <Bar className="h-5 w-6 rounded-full" />
      </div>
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function WorkflowSkeleton({ columns = 5 }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {Array.from({ length: columns }).map((_, i) => (
        <ColumnSkeleton key={i} />
      ))}
    </div>
  );
}
