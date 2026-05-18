import { api } from "../../../lib/axios";

export async function fetchAiBrandProfile() {
  const { data } = await api.get("/ai-brand-profile");
  return data?.data;
}

export async function updateAiBrandProfile(payload) {
  const { data } = await api.patch("/ai-brand-profile", payload);
  return data?.data;
}
