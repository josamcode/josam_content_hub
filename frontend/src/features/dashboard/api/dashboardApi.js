import { api } from "../../../lib/axios";

export async function fetchDashboard({
  timezone,
  upcomingLimit = 5,
  recentLimit = 5,
} = {}) {
  const params = { upcomingLimit, recentLimit };
  if (timezone) params.timezone = timezone;
  const { data } = await api.get("/dashboard", { params });
  return data?.data;
}
