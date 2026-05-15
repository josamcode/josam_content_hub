import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";

function Bar({ className }) {
  return <div className={cn("animate-pulse rounded-md bg-canvas", className)} />;
}

function RowSkeleton() {
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-4 py-3">
        <Bar className="h-4 w-2/3" />
      </td>
      <td className="px-4 py-3">
        <Bar className="h-5 w-20 rounded-full" />
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <Bar className="h-3 w-16" />
      </td>
      <td className="px-4 py-3">
        <Bar className="h-5 w-20 rounded-full" />
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <Bar className="h-3 w-24" />
      </td>
      <td className="px-4 py-3 text-end">
        <div className="ms-auto flex w-fit gap-2">
          <Bar className="h-6 w-20 rounded-md" />
          <Bar className="h-6 w-16 rounded-md" />
        </div>
      </td>
    </tr>
  );
}

export function PublishLogSkeleton({ rows = 6 }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas/60 text-start">
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Bar className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
