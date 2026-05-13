import { useQuery } from "@tanstack/react-query";

import { fetchPlatformPosts } from "../api/platformPostApi";

export function usePlatformPosts(contentItemId) {
  return useQuery({
    queryKey: ["platform-posts", contentItemId],
    queryFn: () => fetchPlatformPosts(contentItemId),
    enabled: Boolean(contentItemId),
    staleTime: 15_000,
    retry: (failureCount, error) => {
      const status = error?.response?.status;
      if (status === 404 || status === 401) return false;
      return failureCount < 1;
    },
  });
}
