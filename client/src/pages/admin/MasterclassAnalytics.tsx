import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Eye,
  UserPlus,
  Percent,
  TrendingUp,
  ExternalLink,
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

const CHART_TOOLTIP_STYLE = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "6px",
  color: "#f1f5f9",
};

const BAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899",
];

export default function MasterclassAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const { startDate, endDate } = getDateRange(dateRange);

  const overviewQuery = trpc.funnelAdmin.masterclass.overview.useQuery({ startDate, endDate });
  const overTimeQuery = trpc.funnelAdmin.masterclass.overTime.useQuery({ startDate, endDate });
  const practiceTypeQuery = trpc.funnelAdmin.masterclass.byPracticeType.useQuery({ startDate, endDate });
  const recentLeadsQuery = trpc.funnelAdmin.masterclass.recentLeads.useQuery({ limit: 20 });

  const overview = overviewQuery.data;
  const overTimeData = overTimeQuery.data ?? [];
  const practiceTypeData = (practiceTypeQuery.data ?? []).map((r, i) => ({
    ...r,
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }));

  const avgDailyViews = overTimeData.length > 0
    ? Math.round(overTimeData.reduce((sum, d) => sum + d.views, 0) / overTimeData.length)
    : 0;

  const dateRangeButtons: DateRange[] = ["7d", "30d", "90d", "all"];

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Masterclass Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">
              Opt-in performance and lead insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://clarity.microsoft.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Clarity Heatmaps
            </a>
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
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Eye className="w-5 h-5 text-blue-500" />}
            iconBg="bg-blue-500/10"
            label="Total Views"
            value={overview?.totalViews?.toLocaleString() ?? "—"}
          />
          <KpiCard
            icon={<UserPlus className="w-5 h-5 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            label="Total Opt-Ins"
            value={overview?.totalOptIns?.toLocaleString() ?? "—"}
          />
          <KpiCard
            icon={<Percent className="w-5 h-5 text-purple-500" />}
            iconBg="bg-purple-500/10"
            label="Opt-In Rate"
            value={overview ? `${overview.optInRate.toFixed(1)}%` : "—"}
          />
          <KpiCard
            icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
            iconBg="bg-orange-500/10"
            label="Avg Daily Views"
            value={avgDailyViews.toLocaleString()}
          />
        </div>

        {/* Conversion Chart — Views vs Opt-Ins Over Time */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-white font-semibold text-lg">Views vs Opt-Ins</h2>
            <p className="text-slate-400 text-sm">Daily trend over selected period</p>
          </div>
          {overTimeQuery.isLoading ? (
            <div className="flex items-center justify-center h-[300px] text-slate-400">Loading...</div>
          ) : overTimeData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-slate-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={overTimeData} margin={{ top: 4, right: 24, bottom: 4, left: 16 }}>
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
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#3b82f6", stroke: "#1e293b", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="optIns"
                  name="Opt-Ins"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#10b981", stroke: "#1e293b", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Practice Type Breakdown */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-white font-semibold text-lg">Opt-Ins by Practice Type</h2>
            <p className="text-slate-400 text-sm">Which practice types convert best</p>
          </div>
          {practiceTypeQuery.isLoading ? (
            <div className="flex items-center justify-center h-[250px] text-slate-400">Loading...</div>
          ) : practiceTypeData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-slate-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={practiceTypeData}
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
                  dataKey="practiceType"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={115}
                />
                <Tooltip
                  cursor={{ fill: "rgba(51,65,85,0.4)" }}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value: number) => [value.toLocaleString(), "Opt-Ins"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {practiceTypeData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Leads Table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-white font-semibold text-lg">Recent Leads</h2>
            <p className="text-slate-400 text-sm">Last 20 masterclass opt-ins</p>
          </div>
          {recentLeadsQuery.isLoading ? (
            <div className="flex items-center justify-center h-[200px] text-slate-400">Loading...</div>
          ) : !recentLeadsQuery.data?.length ? (
            <div className="flex items-center justify-center h-[200px] text-slate-500">No leads yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Name</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Email</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Phone</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Practice Type</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Website</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeadsQuery.data.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-2 px-3 text-white">{lead.firstName}</td>
                      <td className="py-2 px-3 text-slate-300">{lead.email}</td>
                      <td className="py-2 px-3 text-slate-300">{lead.phone ?? "—"}</td>
                      <td className="py-2 px-3 text-slate-300">{lead.practiceType ?? "—"}</td>
                      <td className="py-2 px-3">
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 truncate max-w-[180px] inline-block"
                          >
                            {lead.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, iconBg, label, value }: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-start gap-3">
      <div className={`p-2 ${iconBg} rounded-lg`}>{icon}</div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-white text-xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}
