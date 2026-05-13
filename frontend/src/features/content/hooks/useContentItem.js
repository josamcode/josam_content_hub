import { useQuery } from "@tanstack/react-query";

import { fetchContentItem } from "../api/contentApi";

export function useContentItem(id) {
  return useQuery({
    queryKey: ["content-item", id],
    queryFn: () => fetchContentItem(id),
    enabled: Boolean(id),
    staleTime: 15_000,
    retry: (failureCount, error) => {
      const status = error?.response?.status;
      if (status === 404 || status === 401) return false;
      return failureCount < 1;
    },
  });
}
