import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createQueueSlot } from "../api/queueSlotApi";

export function useCreateQueueSlot(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQueueSlot,
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["queue-slots"] });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
