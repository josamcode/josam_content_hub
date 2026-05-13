import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updatePlatformPost } from "../api/platformPostApi";

export function useUpdatePlatformPost({ id, contentItemId }, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updatePlatformPost(id, payload),
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
