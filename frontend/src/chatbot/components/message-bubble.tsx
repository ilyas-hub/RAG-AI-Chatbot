/**
 * Message bubble with role-based styling
 */

import { Bot } from 'lucide-react';
import { FeedbackButtons } from './feedback-buttons';

interface MessageBubbleProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  enableFeedback?: boolean;
  isHelpful?: boolean | null;
}

export function MessageBubble({
  id,
  role,
  content,
  enableFeedback = true,
  isHelpful,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot avatar */}
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 mt-1">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-br-md'
              : 'bg-white text-foreground shadow-sm border border-border/40 rounded-bl-md'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{content}</div>
        </div>

        {/* Feedback */}
        {!isUser && enableFeedback && id !== 'welcome' && (
          <FeedbackButtons messageId={id} initialIsHelpful={isHelpful} />
        )}
      </div>
    </div>
  );
}
