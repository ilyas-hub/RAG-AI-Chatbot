import { useState } from 'react';
import { LayoutDashboard, MessageSquare, Database, Settings, BarChart3, LogOut } from 'lucide-react';
import { FaqTab } from './faq-tab';
import { KbTab } from './kb-tab';
import { ConfigTab } from './config-tab';
import { AnalyticsTab } from './analytics-tab';

const TABS = [
  { id: 'faq', label: 'FAQ', icon: MessageSquare },
  { id: 'kb', label: 'Knowledge Bases', icon: Database },
  { id: 'config', label: 'Settings', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function AdminLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('faq');

  const handleLogout = () => {
    sessionStorage.removeItem('admin-secret');
    window.location.hash = '';
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-base font-semibold">Chatbot Admin</h1>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View Chat
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-6">
        {activeTab === 'faq' && <FaqTab />}
        {activeTab === 'kb' && <KbTab />}
        {activeTab === 'config' && <ConfigTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </main>
    </div>
  );
}
