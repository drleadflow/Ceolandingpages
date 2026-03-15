import {
  Activity,
  FlaskConical,
  Clock,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertCircle,
  Calendar,
  LayoutList,
} from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
};

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center gap-4">
      <div className="text-[#E5C158] shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

type StatusBadgeProps = {
  status: "live" | "measuring" | "complete" | "baseline" | "infrastructure";
};

function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<StatusBadgeProps["status"], { label: string; classes: string }> = {
    live: { label: "Live — Monitoring", classes: "bg-emerald-900/50 text-emerald-400 border border-emerald-800" },
    measuring: { label: "Measuring", classes: "bg-blue-900/50 text-blue-400 border border-blue-800" },
    complete: { label: "Complete", classes: "bg-slate-700 text-slate-300 border border-slate-600" },
    baseline: { label: "Baseline", classes: "bg-amber-900/50 text-amber-400 border border-amber-800" },
    infrastructure: { label: "Infrastructure", classes: "bg-purple-900/50 text-purple-400 border border-purple-800" },
  };
  const { label, classes } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}>
      {status === "live" && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      {label}
    </span>
  );
}

type TypeBadgeProps = {
  type: "cro" | "infrastructure";
};

function TypeBadge({ type }: TypeBadgeProps) {
  if (type === "cro") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#E5C158]/10 text-[#E5C158] border border-[#E5C158]/30">
        CRO Improvement
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900/40 text-purple-300 border border-purple-800">
      Infrastructure
    </span>
  );
}

const STATS = [
  { label: "Funnel Pages Tracked", value: 9, icon: <LayoutList className="w-5 h-5" /> },
  { label: "Active Experiments", value: 1, icon: <FlaskConical className="w-5 h-5" /> },
  { label: "Changes This Month", value: 2, icon: <TrendingUp className="w-5 h-5" /> },
  { label: "Days Since Last Change", value: 0, icon: <Clock className="w-5 h-5" /> },
];

const CHANGELOG = [
  {
    id: "002",
    date: "Mar 14, 2026",
    type: "cro" as const,
    title: "Sticky CTA Bar + Pulsing Video Play Button",
    description:
      "Added a persistent bottom CTA bar and animated pulsing ring on the video play button to increase modal open rate and video engagement on /masterclass.",
    status: "live" as const,
    page: "/masterclass",
  },
  {
    id: "001",
    date: "Mar 12, 2026",
    type: "infrastructure" as const,
    title: "PostHog Tracking Installation",
    description:
      "Installed PostHog session recording and event tracking across all funnel pages. Configured custom events for modal opens, video plays, and form submissions.",
    status: "baseline" as const,
    page: "All funnel pages",
  },
];

export default function CroDashboard() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-[#E5C158]" />
        <div>
          <h1 className="text-xl font-bold text-white">CRO Dashboard</h1>
          <p className="text-sm text-slate-400">Conversion Rate Optimization — Mission Control</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      {/* Hero: What We're Focused On Right Now */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
              What We're Focused On Right Now
            </p>
            <h2 className="text-lg font-bold text-white">Mission Control</h2>
          </div>
          <StatusBadge status="live" />
        </div>

        <div className="mt-5 grid md:grid-cols-3 gap-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Focus</p>
            <p className="text-slate-200 text-sm leading-relaxed">
              Increasing masterclass opt-in rate from{" "}
              <span className="text-[#E5C158] font-semibold">6.7%</span> to{" "}
              <span className="text-[#E5C158] font-semibold">20%+</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Strategy</p>
            <p className="text-slate-200 text-sm leading-relaxed">
              Added sticky CTA bar + pulsing video play button. Monitoring PostHog data for 48 hours.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Key Metric to Watch</p>
            <p className="text-slate-200 text-sm leading-relaxed">
              Modal open rate on{" "}
              <span className="font-mono text-[#E5C158] text-xs">/masterclass</span>
            </p>
            <p className="text-slate-500 text-xs mt-1">via PostHog → Events → modal_open</p>
          </div>
        </div>
      </div>

      {/* Active Experiments */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4 text-[#E5C158]" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Active Experiments</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Experiment #002 */}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">#002</span>
                <h3 className="text-white font-semibold">
                  Sticky CTA Bar + Pulsing Video Play Button
                </h3>
              </div>
              <StatusBadge status="live" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-slate-500">Page:</span>
              <span className="font-mono text-xs text-[#E5C158] bg-[#E5C158]/10 px-2 py-0.5 rounded border border-[#E5C158]/20">
                /masterclass
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Started Mar 14, 2026
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Hypothesis */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 space-y-1.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hypothesis</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Visitors who don't immediately engage with the video are leaving without ever seeing the opt-in modal.
                  A persistent CTA and a visually prominent play button will prompt more interaction and push modal open
                  rate above 20%.
                </p>
              </div>

              {/* Before metrics */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Before (Baseline)</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Modal open rate</span>
                    <span className="text-sm font-bold text-slate-200">6.7%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-slate-500 h-1.5 rounded-full" style={{ width: "6.7%" }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Video plays</span>
                    <span className="text-sm font-bold text-slate-200">0</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-slate-500 h-1.5 rounded-full" style={{ width: "1%" }} />
                  </div>
                </div>
              </div>

              {/* Target */}
              <div className="bg-slate-800/60 border border-[#E5C158]/20 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-[#E5C158]/70 uppercase tracking-wider">Target</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Modal open rate</span>
                    <span className="text-sm font-bold text-[#E5C158]">&gt;20%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-[#E5C158] h-1.5 rounded-full" style={{ width: "20%" }} />
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <Target className="w-3.5 h-3.5 text-[#E5C158] mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      3× improvement in modal engagement. Measured via PostHog over a 48-hour window.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CRO Changelog */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <LayoutList className="w-4 h-4 text-[#E5C158]" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">CRO Changelog</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
          {CHANGELOG.map((entry, index) => (
            <div key={entry.id} className="p-5 flex gap-5">
              {/* Timeline dot */}
              <div className="flex flex-col items-center shrink-0 pt-1">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    index === 0
                      ? "border-emerald-500 bg-emerald-900/40 text-emerald-400"
                      : "border-slate-600 bg-slate-800 text-slate-400"
                  }`}
                >
                  {entry.id}
                </div>
                {index < CHANGELOG.length - 1 && (
                  <div className="w-px flex-1 bg-slate-800 mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TypeBadge type={entry.type} />
                    <h3 className="text-white font-medium text-sm">{entry.title}</h3>
                  </div>
                  <StatusBadge status={entry.status} />
                </div>

                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {entry.date}
                  </span>
                  <span className="text-slate-600 text-xs">•</span>
                  <span className="text-xs text-slate-500">
                    Page:{" "}
                    <span className="font-mono text-slate-400">{entry.page}</span>
                  </span>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed">{entry.description}</p>

                {entry.status === "live" && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Actively collecting data — check PostHog in 48 hours
                  </div>
                )}
                {entry.status === "baseline" && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Baseline established — tracking active
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
