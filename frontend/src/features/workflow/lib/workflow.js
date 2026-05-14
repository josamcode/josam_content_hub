import { formatStatus, statusTone } from "../../../lib/format";

export const PRIMARY_WORKFLOW_STATUSES = [
  "idea",
  "scripted",
  "recorded",
  "edited",
  "ready",
  "scheduled",
  "published",
];

export const SECONDARY_WORKFLOW_STATUSES = ["failed", "archived"];

export const ALL_WORKFLOW_STATUSES = [
  ...PRIMARY_WORKFLOW_STATUSES,
  ...SECONDARY_WORKFLOW_STATUSES,
];

export const WORKFLOW_STATUS_OPTIONS = ALL_WORKFLOW_STATUSES.map((value) => ({
  value,
  label: formatStatus(value),
}));

export function getColumnTone(status) {
  return statusTone(status);
}

export function groupItemsByStatus(items, statuses) {
  const map = new Map(statuses.map((s) => [s, []]));
  for (const item of items) {
    const bucket = map.has(item.status) ? item.status : null;
    if (bucket) map.get(bucket).push(item);
  }
  return map;
}
