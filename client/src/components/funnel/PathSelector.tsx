import { BookOpen, Phone, ArrowRight } from "lucide-react";

interface PathSelectorProps {
  onSelectCourses: () => void;
  onSelectAgency: () => void;
}

export function PathSelector({ onSelectCourses, onSelectAgency }: PathSelectorProps) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Choose Your Path
        </p>
        <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--titan-text-primary)" }}>
          What's the Best Way to Grow Your Practice?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm" style={{ color: "var(--titan-text-secondary)" }}>
          Two proven paths. Same destination — a full schedule of new patients.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* DIY / Courses Path */}
        <button
          onClick={onSelectCourses}
          className="group relative rounded-2xl border-2 border-[var(--titan-border)] bg-white p-8 text-left shadow-sm transition-all hover:border-blue-400 hover:shadow-lg"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 transition-colors group-hover:bg-blue-100">
            <BookOpen className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="mb-2 text-xl font-bold" style={{ color: "var(--titan-text-primary)" }}>
            I Have Time to Learn the System
          </h3>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--titan-text-secondary)" }}>
            Get the exact Facebook ad playbook, templates, and training used by 500+ health practices. Master it at your own pace. Starting at $197.
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 transition-all group-hover:gap-3">
            See Course Options <ArrowRight className="h-4 w-4" />
          </div>
          <div className="absolute right-4 top-4 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Most Popular
          </div>
        </button>

        {/* Done-For-You / Agency Path */}
        <button
          onClick={onSelectAgency}
          className="group relative rounded-2xl border-2 border-[var(--titan-border)] bg-white p-8 text-left shadow-sm transition-all hover:border-indigo-400 hover:shadow-lg"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 transition-colors group-hover:bg-indigo-100">
            <Phone className="h-7 w-7 text-indigo-600" />
          </div>
          <h3 className="mb-2 text-xl font-bold" style={{ color: "var(--titan-text-primary)" }}>
            I'd Rather Invest and Save Time
          </h3>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--titan-text-secondary)" }}>
            Our team builds, launches, and manages your entire ad system. You focus on patients — we focus on filling your schedule.
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 transition-all group-hover:gap-3">
            Book a Free Strategy Call <ArrowRight className="h-4 w-4" />
          </div>
          <div className="absolute right-4 top-4 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            Done-For-You
          </div>
        </button>

      </div>
    </section>
  );
}
