import { useQuery } from "@tanstack/react-query";

import { getYouTubeStatus } from "../api/platformSettingsApi";

export const youtubeStatusQueryKey = ["integrations", "youtube", "status"];

export function useYouTubeStatus() {
  return useQuery({
    queryKey: youtubeStatusQueryKey,
    queryFn: getYouTubeStatus,
    staleTime: 15_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
  });
}
