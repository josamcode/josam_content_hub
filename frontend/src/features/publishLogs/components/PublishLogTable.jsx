import { Card } from "../../../components/ui/Card";
import { PublishLogRow } from "./PublishLogRow";

export function PublishLogTable({ attempts }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas/60 text-left">
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                Content
              </th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                Platform
              </th>
              <th className="hidden px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted sm:table-cell">
                Mode
              </th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                Status
              </th>
              <th className="hidden px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted sm:table-cell">
                Attempted at
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => (
              <PublishLogRow key={attempt.id} attempt={attempt} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
