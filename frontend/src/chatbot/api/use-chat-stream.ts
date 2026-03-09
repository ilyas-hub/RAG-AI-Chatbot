/**
 * Chat streaming hook — wraps AI SDK v5's useChat for SSE streaming
 */

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { APP_ENV } from '@/env';
import { useChatStore } from '../stores/chat.store';

interface UseChatStreamOptions {
  conversationId?: string;
  source?: 'web' | 'widget';
}

export function useChatStream({ conversationId, source = 'web' }: UseChatStreamOptions) {
  const { setIsStreaming } = useChatStore();

  // Refs for dynamic body values (stable transport, fresh values)
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;
  const sourceRef = useRef(source);
  sourceRef.current = source;

  // TextStreamChatTransport handles text/plain responses
  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: `${APP_ENV.api.baseUrl}/chatbot/chat`,
        body: () => ({
          conversationId: conversationIdRef.current,
          source: sourceRef.current,
        }),
      }),
    [],
  );

  const {
    messages,
    sendMessage,
    regenerate,
    status,
    error,
    setMessages,
  } = useChat({
    transport,
    onFinish: () => {
      setIsStreaming(false);
    },
    onError: () => {
      setIsStreaming(false);
    },
  });

  // Track streaming state from status changes
  useEffect(() => {
    if (status === 'streaming') {
      setIsStreaming(true);
    }
  }, [status, setIsStreaming]);

  // Input state — v5 doesn't manage this, so we do
  const [input, setInput] = useState('');

  // Form submit handler
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim()) return;
      const text = input;
      setInput('');
      await sendMessage({ text });
    },
    [input, sendMessage],
  );

  // Derive isLoading from status
  const isLoading = status === 'submitted' || status === 'streaming';

  // Map v5 UIMessages to include `content` string for component compatibility
  const mappedMessages = messages.map((m) => ({
    ...m,
    content: m.parts
      .filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
      .map((p) => p.text)
      .join(''),
  }));

  return {
    messages: mappedMessages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    reload: regenerate,
    error,
    status,
    setMessages,
  };
}
