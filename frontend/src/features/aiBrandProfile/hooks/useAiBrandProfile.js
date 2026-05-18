import { useQuery } from "@tanstack/react-query";

import { fetchAiBrandProfile } from "../api/aiBrandProfileApi";

export function useAiBrandProfile() {
  return useQuery({
    queryKey: ["ai-brand-profile"],
    queryFn: fetchAiBrandProfile,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
  });
}
