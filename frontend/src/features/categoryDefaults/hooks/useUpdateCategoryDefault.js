import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateCategoryDefault } from "../api/categoryDefaultsApi";

export function useUpdateCategoryDefault(category, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateCategoryDefault(category, payload),
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.setQueryData(["category-defaults"], (current) => {
        if (!Array.isArray(current)) return current;
        return current.map((entry) =>
          entry.category === data.category ? data : entry
        );
      });
      await queryClient.invalidateQueries({ queryKey: ["category-defaults"] });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
