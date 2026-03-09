import { useState } from 'react';
import { LayoutDashboard, Eye, EyeOff } from 'lucide-react';
import { testAdminAuth } from '../api';

interface AdminLoginProps {
  onSuccess: () => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;

    setLoading(true);
    setError('');

    try {
      const ok = await testAdminAuth(secret.trim());
      if (ok) {
        sessionStorage.setItem('admin-secret', secret.trim());
        onSuccess();
      } else {
        setError('Invalid admin secret');
      }
    } catch {
      setError('Cannot connect to backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb]">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-8 shadow-sm space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-lg font-semibold">Chatbot Admin</h1>
              <p className="text-sm text-muted-foreground">Enter your admin secret to continue</p>
            </div>
          </div>

          {/* Input */}
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin secret..."
              className="w-full rounded-lg border bg-background px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-colors"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !secret.trim()}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>

          <a href="/" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to chat
          </a>
        </form>
      </div>
    </div>
  );
}
