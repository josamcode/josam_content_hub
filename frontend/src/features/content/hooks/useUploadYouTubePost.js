import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadYouTubePost } from "../api/platformPostApi";

export function useUploadYouTubePost(
  { platformPostId, contentItemId },
  options = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload = {}) => uploadYouTubePost(platformPostId, payload),
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: ["platform-posts", contentItemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["content-item", contentItemId],
      });
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      queryClient.invalidateQueries({ queryKey: ["publish-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({
        queryKey: ["schedule-for-platform-post", platformPostId],
      });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
