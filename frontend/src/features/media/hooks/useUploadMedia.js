import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadMediaAsset } from "../api/mediaApi";

export function useUploadMedia({ contentItemId }, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, type }) =>
      uploadMediaAsset(contentItemId, { file, type }),
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
