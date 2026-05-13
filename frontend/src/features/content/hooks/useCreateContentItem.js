import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createContentItem } from "../api/contentApi";

export function useCreateContentItem(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContentItem,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
