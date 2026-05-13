import { useQuery } from "@tanstack/react-query";

import { findScheduleForPlatformPost } from "../api/scheduleApi";

const ACTIVE_STATUSES = new Set([
  "scheduled",
  "manual_pending",
  "processing",
]);

export function useScheduleForPlatformPost(platformPost) {
  const id = platformPost?.id;
  const enabled = Boolean(id) && ACTIVE_STATUSES.has(platformPost?.status);

  return useQuery({
    queryKey: ["schedule-for-platform-post", id],
    queryFn: () => findScheduleForPlatformPost(id),
    enabled,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      const status = error?.response?.status;
      if (status === 401 || status === 404) return false;
      return failureCount < 1;
    },
  });
}
