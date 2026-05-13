import { api } from "../../../lib/axios";

export async function fetchCalendarSchedules({ from, to, platform, status } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (platform) params.platform = platform;
  if (status) params.status = status;

  const { data } = await api.get("/calendar", { params });
  return Array.isArray(data?.data) ? data.data : [];
}

export async function cancelSchedule(scheduleId) {
  await api.delete(`/schedules/${scheduleId}`);
}
