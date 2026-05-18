import { useMutation } from "@tanstack/react-query";

import { generatePlatformMetadata } from "../api/aiMetadataApi";

export function useGenerateAiMetadata(options = {}) {
  return useMutation({
    mutationFn: generatePlatformMetadata,
    ...options,
  });
}
