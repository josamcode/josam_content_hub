import { useMutation, useQueryClient } from "@tanstack/react-query";

import { manualCompletePublish } from "../api/publishingApi";

export function useManualCompletePublish(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: manualCompletePublish,
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      queryClient.invalidateQueries({ queryKey: ["content-item"] });
      queryClient.invalidateQueries({ queryKey: ["platform-posts"] });
      queryClient.invalidateQueries({ queryKey: ["publish-attempts"] });
      if (variables?.platformPostId) {
        queryClient.invalidateQueries({
          queryKey: ["schedule-for-platform-post", variables.platformPostId],
        });
      }
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
