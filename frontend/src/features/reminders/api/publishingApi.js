import { api } from "../../../lib/axios";

export async function manualCompletePublish({
  platformPostId,
  scheduleId,
  platformPostUrl,
}) {
  const body = { platformPostId };
  if (scheduleId) body.scheduleId = scheduleId;
  if (platformPostUrl) body.platformPostUrl = platformPostUrl;

  const { data } = await api.post("/publish/manual-complete", body);
  return data?.data;
}
