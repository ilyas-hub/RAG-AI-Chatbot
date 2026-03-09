/**
 * Hook to fetch and manage conversations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { chatbotKeys } from './queries';
import type {
  ConversationsListResponse,
  ChatMessage,
  CreateConversationInput,
  ChatConversation,
  ApiResponse,
} from '../types';

/**
 * List conversations for the current user
 */
export function useConversations() {
  return useQuery({
    queryKey: chatbotKeys.conversations(),
    queryFn: async () => {
      const response = await apiClient<ApiResponse<ConversationsListResponse>>(
        '/chatbot/conversations',
      );
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Get messages for a conversation
 */
export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: chatbotKeys.messages(conversationId || ''),
    queryFn: async () => {
      const response = await apiClient<ApiResponse<ChatMessage[]>>(
        `/chatbot/conversations/${conversationId}/messages`,
      );
      return response.data;
    },
    enabled: !!conversationId,
    staleTime: 0,
  });
}

/**
 * Create a new conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateConversationInput) => {
      const response = await apiClient<ApiResponse<ChatConversation>>(
        '/chatbot/conversations',
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKeys.conversations() });
    },
  });
}

/**
 * End a conversation
 */
export function useEndConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      await apiClient(
        `/chatbot/conversations/${conversationId}`,
        {
          method: 'DELETE',
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotKeys.conversations() });
    },
  });
}
