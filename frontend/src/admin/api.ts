/** Admin API client — wraps apiClient with X-Admin-Secret header */

import { APP_ENV } from '@/env';
import type {
  ApiResponse,
  FaqItem,
  KnowledgeBase,
  KnowledgeDocument,
  ChatbotConfig,
  AnalyticsData,
} from './types';

function getAdminSecret(): string {
  return sessionStorage.getItem('admin-secret') || '';
}

async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${APP_ENV.api.baseUrl}/chatbot/admin${path}`;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Admin-Secret', getAdminSecret());

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

// FAQ
export const faqApi = {
  list: (params?: { category?: string; isActive?: boolean; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));
    if (params?.page) qs.set('page', String(params.page));
    const q = qs.toString();
    return adminFetch<{ faqs: FaqItem[]; total: number }>(`/faq${q ? `?${q}` : ''}`);
  },
  create: (data: { category: string; question: string; answer: string; keywords?: string[]; knowledgeBaseId?: string }) =>
    adminFetch<FaqItem>('/faq', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    adminFetch<FaqItem>(`/faq/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    adminFetch<{ message: string }>(`/faq/${id}`, { method: 'DELETE' }),
  sync: () =>
    adminFetch<{ synced: number }>('/faq/sync', { method: 'POST' }),
};

// Knowledge Bases
export const kbApi = {
  list: () => adminFetch<KnowledgeBase[]>('/knowledge-bases'),
  create: (data: { name: string; description?: string; isDefault?: boolean }) =>
    adminFetch<KnowledgeBase>('/knowledge-bases', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    adminFetch<KnowledgeBase>(`/knowledge-bases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    adminFetch<{ message: string }>(`/knowledge-bases/${id}`, { method: 'DELETE' }),
  uploadDocument: (kbId: string, data: { title: string; content: string; sourceType: string }) =>
    adminFetch<KnowledgeDocument>(`/knowledge-bases/${kbId}/documents`, { method: 'POST', body: JSON.stringify(data) }),
  deleteDocument: (docId: string) =>
    adminFetch<{ message: string }>(`/documents/${docId}`, { method: 'DELETE' }),
};

// Config
export const configApi = {
  get: () => adminFetch<ChatbotConfig>('/config'),
  update: (data: Record<string, unknown>) =>
    adminFetch<ChatbotConfig>('/config', { method: 'PUT', body: JSON.stringify(data) }),
};

// Model testing
export const modelApi = {
  test: (modelId: string) =>
    adminFetch<{ success: boolean; modelId: string; responseTime: number; error?: string }>('/test-model', {
      method: 'POST',
      body: JSON.stringify({ modelId }),
    }),
};

// Analytics
export const analyticsApi = {
  get: () => adminFetch<AnalyticsData>('/analytics'),
};

// Reindex
export const reindexApi = {
  run: () => adminFetch<{ faqs: number; documents: number }>('/reindex', { method: 'POST' }),
};

// Test auth — used by login form
export async function testAdminAuth(secret: string): Promise<boolean> {
  const url = `${APP_ENV.api.baseUrl}/chatbot/admin/config`;
  const res = await fetch(url, {
    headers: { 'X-Admin-Secret': secret },
  });
  return res.ok;
}
