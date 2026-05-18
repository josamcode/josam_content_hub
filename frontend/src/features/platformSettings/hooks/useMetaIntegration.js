import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getMetaStatus,
  connectMeta,
  getMetaPages,
  selectMetaPage,
  disconnectMeta,
} from "../api/metaIntegrationApi";

export const metaStatusQueryKey = ["integrations", "meta", "status"];
export const metaPagesQueryKey = ["integrations", "meta", "pages"];

export function useMetaStatus() {
  return useQuery({
    queryKey: metaStatusQueryKey,
    queryFn: getMetaStatus,
    staleTime: 15_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
  });
}

export function useMetaPages(options = {}) {
  return useQuery({
    queryKey: metaPagesQueryKey,
    queryFn: getMetaPages,
    staleTime: 15_000,
    retry: (failureCount, error) => {
      const code = error?.response?.status;
      if (code === 401 || code === 404) return false;
      return failureCount < 1;
    },
    ...options,
  });
}

export function useConnectMeta(options = {}) {
  return useMutation({
    mutationFn: connectMeta,
    ...options,
  });
}

export function useSelectMetaPage(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: selectMetaPage,
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: metaStatusQueryKey });
      await queryClient.invalidateQueries({ queryKey: metaPagesQueryKey });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}

export function useDisconnectMeta(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectMeta,
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.setQueryData(metaStatusQueryKey, data);
      await queryClient.invalidateQueries({ queryKey: metaStatusQueryKey });
      await queryClient.invalidateQueries({ queryKey: metaPagesQueryKey });
      if (options.onSuccess) options.onSuccess(data, variables, context);
    },
  });
}
