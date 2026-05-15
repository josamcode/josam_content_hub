export function attemptStatusTone(status) {
  switch (status) {
    case "success":
    case "manual_completed":
      return "success";
    case "failed":
      return "danger";
    case "cancelled":
    case "skipped":
      return "warning";
    default:
      return "neutral";
  }
}

export const ATTEMPT_STATUSES = [
  "success",
  "manual_completed",
  "failed",
  "skipped",
  "cancelled",
];

export function attemptStatusLabel(status, t) {
  if (typeof t === "function") {
    return t(`publishLogs.statuses.${status}`, {
      ns: "pages",
      defaultValue: status?.replace(/_/g, " ") || "",
    });
  }
  return status?.replace(/_/g, " ") || "";
}
