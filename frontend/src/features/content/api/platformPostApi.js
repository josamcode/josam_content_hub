import { api } from "../../../lib/axios";

export async function fetchPlatformPosts(contentItemId) {
  const { data } = await api.get(
    `/content-items/${contentItemId}/platform-posts`
  );
  return Array.isArray(data?.data) ? data.data : [];
}

const PATCHABLE_FIELDS = [
  "title",
  "caption",
  "description",
  "hashtags",
  "tags",
  "status",
  "platformPostUrl",
];

export async function updatePlatformPost(id, payload) {
  const body = {};
  for (const key of PATCHABLE_FIELDS) {
    if (key in payload) {
      body[key] = payload[key];
    }
  }
  const { data } = await api.patch(`/platform-posts/${id}`, body);
  return data?.data;
}

export async function validatePlatformPost(id) {
  const { data } = await api.post(`/platform-posts/${id}/validate`);
  return data?.data;
}
