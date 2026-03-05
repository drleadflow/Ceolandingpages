interface SeekZone {
  second: number;
  skips: number;
  rewinds: number;
}

interface SeekHeatmapBarProps {
  zones: SeekZone[];
  totalViews: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SeekHeatmapBar({ zones, totalViews }: SeekHeatmapBarProps) {
  if (zones.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 text-sm">
        No seek data yet
      </div>
    );
  }

  const maxActivity = Math.max(...zones.map((z) => z.skips + z.rewinds), 1);

  // Sample for rendering
  const maxBars = 300;
  const step = Math.max(1, Math.floor(zones.length / maxBars));
  const sampled = zones.filter((_, i) => i % step === 0);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Seek Heatmap</h3>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-pink-500/80" /> Skipped
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500/80" /> Rewound
          </span>
        </div>
      </div>

      {/* Heatmap bar */}
      <div className="group relative flex h-10 w-full overflow-hidden rounded-md bg-slate-900">
        {sampled.map((zone) => {
          const skipIntensity = totalViews > 0 ? zone.skips / maxActivity : 0;
          const rewindIntensity = totalViews > 0 ? zone.rewinds / maxActivity : 0;

          let bg = "transparent";
          if (skipIntensity > rewindIntensity && skipIntensity > 0.05) {
            bg = `rgba(236, 72, 153, ${Math.min(skipIntensity * 0.9, 0.85)})`;
          } else if (rewindIntensity > 0.05) {
            bg = `rgba(59, 130, 246, ${Math.min(rewindIntensity * 0.9, 0.85)})`;
          }

          return (
            <div
              key={zone.second}
              className="h-full flex-1"
              style={{ backgroundColor: bg }}
              title={`${formatTime(zone.second)} — ${zone.skips} skips, ${zone.rewinds} rewinds`}
            />
          );
        })}
      </div>

      {/* Time labels */}
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>0:00</span>
        {zones.length > 0 && <span>{formatTime(Math.floor(zones.length / 2))}</span>}
        {zones.length > 0 && <span>{formatTime(zones.length)}</span>}
      </div>
    </div>
  );
}
