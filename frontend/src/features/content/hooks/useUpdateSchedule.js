import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateSchedule } from "../api/scheduleApi";

export function useUpdateSchedule(
  { scheduleId, platformPostId, contentItemId },
  options = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateSchedule(scheduleId, payload),
    ...options,
    onSuccess: async (schedule, variables, context) => {
      if (schedule && platformPostId) {
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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (options.onSuccess) options.onSuccess(schedule, variables, context);
    },
  });
}
