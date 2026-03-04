import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Percent,
  Play,
  Clock,
  Film,
} from "lucide-react";

type DateRange = "7d" | "30d" | "90d" | "all";

function getDateRange(range: DateRange): { startDate?: string; endDate?: string } {
  if (range === "all") return {};
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const start = new Date(now);
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  start.setDate(start.getDate() - days);
  const startDate = start.toISOString().slice(0, 10);
  return { startDate, endDate };
}

function formatCents(cents: number): string {
  const dollars = Math.floor(cents / 100);
  return "$" + dollars.toLocaleString("en-US");
}

const FUNNEL_STEPS = [
  { key: "pageViews", label: "Page Views" },
  { key: "checkoutStarts", label: "Checkout Start" },
  { key: "purchases", label: "Purchase" },
  { key: "upsellViews", label: "Upsell View" },
  { key: "upsellAccepts", label: "Upsell Accept" },
  { key: "downsellViews", label: "Downsell View" },
  { key: "downsellAccepts", label: "Downsell Accept" },
];

const FUNNEL_COLORS = [
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#0ea5e9",
  "#06b6d4",
  "#10b981",
  "#059669",
];

export default function FunnelAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const { startDate, endDate } = getDateRange(dateRange);

  const funnelQuery = trpc.funnelAdmin.analytics.funnel.useQuery(
    { startDate, endDate },
  );

  const revenueQuery = trpc.funnelAdmin.analytics.revenue.useQuery(
    { startDate, endDate, groupBy: "day" },
  );

  const videoQuery = trpc.funnelAdmin.analytics.videoEngagement.useQuery(
    { startDate, endDate },
  );

  const funnelData = funnelQuery.data ?? {};
  const revenueData = revenueQuery.data ?? [];

  const totalRevenue: number = (funnelData as any).totalRevenue ?? 0;
  const totalPurchases: number = (funnelData as any).purchases ?? (funnelData as any).totalPurchases ?? 0;
  const totalPageViews: number = (funnelData as any).pageViews ?? 0;
  const avgOrderValue = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;
  const conversionRate =
    totalPageViews > 0 ? (totalPurchases / totalPageViews) * 100 : 0;

  const funnelChartData = FUNNEL_STEPS.map((step, i) => ({
    label: step.label,
    value: (funnelData as any)[step.key] ?? 0,
    fill: FUNNEL_COLORS[i],
  }));

  const revenueChartData = Array.isArray(revenueData)
    ? revenueData.map((row: any) => ({
        date: row.date ?? row.day ?? row.period ?? "",
        revenue: (row.revenue ?? 0) / 100,
      }))
    : [];

  const dateRangeButtons: DateRange[] = ["7d", "30d", "90d", "all"];

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Funnel Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">
              Track conversion performance and revenue
            </p>
          </div>
          {/* Date range selector */}
          <div className="flex gap-2">
            {dateRangeButtons.map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  dateRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                }`}
              >
                {range === "all" ? "All" : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Revenue</p>
              <p className="text-white text-xl font-bold mt-0.5">
                {formatCents(totalRevenue)}
              </p>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Orders</p>
              <p className="text-white text-xl font-bold mt-0.5">
                {totalPurchases.toLocaleString("en-US")}
              </p>
            </div>
          </div>

          {/* Avg Order Value */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Avg Order Value</p>
              <p className="text-white text-xl font-bold mt-0.5">
                {formatCents(avgOrderValue)}
              </p>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Percent className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Conversion Rate</p>
              <p className="text-white text-xl font-bold mt-0.5">
                {conversionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-white font-semibold text-lg">Funnel Drop-off</h2>
            <p className="text-slate-400 text-sm">
              Step-by-step conversion through the funnel
            </p>
          </div>
          {funnelQuery.isLoading ? (
            <div className="flex items-center justify-center h-[300px] text-slate-400">
              Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={funnelChartData}
                layout="vertical"
                margin={{ top: 0, right: 24, bottom: 0, left: 120 }}
              >
                <CartesianGrid horizontal={false} stroke="#334155" />
                <XAxis
                  type="number"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={{ stroke: "#334155" }}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={115}
                />
                <Tooltip
                  cursor={{ fill: "rgba(51,65,85,0.4)" }}
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    color: "#f1f5f9",
                  }}
                  formatter={(value: number) => [
                    value.toLocaleString("en-US"),
                    "Count",
                  ]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelChartData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Over Time */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-white font-semibold text-lg">Revenue Over Time</h2>
            <p className="text-slate-400 text-sm">Daily revenue in USD</p>
          </div>
          {revenueQuery.isLoading ? (
            <div className="flex items-center justify-center h-[300px] text-slate-400">
              Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={revenueChartData}
                margin={{ top: 4, right: 24, bottom: 4, left: 16 }}
              >
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={{ stroke: "#334155" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={{ stroke: "#334155" }}
                  tickFormatter={(v: number) => `$${v.toLocaleString("en-US")}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    color: "#f1f5f9",
                  }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    "Revenue",
                  ]}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#3b82f6", stroke: "#1e293b", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Video Engagement */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-white font-semibold text-lg">Video Engagement</h2>
            <p className="text-slate-400 text-sm">
              Watch metrics and milestone completion
            </p>
          </div>
          {videoQuery.isLoading ? (
            <div className="flex items-center justify-center h-[200px] text-slate-400">
              Loading...
            </div>
          ) : videoQuery.data ? (
            <div className="space-y-6">
              {/* KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Play className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Plays</p>
                    <p className="text-white text-xl font-bold mt-0.5">
                      {videoQuery.data.totalPlays.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Avg Watch Time</p>
                    <p className="text-white text-xl font-bold mt-0.5">
                      {videoQuery.data.avgWatchTime}s
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Film className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Completion Rate</p>
                    <p className="text-white text-xl font-bold mt-0.5">
                      {videoQuery.data.completionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Milestone funnel */}
              <div>
                <p className="text-slate-400 text-sm mb-3">Milestone Funnel</p>
                <div className="space-y-2">
                  {[
                    { label: "Plays", value: videoQuery.data.totalPlays },
                    ...(videoQuery.data.milestones ?? []).map((m) => ({
                      label: m.milestone.replace("video_milestone_", "") + "%",
                      value: m.count,
                    })),
                  ].map((step, i) => {
                    const maxVal = videoQuery.data!.totalPlays || 1;
                    const pct = (step.value / maxVal) * 100;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm w-16 text-right">
                          {step.label}
                        </span>
                        <div className="flex-1 bg-slate-700 rounded-full h-5 relative overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${Math.max(pct, 1)}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium">
                            {step.value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No video data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
