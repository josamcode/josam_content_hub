import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateAiBrandProfile } from "../api/aiBrandProfileApi";

export function useUpdateAiBrandProfile(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateAiBrandProfile(payload),
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.setQueryData(["ai-brand-profile"], data);
      await queryClient.invalidateQueries({ queryKey: ["ai-brand-profile"] });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
