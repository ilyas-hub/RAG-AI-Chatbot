/**
 * Query keys for chatbot feature
 */

export const chatbotKeys = {
  all: ['chatbot'] as const,
  conversations: () => [...chatbotKeys.all, 'conversations'] as const,
  messages: (conversationId: string) => [...chatbotKeys.all, 'messages', conversationId] as const,
  config: () => [...chatbotKeys.all, 'config'] as const,
};
