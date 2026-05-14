import { useTranslation } from "react-i18next";

import { Badge } from "../../../components/ui/Badge";
import { formatStatus, statusTone } from "../utils";

export function StatusBadge({ status, className }) {
  const { t } = useTranslation("status");

  return (
    <Badge tone={statusTone(status)} className={className}>
      {formatStatus(status, t)}
    </Badge>
  );
}
