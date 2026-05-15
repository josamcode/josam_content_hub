import { api } from "../../../lib/axios";

export async function fetchPublishAttempts({
  page = 1,
  limit = 20,
  platformPostId,
  platform,
  status,
  from,
  to,
} = {}) {
  const params = { page, limit };
  if (platformPostId) params.platformPostId = platformPostId;
  if (platform) params.platform = platform;
  if (status) params.status = status;
  if (from) params.from = from;
  if (to) params.to = to;

  const { data } = await api.get("/publish-attempts", { params });
  return {
    items: Array.isArray(data?.data) ? data.data : [],
    meta: data?.meta || { page, limit, total: 0, totalPages: 0 },
  };
}
