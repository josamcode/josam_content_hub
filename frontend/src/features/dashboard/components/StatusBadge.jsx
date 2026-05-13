import { Badge } from "../../../components/ui/Badge";
import { formatStatus, statusTone } from "../utils";

export function StatusBadge({ status, className }) {
  return (
    <Badge tone={statusTone(status)} className={className}>
      {formatStatus(status)}
    </Badge>
  );
}
