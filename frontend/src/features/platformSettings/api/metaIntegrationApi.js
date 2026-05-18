import { api } from "../../../lib/axios";

export async function getMetaStatus() {
  const { data } = await api.get("/integrations/meta/status");
  return data?.data;
}

export async function connectMeta() {
  const { data } = await api.get("/integrations/meta/connect");
  return data?.data;
}

export async function getMetaPages() {
  const { data } = await api.get("/integrations/meta/pages");
  return data?.data;
}

export async function selectMetaPage(pageId) {
  const { data } = await api.post("/integrations/meta/select-page", { pageId });
  return data?.data;
}

export async function disconnectMeta() {
  const { data } = await api.delete("/integrations/meta/disconnect");
  return data?.data;
}
