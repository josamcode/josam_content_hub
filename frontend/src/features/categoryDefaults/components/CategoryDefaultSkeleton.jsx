import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

function Bar({ className }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-canvas", className)} />
  );
}

function CardSkeleton() {
  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Bar className="h-5 w-40" />
          <Bar className="h-3 w-56" />
        </div>
        <Bar className="h-6 w-16 rounded-full" />
      </div>
      <Bar className="h-10 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Bar className="h-10 w-full rounded-lg" />
        <Bar className="h-10 w-full rounded-lg" />
      </div>
      <Bar className="h-20 w-full rounded-lg" />
      <Bar className="h-10 w-full rounded-lg" />
      <div className="flex justify-end">
        <Bar className="h-8 w-24 rounded-md" />
      </div>
    </Card>
  );
}

export function CategoryDefaultSkeleton({ count = 4 }) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </section>
  );
}
