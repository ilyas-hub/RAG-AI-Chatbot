/**
 * Chat input with auto-resize and send button
 */

import { type FormEvent, useRef, useEffect } from 'react';
import { SendHorizonal } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        const form = e.currentTarget.closest('form');
        if (form) form.requestSubmit();
      }
    }
  };

  const canSend = input.trim() && !isLoading;

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2 px-3 py-3">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={isLoading}
        className="flex-1 resize-none rounded-xl border-0 bg-muted/60 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 placeholder:text-muted-foreground/60"
      />
      <button
        type="submit"
        disabled={!canSend}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
          canSend
            ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
            : 'bg-muted text-muted-foreground/40'
        }`}
      >
        <SendHorizonal className="h-4 w-4" />
      </button>
    </form>
  );
}
