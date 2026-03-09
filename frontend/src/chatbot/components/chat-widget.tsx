/**
 * Chat Widget — Fixed bottom-right FAB + slide-up panel
 * Industry-standard pattern (Intercom, Drift, Zendesk style)
 */

import { X } from 'lucide-react';
import ChatbotIcon from '@/assets/Chatbot.svg';
import { ChatPanel } from './chat-panel';
import { useChatStore } from '../stores/chat.store';

interface ChatWidgetProps {
  welcomeMessage?: string;
  fallbackMessage?: string;
  enableFeedback?: boolean;
}

export function ChatWidget({
  welcomeMessage,
  fallbackMessage,
  enableFeedback = true,
}: ChatWidgetProps) {
  const { isOpen, toggleOpen, setIsOpen } = useChatStore();

  return (
    <>
      {/* Chat Panel — fixed bottom-right, above FAB */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-7rem)] transition-all duration-300 ease-out origin-bottom-right ${
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="rounded-2xl shadow-2xl border border-border/50 overflow-hidden bg-background">
          <ChatPanel
            welcomeMessage={welcomeMessage}
            fallbackMessage={fallbackMessage}
            enableFeedback={enableFeedback}
            onClose={() => setIsOpen(false)}
          />
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleOpen}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 bg-gradient-to-br from-indigo-500 to-violet-500 cursor-pointer"
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <>
              <img src={ChatbotIcon} alt="Chat assistant" className="h-full w-full rounded-full" />
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full animate-ping bg-indigo-400/20" />
            </>
          )}
        </button>
      </div>
    </>
  );
}
