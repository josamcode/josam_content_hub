import { api } from "../../../lib/axios";

export async function fetchPlatformSettings() {
  const { data } = await api.get("/platform-settings");
  return Array.isArray(data?.data) ? data.data : [];
}

export async function fetchPlatformSetting(platform) {
  const { data } = await api.get(`/platform-settings/${platform}`);
  return data?.data;
}

const UPDATE_FIELDS = [
  "isEnabled",
  "defaultPublishMode",
  "defaultHashtags",
  "defaultTags",
  "captionTemplate",
  "titleTemplate",
  "descriptionTemplate",
  "notes",
];

export async function updatePlatformSetting(platform, payload) {
  const body = {};
  for (const key of UPDATE_FIELDS) {
    if (key in payload) body[key] = payload[key];
  }
  const { data } = await api.patch(`/platform-settings/${platform}`, body);
  return data?.data;
}
