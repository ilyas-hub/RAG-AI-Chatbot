/** Admin React Query hooks */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faqApi, kbApi, configApi, analyticsApi, reindexApi, modelApi } from './api';

// Query keys
const keys = {
  faqs: (filters?: Record<string, unknown>) => ['admin-faqs', filters] as const,
  kbs: ['admin-kbs'] as const,
  config: ['admin-config'] as const,
  analytics: ['admin-analytics'] as const,
};

// FAQ hooks
export function useFaqs(filters?: { category?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: keys.faqs(filters),
    queryFn: () => faqApi.list(filters),
  });
}

export function useCreateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: faqApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-faqs'] }),
  });
}

export function useUpdateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => faqApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-faqs'] }),
  });
}

export function useDeleteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: faqApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-faqs'] }),
  });
}

export function useSyncFaqs() {
  return useMutation({ mutationFn: faqApi.sync });
}

// Knowledge Base hooks
export function useKnowledgeBases() {
  return useQuery({ queryKey: keys.kbs, queryFn: kbApi.list });
}

export function useCreateKB() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kbApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.kbs }),
  });
}

export function useDeleteKB() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kbApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.kbs }),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kbId, data }: { kbId: string; data: { title: string; content: string; sourceType: string } }) =>
      kbApi.uploadDocument(kbId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.kbs }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kbApi.deleteDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.kbs }),
  });
}

// Config hooks
export function useConfig() {
  return useQuery({ queryKey: keys.config, queryFn: configApi.get });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: configApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.config }),
  });
}

// Analytics
export function useAnalytics() {
  return useQuery({ queryKey: keys.analytics, queryFn: analyticsApi.get });
}

// Model testing
export function useTestModel() {
  return useMutation({ mutationFn: modelApi.test });
}

// Reindex
export function useReindex() {
  return useMutation({ mutationFn: reindexApi.run });
}
