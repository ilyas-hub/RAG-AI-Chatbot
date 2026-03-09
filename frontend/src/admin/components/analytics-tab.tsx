import { MessageSquare, Users, BarChart3, ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react';
import { useAnalytics } from '../hooks';

export function AnalyticsTab() {
  const { data, isLoading } = useAnalytics();

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading analytics...</div>;
  }
  if (!data) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">No analytics data available.</div>;
  }

  const helpfulRate = data.feedbackStats.total > 0
    ? Math.round((data.feedbackStats.helpful / data.feedbackStats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">Overview of chatbot usage and performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Conversations" value={data.totalConversations} color="indigo" />
        <StatCard icon={MessageSquare} label="Messages" value={data.totalMessages} color="violet" />
        <StatCard icon={TrendingUp} label="Avg msgs/conv" value={data.avgMessagesPerConversation} color="blue" />
        <StatCard icon={BarChart3} label="Feedback total" value={data.feedbackStats.total} color="emerald" />
      </div>

      {/* Feedback breakdown */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold">Feedback Breakdown</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
              <ThumbsUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">{data.feedbackStats.helpful}</p>
              <p className="text-xs text-muted-foreground">Helpful</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <ThumbsDown className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-red-500">{data.feedbackStats.notHelpful}</p>
              <p className="text-xs text-muted-foreground">Not helpful</p>
            </div>
          </div>
          {data.feedbackStats.total > 0 && (
            <div className="ml-auto">
              <p className="text-2xl font-bold text-foreground">{helpfulRate}%</p>
              <p className="text-xs text-muted-foreground">Satisfaction rate</p>
            </div>
          )}
        </div>
        {/* Simple bar */}
        {data.feedbackStats.total > 0 && (
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${helpfulRate}%` }} />
          </div>
        )}
      </div>

      {/* Top categories */}
      {data.topCategories.length > 0 && (
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold">Top FAQ Categories</h3>
          <div className="space-y-2">
            {data.topCategories.map((c, i) => {
              const maxCount = data.topCategories[0].count;
              const pct = maxCount > 0 ? (c.count / maxCount) * 100 : 0;
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="w-5 text-xs text-muted-foreground text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{c.category}</span>
                      <span className="text-xs text-muted-foreground">{c.count} FAQs</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const COLORS: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-600',
  violet: 'bg-violet-50 text-violet-600',
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
};

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${COLORS[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
