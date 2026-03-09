import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatWidget } from '@/chatbot/components/chat-widget';
import { AdminApp } from '@/admin/admin-app';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export function App() {
  const [isAdmin] = useState(() => window.location.hash === '#admin');

  return (
    <QueryClientProvider client={queryClient}>
      {isAdmin ? (
        <AdminApp />
      ) : (
        <div className="min-h-screen bg-background text-foreground">
          <div className="flex items-center justify-center min-h-screen">
            <h1 className="text-2xl font-semibold text-muted-foreground">
              RAG AI Chatbot
            </h1>
          </div>
          <ChatWidget />
        </div>
      )}
    </QueryClientProvider>
  );
}
