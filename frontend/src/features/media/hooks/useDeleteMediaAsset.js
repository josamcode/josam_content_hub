import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteMediaAsset } from "../api/mediaApi";

export function useDeleteMediaAsset({ id, contentItemId }, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteMediaAsset(id),
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: ["media", contentItemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["content-item", contentItemId],
      });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
