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
