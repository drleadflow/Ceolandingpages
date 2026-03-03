import { useEffect, useState } from "react";
import { CheckCircle2, TrendingUp, Users, Target, Shield, ChevronDown, Phone, BarChart3, Zap, Clock } from "lucide-react";
import { FunnelNav } from "@/components/funnel/FunnelNav";
import { SenjaTestimonials } from "@/components/funnel/SenjaTestimonials";
import { getSessionId } from "@/lib/funnelTracking";
import { usePixelTracking } from "@/hooks/usePixelTracking";
import { trpc } from "@/lib/trpc";

const GHL_BOOKING_URL = "https://links.doctorleadflow.com/widget/booking/9UjOQl0JVnNqG41Uboyh";

const RESULTS = [
  { metric: "500+", label: "Health Practices Served" },
  { metric: "3.2x", label: "Average ROAS" },
  { metric: "20+", label: "New Patients/Month" },
  { metric: "4.9/5", label: "Client Rating" },
];

const PROCESS_STEPS = [
  {
    icon: Phone,
    title: "Free Strategy Call",
    description: "We audit your current marketing and identify the biggest growth opportunities for your practice.",
  },
  {
    icon: Target,
    title: "Custom Campaign Build",
    description: "Our team builds your entire Facebook ad system — targeting, creative, landing pages, and follow-up.",
  },
  {
    icon: BarChart3,
    title: "Launch & Optimize",
    description: "We launch your campaigns and continuously optimize for the lowest cost per lead and highest quality patients.",
  },
  {
    icon: TrendingUp,
    title: "Scale Profitably",
    description: "Once we find what works, we scale your budget and patient volume while maintaining or improving ROI.",
  },
];

const INCLUDES = [
  "Full Facebook & Instagram ad management",
  "Custom audience research & targeting",
  "Ad creative design & copywriting",
  "Landing page build & optimization",
  "Lead follow-up automation setup",
  "Weekly performance reports",
  "Monthly strategy calls",
  "Dedicated account manager",
];

const FAQ_ITEMS = [
  {
    q: "How much do I need to spend on ads?",
    a: "We recommend a minimum of $30-50/day in ad spend to start. This is separate from our management fee. Most clients scale to $100-200/day within 60-90 days as they see results.",
  },
  {
    q: "How quickly will I see results?",
    a: "Most clients start seeing leads within the first week of launching. It typically takes 2-4 weeks to optimize campaigns for peak performance, and 60-90 days to build a reliable, scalable system.",
  },
  {
    q: "What makes you different from other agencies?",
    a: "We exclusively serve health professionals. Every strategy, ad template, and funnel is built specifically for practices like yours. We're not generalists — this is all we do.",
  },
  {
    q: "Is there a long-term contract?",
    a: "No. We work on a month-to-month basis. We believe in earning your business every month through results, not locking you into a contract.",
  },
  {
    q: "What if I've tried Facebook ads before and they didn't work?",
    a: "Most practices that fail with Facebook ads were using generic strategies not built for healthcare. On your strategy call, we'll review what went wrong and show you exactly what we'd do differently.",
  },
];

