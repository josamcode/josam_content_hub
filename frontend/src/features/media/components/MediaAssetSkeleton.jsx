import { cn } from "../../../lib/cn";

function Bar({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-canvas", className)} />;
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <Bar className="aspect-video w-full rounded-xl" />
      <div className="flex gap-2">
        <Bar className="h-5 w-16 rounded-full" />
        <Bar className="h-4 w-24" />
      </div>
      <Bar className="h-4 w-3/5" />
      <Bar className="h-3 w-2/5" />
    </div>
  );
}

export function MediaAssetSkeleton({ count = 2 }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
