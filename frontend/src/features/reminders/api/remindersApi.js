import { api } from "../../../lib/axios";

export async function fetchReminders({ range, status, platform } = {}) {
  const params = {};
  if (range) params.range = range;
  if (status) params.status = status;
  if (platform) params.platform = platform;

  const { data } = await api.get("/reminders", { params });
  return Array.isArray(data?.data) ? data.data : [];
}

export async function fetchReminder(id) {
  const { data } = await api.get(`/reminders/${id}`);
  return data?.data;
}