export default function AgencyPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const sessionId = getSessionId();
  const { fireEvent } = usePixelTracking("agency");
  const trackEvent = trpc.funnelAdmin.events.track.useMutation();

  useEffect(() => {
    if (sessionId) {
      trackEvent.mutate({
        sessionId,
        eventType: "page_view",
        pageSlug: "agency",
      });
      fireEvent("page_view");
    }
  }, [sessionId]);

  const scrollToBooking = () => {
    document.getElementById("agency-booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--titan-background)" }}>
      <FunnelNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mb-4 inline-block rounded-full bg-indigo-50 px-4 py-1 text-sm font-semibold text-indigo-600">
          Done-For-You Patient Acquisition
        </div>
        <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl" style={{ color: "var(--titan-text-primary)" }}>
          We'll Fill Your Practice With{" "}
          <span style={{ background: "var(--titan-grad-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            20+ New Patients Per Month
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg" style={{ color: "var(--titan-text-secondary)" }}>
          Stop guessing with your marketing. Our team builds, manages, and scales your entire Facebook ad system — so you can focus on what you do best: treating patients.
        </p>
        <button
          onClick={scrollToBooking}
          className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl"
          style={{ background: "linear-gradient(135deg, var(--titan-gold) 0%, var(--titan-gold-hover) 100%)" }}
        >
          Book Your Free Strategy Call
        </button>
        <p className="mt-3 text-sm" style={{ color: "var(--titan-text-muted)" }}>
          No obligation. No pressure. Just a clear plan to grow your practice.
        </p>
      </section>

      {/* Results Bar */}
      <section className="border-y border-[var(--titan-border)] bg-white py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-10 px-4">
          {RESULTS.map(({ metric, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold" style={{ background: "var(--titan-grad-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {metric}
              </div>
              <div className="mt-1 text-xs font-medium" style={{ color: "var(--titan-text-secondary)" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl" style={{ color: "var(--titan-text-primary)" }}>
          How It Works
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {PROCESS_STEPS.map(({ icon: Icon, title, description }, i) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-[var(--titan-border)] bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <Icon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="font-bold" style={{ color: "var(--titan-text-primary)" }}>{title}</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--titan-text-secondary)" }}>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl" style={{ color: "var(--titan-text-primary)" }}>
            What's Included
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {INCLUDES.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-[var(--titan-border)] bg-[var(--titan-background)] px-4 py-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                <span className="text-sm font-medium" style={{ color: "var(--titan-text-primary)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold" style={{ color: "var(--titan-text-primary)" }}>
            What Our Clients Say
          </h2>
          <SenjaTestimonials />
        </div>
      </section>

      {/* Book a Call Section */}
      <section id="agency-booking" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--titan-text-primary)" }}>
              Book Your Free Strategy Call
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm" style={{ color: "var(--titan-text-secondary)" }}>
              In 30 minutes, we'll audit your current marketing, identify your biggest growth opportunities, and map out a custom plan for your practice.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Calendar */}
            <div className="overflow-hidden rounded-2xl border border-[var(--titan-border)] bg-white shadow-sm">
              <iframe
                src={GHL_BOOKING_URL}
                className="h-[700px] w-full border-0"
                title="Book Your Strategy Call"
                allow="camera; microphone"
              />
            </div>

            {/* What You'll Get */}
            <div>
              <div className="mb-6 rounded-2xl border border-[var(--titan-border)] bg-[var(--titan-background)] p-6">
                <h3 className="mb-4 text-lg font-semibold" style={{ color: "var(--titan-text-primary)" }}>
                  On Your Call, You'll Get:
                </h3>
                <div className="space-y-4">
                  {[
                    { icon: BarChart3, text: "A full audit of your current marketing efforts" },
                    { icon: Target, text: "Your ideal patient targeting strategy" },
                    { icon: Zap, text: "A custom campaign blueprint for your practice" },
                    { icon: TrendingUp, text: "Projected ROI based on your local market" },
                    { icon: Clock, text: "A clear timeline to your first 20 new patients" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                        <Icon className="h-4 w-4 text-indigo-600" />
                      </div>
                      <p className="pt-1.5 text-sm" style={{ color: "var(--titan-text-primary)" }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Signals */}
              <div className="flex items-start gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-800">No Obligation, No Pressure</h4>
                  <p className="mt-1 text-sm leading-relaxed text-emerald-700">
                    This is a genuine strategy session, not a high-pressure sales call. If we're not a fit, we'll tell you — and you'll still walk away with a clear growth plan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-4 py-16">
        <h2 className="mb-6 text-center text-2xl font-bold" style={{ color: "var(--titan-text-primary)" }}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="rounded-xl border border-[var(--titan-border)] bg-white">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold" style={{ color: "var(--titan-text-primary)" }}>{item.q}</span>
                <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} style={{ color: "var(--titan-text-secondary)" }} />
              </button>
              {openFaq === i && (
                <div className="border-t border-[var(--titan-border)] px-5 py-4">
                  <p className="text-sm leading-relaxed" style={{ color: "var(--titan-text-secondary)" }}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[var(--titan-border)] bg-white py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold md:text-3xl" style={{ color: "var(--titan-text-primary)" }}>
          Ready to Fill Your Practice?
        </h2>
        <p className="mx-auto mb-6 max-w-lg text-sm" style={{ color: "var(--titan-text-secondary)" }}>
          Join 500+ health professionals who have transformed their patient acquisition with our done-for-you system.
        </p>
        <button
          onClick={scrollToBooking}
          className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl"
          style={{ background: "linear-gradient(135deg, var(--titan-gold) 0%, var(--titan-gold-hover) 100%)" }}
        >
          Book Your Free Strategy Call
        </button>
      </section>
    </div>
  );
}
