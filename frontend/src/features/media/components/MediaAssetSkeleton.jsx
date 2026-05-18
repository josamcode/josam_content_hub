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
        <Bar className="h-5 w-20 rounded-full" />
      </div>
      <Bar className="h-4 w-3/5" />
      <Bar className="h-3 w-2/5" />
      <div className="mt-auto border-t border-border pt-3">
        <Bar className="h-8 w-full rounded-md" />
      </div>
    </div>
  );
}

export function MediaAssetSkeleton({ count = 6, className }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </>
  );
}
