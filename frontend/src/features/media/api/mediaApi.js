import { api } from "../../../lib/axios";

export async function fetchMediaAssets(contentItemId, { type } = {}) {
  const params = {};
  if (type) params.type = type;
  const { data } = await api.get(`/content-items/${contentItemId}/media`, {
    params,
  });
  return Array.isArray(data?.data) ? data.data : [];
}

export async function uploadMediaAsset(contentItemId, { file, type }) {
  const formData = new FormData();
  formData.append("type", type);
  formData.append("file", file);

  const { data } = await api.post(
    `/content-items/${contentItemId}/media`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data?.data;
}

export async function deleteMediaAsset(id) {
  const { data } = await api.delete(`/media-assets/${id}`);
  return data?.data;
}

export async function fetchMediaLibraryAssets({
  page = 1,
  limit = 20,
  type,
  status,
  contentItemId,
  search,
  sortBy = "createdAt",
  sortOrder = "desc",
} = {}) {
  const params = { page, limit, sortBy, sortOrder };
  if (type) params.type = type;
  if (status) params.status = status;
  if (contentItemId) params.contentItemId = contentItemId;
  if (search) params.search = search;

  const { data } = await api.get("/media-assets", { params });
  return {
    items: Array.isArray(data?.data) ? data.data : [],
    meta: data?.meta || { page, limit, total: 0, totalPages: 0 },
  };
}

export async function fetchMediaStorageSummary() {
  const { data } = await api.get("/media-assets/storage-summary");
  return data?.data;
}

export async function scanMediaStorage() {
  const { data } = await api.post("/media-assets/scan-storage");
  return data?.data;
}
