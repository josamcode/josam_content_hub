import { api } from "../../../lib/axios";

export async function fetchContentItems({
  page = 1,
  limit = 12,
  status,
  category,
  platform,
  search,
} = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  if (category) params.category = category;
  if (platform) params.platform = platform;
  if (search) params.search = search;

  const { data } = await api.get("/content-items", { params });
  return {
    items: Array.isArray(data?.data) ? data.data : [],
    meta: data?.meta || { page, limit, total: 0, totalPages: 0 },
  };
}
