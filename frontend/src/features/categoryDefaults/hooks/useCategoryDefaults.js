import { useQuery } from "@tanstack/react-query";

import { fetchCategoryDefaults } from "../api/categoryDefaultsApi";

export function useCategoryDefaults() {
  return useQuery({
    queryKey: ["category-defaults"],
    queryFn: fetchCategoryDefaults,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
  });
}
