import { api } from "../../../lib/axios";

export async function fetchCategoryDefaults() {
  const { data } = await api.get("/category-defaults");
  return Array.isArray(data?.data) ? data.data : [];
}

export async function fetchCategoryDefault(category) {
  const { data } = await api.get(`/category-defaults/${category}`);
  return data?.data;
}

const UPDATE_FIELDS = [
  "defaultGoal",
  "defaultHookStyle",
  "defaultCaptionStyle",
  "defaultHashtags",
  "defaultPlatforms",
  "notes",
  "isActive",
];

export async function updateCategoryDefault(category, payload) {
  const body = {};
  for (const key of UPDATE_FIELDS) {
    if (key in payload) body[key] = payload[key];
  }
  const { data } = await api.patch(`/category-defaults/${category}`, body);
  return data?.data;
}
