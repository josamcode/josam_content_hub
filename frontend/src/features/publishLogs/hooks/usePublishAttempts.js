import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchPublishAttempts } from "../api/publishAttemptsApi";

export function usePublishAttempts(filters) {
  return useQuery({
    queryKey: ["publish-attempts", filters],
    queryFn: () => fetchPublishAttempts(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
  });
}
