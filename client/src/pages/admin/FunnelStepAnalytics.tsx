import { useRoute } from "wouter";
import { BarChart3, TrendingDown } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function FunnelStepAnalytics() {
  const [, params] = useRoute("/admin/builder/:id/analytics");
  const funnelId = params?.id ? Number(params.id) : null;

  const { data: funnel } = trpc.funnelBuilder.get.useQuery(
    { id: funnelId! },
    { enabled: funnelId !== null },
  );

  const { data: dropoff, isLoading } = trpc.funnelAnalytics.stepDropoff.useQuery(
    { funnelId: funnelId! },
    { enabled: funnelId !== null },
  );

  if (!funnelId) return <div className="p-6 text-slate-400">Invalid funnel ID</div>;

  const maxViews = dropoff ? Math.max(...dropoff.map(d => d.views), 1) : 1;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#E5C158]" />
          Step Analytics
        </h1>
        {funnel && <p className="text-slate-400 text-sm mt-1">{funnel.name}</p>}
      </div>

      {isLoading ? (
        <div className="text-slate-400 text-center py-12">Loading analytics...</div>
      ) : !dropoff?.length ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
          <TrendingDown className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No analytics data yet. Publish your funnel and share it to start collecting data.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dropoff.map((step, index) => {
            const pct = Math.round((step.views / maxViews) * 100);
            const prevViews = index > 0 ? dropoff[index - 1].views : step.views;
            const dropoffPct = prevViews > 0 ? Math.round(((prevViews - step.views) / prevViews) * 100) : 0;

            return (
              <div key={step.stepKey} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 w-6">{index + 1}</span>
                    <span className="text-white font-medium">{step.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-white font-mono">{step.views.toLocaleString()} views</span>
                    {index > 0 && dropoffPct > 0 && (
                      <span className="text-red-400 text-xs">-{dropoffPct}% drop</span>
                    )}
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E5C158] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
