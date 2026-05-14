import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applyPlatformDefaults } from "../api/platformPostApi";

export function useApplyPlatformDefaults({ id, contentItemId }, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ overwrite } = {}) =>
      applyPlatformDefaults(id, { overwrite }),
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: ["platform-posts", contentItemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["content-item", contentItemId],
      });
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
