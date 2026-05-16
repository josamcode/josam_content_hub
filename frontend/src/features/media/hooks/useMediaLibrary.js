import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchMediaLibraryAssets,
  fetchMediaStorageSummary,
  scanMediaStorage,
} from "../api/mediaApi";

export function useMediaLibraryAssets(filters) {
  return useQuery({
    queryKey: ["media-library", filters],
    queryFn: () => fetchMediaLibraryAssets(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
  });
}

export function useMediaStorageSummary() {
  return useQuery({
    queryKey: ["media-storage-summary"],
    queryFn: fetchMediaStorageSummary,
    staleTime: 15_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
  });
}

export function useScanMediaStorage(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scanMediaStorage,
    ...options,
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["media-library"] }),
        queryClient.invalidateQueries({ queryKey: ["media-storage-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["media"] }),
      ]);
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
