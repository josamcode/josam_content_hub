import { useMutation } from "@tanstack/react-query";

import { validatePlatformPost } from "../api/platformPostApi";

export function useValidatePlatformPost(id, options = {}) {
  return useMutation({
    mutationFn: () => validatePlatformPost(id),
    ...options,
  });
}
