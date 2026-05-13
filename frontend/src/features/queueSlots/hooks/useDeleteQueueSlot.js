import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteQueueSlot } from "../api/queueSlotApi";

export function useDeleteQueueSlot(id, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteQueueSlot(id),
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["queue-slots"] });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
