import { useTranslation } from "react-i18next";

import { Card } from "../../../components/ui/Card";
import { PublishLogRow } from "./PublishLogRow";

export function PublishLogTable({ attempts }) {
  const { t } = useTranslation(["common", "pages"]);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas/60 text-start">
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("publishLogs.table.content", { ns: "pages" })}
              </th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("platform", { ns: "common" })}
              </th>
              <th className="hidden px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted sm:table-cell">
                {t("publishLogs.table.publishMode", { ns: "pages" })}
              </th>
              <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("status", { ns: "common" })}
              </th>
              <th className="hidden px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted sm:table-cell">
                {t("publishLogs.table.attemptedAt", { ns: "pages" })}
              </th>
              <th className="px-4 py-3 text-end text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                {t("publishLogs.table.actions", { ns: "pages" })}
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
