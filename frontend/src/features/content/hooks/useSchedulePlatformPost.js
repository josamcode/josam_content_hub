import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveSchedule } from "../api/scheduleApi";

export function useSchedulePlatformPost(
  { platformPostId, contentItemId },
  options = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => saveSchedule(platformPostId, payload),
    ...options,
    onSuccess: async (schedule, variables, context) => {
      if (schedule) {
        queryClient.setQueryData(
          ["schedule-for-platform-post", platformPostId],
          schedule
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
      if (options.onSuccess) options.onSuccess(schedule, variables, context);
    },
  });
}
