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
  await api.delete(`/media-assets/${id}`);
}
