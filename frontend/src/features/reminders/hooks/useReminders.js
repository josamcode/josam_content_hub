import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchReminders } from "../api/remindersApi";

export function useReminders({ range, status, platform } = {}) {
  return useQuery({
    queryKey: ["reminders", { range, status, platform }],
    queryFn: () => fetchReminders({ range, status, platform }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
  });
}
