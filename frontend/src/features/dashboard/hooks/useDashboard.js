import { useQuery } from "@tanstack/react-query";

import { fetchDashboard } from "../api/dashboardApi";

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

export function useDashboard({
  upcomingLimit = 5,
  recentLimit = 5,
} = {}) {
  const timezone = getBrowserTimezone();

  return useQuery({
    queryKey: ["dashboard", { timezone, upcomingLimit, recentLimit }],
    queryFn: () => fetchDashboard({ timezone, upcomingLimit, recentLimit }),
    staleTime: 30_000,
  });
}
