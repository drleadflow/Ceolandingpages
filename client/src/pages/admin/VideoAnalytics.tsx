import { useState } from "react";
import { BarChart3, Play, Clock, Eye, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { RetentionChart } from "@/components/admin/RetentionChart";
import { SeekHeatmapBar } from "@/components/admin/SeekHeatmapBar";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function VideoAnalytics() {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const statsQuery = trpc.videoHeatmap.getVideoStats.useQuery({});
  const stats = statsQuery.data ?? [];

  const retentionQuery = trpc.videoHeatmap.getRetention.useQuery(
    { videoId: selectedVideoId! },
    { enabled: !!selectedVideoId },
  );

  const seekQuery = trpc.videoHeatmap.getSeekZones.useQuery(
    { videoId: selectedVideoId! },
    { enabled: !!selectedVideoId },
  );

  // Aggregate stats
  const totalViews = stats.reduce((sum, s) => sum + s.totalViews, 0);
  const avgCompletion = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + s.avgCompletionPercent, 0) / stats.length)
    : 0;
  const avgWatchTime = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + s.avgWatchTimeSec, 0) / stats.length)
    : 0;

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">Video Analytics</h1>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Eye className="h-5 w-5" />} label="Total Views" value={String(totalViews)} color="blue" />
        <StatCard icon={<Play className="h-5 w-5" />} label="Videos Tracked" value={String(stats.length)} color="emerald" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Avg Completion" value={`${avgCompletion}%`} color="amber" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Avg Watch Time" value={formatDuration(avgWatchTime)} color="purple" />
      </div>

      {/* Video List */}
      <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        <div className="border-b border-slate-700 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Videos</h2>
        </div>
        {stats.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            No video heatmap data yet. Views will appear once visitors watch videos on funnel pages.
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {stats.map((video) => (
              <button
                key={`${video.videoId}-${video.pageSlug}`}
                onClick={() => setSelectedVideoId(video.videoId)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-700/30 ${
                  selectedVideoId === video.videoId ? "bg-slate-700/50" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{video.videoId}</p>
                  <p className="text-xs text-slate-400">Page: {video.pageSlug}</p>
                </div>
                <div className="ml-4 flex items-center gap-6 text-xs text-slate-400">
                  <span>{video.totalViews} views</span>
                  <span>{video.avgCompletionPercent}% avg</span>
                  <span>{formatDuration(video.avgWatchTimeSec)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Video Detail */}
      {selectedVideoId && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Detail:</h2>
            <span className="truncate text-sm text-slate-400">{selectedVideoId}</span>
          </div>

          <RetentionChart
            data={retentionQuery.data?.retention ?? []}
            totalViews={retentionQuery.data?.totalViews ?? 0}
          />

          <SeekHeatmapBar
            zones={seekQuery.data?.zones ?? []}
            totalViews={seekQuery.data?.totalViews ?? 0}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "emerald" | "amber" | "purple";
}) {
  const colorMap = {
    blue: "text-blue-400 bg-blue-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    purple: "text-purple-400 bg-purple-500/10",
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-lg p-1.5 ${colorMap[color]}`}>{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
