import { useQuery } from "@tanstack/react-query";

import { fetchPlatformSettings } from "../api/platformSettingsApi";

export function usePlatformSettings() {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: fetchPlatformSettings,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
  });
}
