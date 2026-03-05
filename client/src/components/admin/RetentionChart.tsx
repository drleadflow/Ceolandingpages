import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RetentionPoint {
  second: number;
  percent: number;
  viewers: number;
}

interface RetentionChartProps {
  data: RetentionPoint[];
  totalViews: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RetentionChart({ data, totalViews }: RetentionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400">
        No retention data yet
      </div>
    );
  }

  // Sample data to avoid rendering thousands of points — show every Nth point
  const maxPoints = 200;
  const step = Math.max(1, Math.floor(data.length / maxPoints));
  const sampled = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Viewer Retention</h3>
        <span className="text-xs text-slate-400">{totalViews} total views</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={sampled} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="second"
            tickFormatter={formatTime}
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            width={45}
          />
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
            labelFormatter={(sec) => `Time: ${formatTime(Number(sec))}`}
            formatter={(value: number, _name: string, props: any) => [
              `${value}% (${props.payload.viewers} viewers)`,
              "Retention",
            ]}
          />
          <Area
            type="monotone"
            dataKey="percent"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#retentionGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
