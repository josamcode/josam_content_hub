import { useMutation } from "@tanstack/react-query";

import { connectYouTube } from "../api/platformSettingsApi";

export function useConnectYouTube(options = {}) {
  return useMutation({
    mutationFn: connectYouTube,
    ...options,
  });
}
