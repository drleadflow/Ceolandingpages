import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MuxVideoUploader } from "@/components/admin/MuxVideoUploader";
import {
  Film,
  Copy,
  Trash2,
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Code,
  ExternalLink,
} from "lucide-react";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ready: { label: "Ready", color: "text-emerald-400 bg-emerald-900/30 border-emerald-700/50", icon: <CheckCircle className="w-3 h-3" /> },
  preparing: { label: "Processing", color: "text-yellow-400 bg-yellow-900/30 border-yellow-700/50", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  errored: { label: "Error", color: "text-red-400 bg-red-900/30 border-red-700/50", icon: <AlertCircle className="w-3 h-3" /> },
};

export default function VideoLibrary() {
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const assetsQuery = trpc.funnelAdmin.mux.list.useQuery();
  const deleteMutation = trpc.funnelAdmin.mux.delete.useMutation({
    onSuccess: () => {
      utils.funnelAdmin.mux.list.invalidate();
      toast.success("Video deleted");
    },
    onError: () => toast.error("Failed to delete video"),
  });

  const statsQuery = trpc.funnelAdmin.analytics.videoEngagement.useQuery({});

  const assets = assetsQuery.data ?? [];
  const filtered = search
    ? assets.filter((a) =>
        (a.title ?? a.filename ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : assets;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleDelete = (muxAssetId: string) => {
    if (!confirm("Delete this video permanently?")) return;
    deleteMutation.mutate({ muxAssetId });
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Video Library</h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload and manage Mux-hosted videos
          </p>
        </div>

        {/* Quick Stats */}
        {statsQuery.data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Total Plays</p>
              <p className="text-white text-xl font-bold mt-0.5">
                {statsQuery.data.totalPlays.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Avg Watch Time</p>
              <p className="text-white text-xl font-bold mt-0.5">
                {formatDuration(statsQuery.data.avgWatchTime)}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Completion Rate</p>
              <p className="text-white text-xl font-bold mt-0.5">
                {statsQuery.data.completionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-white font-semibold mb-4">Upload Video</h2>
          <MuxVideoUploader
            onComplete={() => utils.funnelAdmin.mux.list.invalidate()}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Video Grid */}
        {assetsQuery.isLoading ? (
          <div className="text-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading videos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{search ? "No videos match your search" : "No videos uploaded yet"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((asset) => {
              const badge = STATUS_BADGE[asset.status] ?? STATUS_BADGE.preparing;
              return (
                <div
                  key={asset.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-slate-900 relative">
                    {asset.playbackId ? (
                      <img
                        src={`https://image.mux.com/${asset.playbackId}/thumbnail.webp?time=2`}
                        alt={asset.title ?? asset.filename ?? "Video"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-10 h-10 text-slate-600" />
                      </div>
                    )}
                    {/* Duration badge */}
                    {asset.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        {formatDuration(asset.duration)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {asset.title ?? asset.filename ?? "Untitled"}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {formatDate(asset.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${badge.color}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>

                    {/* Actions */}
                    {asset.playbackId && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => copyToClipboard(asset.playbackId!, "Playback ID")}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          Copy ID
                        </button>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `<mux-player playback-id="${asset.playbackId}" autoplay="muted"></mux-player>`,
                              "Embed code",
                            )
                          }
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                        >
                          <Code className="w-3 h-3" />
                          Embed
                        </button>
                        <a
                          href={`/v/${asset.playbackId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Preview
                        </a>
                        <button
                          onClick={() => handleDelete(asset.muxAssetId)}
                          disabled={deleteMutation.isPending}
                          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 px-2 py-1 rounded transition-colors ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
