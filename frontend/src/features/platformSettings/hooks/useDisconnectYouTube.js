import { useMutation, useQueryClient } from "@tanstack/react-query";

import { disconnectYouTube } from "../api/platformSettingsApi";
import { youtubeStatusQueryKey } from "./useYouTubeStatus";

export function useDisconnectYouTube(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectYouTube,
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.setQueryData(youtubeStatusQueryKey, data);
      await queryClient.invalidateQueries({ queryKey: youtubeStatusQueryKey });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
