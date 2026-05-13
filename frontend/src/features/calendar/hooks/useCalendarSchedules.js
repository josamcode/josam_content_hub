import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchCalendarSchedules } from "../api/calendarApi";

export function useCalendarSchedules({ from, to, platform, status } = {}) {
  return useQuery({
    queryKey: ["calendar", { from, to, platform, status }],
    queryFn: () => fetchCalendarSchedules({ from, to, platform, status }),
    enabled: Boolean(from && to),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
  });
}
