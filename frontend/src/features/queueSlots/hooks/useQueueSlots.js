import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchQueueSlots } from "../api/queueSlotApi";

export function useQueueSlots({ platform, active } = {}) {
  return useQuery({
    queryKey: ["queue-slots", { platform, active }],
    queryFn: () => fetchQueueSlots({ platform, active }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
  });
}
