/**
 * Chat panel — Header, message list + input
 */

import { useEffect, useRef } from 'react';
import { X, RotateCcw, Minus } from 'lucide-react';
import ChatbotIcon from '@/assets/Chatbot.svg';
import { Button } from '@/lib/ui/button';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { useChatStream } from '../api/use-chat-stream';
import { useChatStore } from '../stores/chat.store';

interface ChatPanelProps {
  welcomeMessage?: string;
  fallbackMessage?: string;
  enableFeedback?: boolean;
  onClose: () => void;
}

export function ChatPanel({
  welcomeMessage = 'Hello! How can I help you today?',
  fallbackMessage = 'Something went wrong. Please try again.',
  enableFeedback = true,
  onClose,
}: ChatPanelProps) {
  const { activeConversationId, isStreaming } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    reload,
    error,
  } = useChatStream({
    conversationId: activeConversationId || undefined,
  });

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="flex h-[min(520px,calc(100vh-8rem))] flex-col">
      {/* Header — gradient */}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={ChatbotIcon}
                alt="AI Assistant"
                className="h-10 w-10 rounded-full border-2 border-white/30"
              />
              {/* Online indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">
                AI Assistant
              </p>
              <p className="text-xs text-white/70">
                {isLoading ? 'Typing...' : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
              onClick={onClose}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fb]">
        {/* Welcome */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center py-6 space-y-3">
            <img src={ChatbotIcon} alt="AI Assistant" className="h-16 w-16 rounded-full" />
            <div>
              <p className="text-sm font-medium text-foreground">AI Assistant</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                {welcomeMessage}
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            id={message.id}
            role={message.role as 'user' | 'assistant'}
            content={message.content}
            enableFeedback={enableFeedback && message.role === 'assistant'}
          />
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive px-3 py-2 bg-destructive/10 rounded-xl">
            <span className="flex-1">{fallbackMessage}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => reload()}
              className="h-6 gap-1 text-xs shrink-0"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </Button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Powered by + Input */}
      <div className="border-t bg-background">
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
        <div className="px-4 pb-2 -mt-1">
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Powered by RAG AI
          </p>
        </div>
      </div>
    </div>
  );
}
