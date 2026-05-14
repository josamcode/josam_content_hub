import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cancelSchedule } from "../api/scheduleApi";

export function useCancelSchedule(
  { scheduleId, platformPostId, contentItemId },
  options = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelSchedule(scheduleId),
    ...options,
    onSuccess: async (data, variables, context) => {
      if (platformPostId) {
        queryClient.setQueryData(
          ["schedule-for-platform-post", platformPostId],
          null
        );
      }
      await queryClient.invalidateQueries({
        queryKey: ["platform-posts", contentItemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["content-item", contentItemId],
      });
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
