import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchContentItems } from "../api/contentApi";

export function useContentItems(filters) {
  return useQuery({
    queryKey: ["content-items", filters],
    queryFn: () => fetchContentItems(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}
