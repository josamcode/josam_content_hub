import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateQueueSlot } from "../api/queueSlotApi";

export function useUpdateQueueSlot(id, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateQueueSlot(id, payload),
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["queue-slots"] });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
