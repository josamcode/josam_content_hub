import { api } from "../../../lib/axios";

export async function generatePlatformMetadata(payload) {
  const { data } = await api.post("/ai/generate-platform-metadata", payload);
  return data?.data;
}
