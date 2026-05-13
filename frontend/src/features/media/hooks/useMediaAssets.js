import { useQuery } from "@tanstack/react-query";

import { fetchMediaAssets } from "../api/mediaApi";

export function useMediaAssets(contentItemId, { type } = {}) {
  return useQuery({
    queryKey: ["media", contentItemId, { type }],
    queryFn: () => fetchMediaAssets(contentItemId, { type }),
    enabled: Boolean(contentItemId),
    staleTime: 15_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
  });
}
