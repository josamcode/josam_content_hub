import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updatePlatformSetting } from "../api/platformSettingsApi";

export function useUpdatePlatformSetting(platform, options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updatePlatformSetting(platform, payload),
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.setQueryData(["platform-settings"], (current) => {
        if (!Array.isArray(current)) return current;
        return current.map((entry) =>
          entry.platform === data.platform ? data : entry
        );
      });
      await queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
