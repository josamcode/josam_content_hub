import { api } from "../../../lib/axios";

const SAVE_FIELDS = ["scheduledAt", "timezone", "publishMode"];

export async function saveSchedule(platformPostId, payload) {
  const body = {};
  for (const key of SAVE_FIELDS) {
    if (key in payload) body[key] = payload[key];
  }
  const { data } = await api.post(
    `/platform-posts/${platformPostId}/schedule`,
    body
  );
  return data?.data;
}

const UPDATE_FIELDS = ["scheduledAt", "timezone", "publishMode", "status"];

export async function updateSchedule(scheduleId, payload) {
  const body = {};
  for (const key of UPDATE_FIELDS) {
    if (key in payload) body[key] = payload[key];
  }
  const { data } = await api.patch(`/schedules/${scheduleId}`, body);
  return data?.data;
}

export async function cancelSchedule(scheduleId) {
  await api.delete(`/schedules/${scheduleId}`);
}

const ACTIVE_STATUSES = new Set([
  "scheduled",
  "manual_pending",
  "processing",
]);

function ymd(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function findScheduleForPlatformPost(platformPostId) {
  const now = new Date();
  const from = new Date(now);
  from.setUTCFullYear(now.getUTCFullYear() - 1);
  const to = new Date(now);
  to.setUTCFullYear(now.getUTCFullYear() + 5);

  const { data } = await api.get(`/calendar`, {
    params: { from: ymd(from), to: ymd(to) },
  });

  const list = Array.isArray(data?.data) ? data.data : [];
  return (
    list.find(
      (item) =>
        item.platformPostId === platformPostId &&
        ACTIVE_STATUSES.has(item.status)
    ) || null
  );
}
