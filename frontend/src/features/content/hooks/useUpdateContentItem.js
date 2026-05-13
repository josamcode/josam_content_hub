import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateContentItem } from "../api/contentApi";

export function useUpdateContentItem(id, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateContentItem(id, payload),
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["content-item", id] });
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
