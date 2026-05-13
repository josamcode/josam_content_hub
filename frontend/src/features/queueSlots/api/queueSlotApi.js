import { api } from "../../../lib/axios";

export async function fetchQueueSlots({ platform, active } = {}) {
  const params = {};
  if (platform) params.platform = platform;
  if (active !== undefined && active !== null) params.active = active;

  const { data } = await api.get("/queue-slots", { params });
  return Array.isArray(data?.data) ? data.data : [];
}

const CREATE_FIELDS = ["platform", "dayOfWeek", "timeOfDay", "timezone"];

export async function createQueueSlot(payload) {
  const body = {};
  for (const key of CREATE_FIELDS) {
    if (key in payload) body[key] = payload[key];
  }
  const { data } = await api.post("/queue-slots", body);
  return data?.data;
}

const UPDATE_FIELDS = [
  "platform",
  "dayOfWeek",
  "timeOfDay",
  "timezone",
  "isActive",
];

export async function updateQueueSlot(id, payload) {
  const body = {};
  for (const key of UPDATE_FIELDS) {
    if (key in payload) body[key] = payload[key];
  }
  const { data } = await api.patch(`/queue-slots/${id}`, body);
  return data?.data;
}

export async function deleteQueueSlot(id) {
  await api.delete(`/queue-slots/${id}`);
}
