/**
 * Chat UI state store (Zustand)
 */

import { create } from 'zustand';

interface ChatState {
  isOpen: boolean;
  isStreaming: boolean;
  activeConversationId: string | null;

  // Actions
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setActiveConversationId: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  isOpen: false,
  isStreaming: false,
  activeConversationId: null,
};

export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
  reset: () => set(initialState),
}));
