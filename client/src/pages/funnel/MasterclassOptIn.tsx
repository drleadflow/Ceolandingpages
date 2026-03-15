import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePixelTracking } from "@/hooks/usePixelTracking";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";
import posthog from "posthog-js";
import { getSessionId } from "@/lib/funnelTracking";
import { trpc } from "@/lib/trpc";
import { FunnelNav } from "@/components/funnel/FunnelNav";
import {
  CheckCircle2,
  Shield,
  Play,
  ArrowRight,
  Users,
  TrendingUp,
  Award,
  X,
  BookOpen,
  Target,
  BarChart3,
  Clock,
  Zap,
  Lightbulb,
} from "lucide-react";

// ── Schema ────────────────────────────────────────────────────────────────────

const PRACTICE_TYPES = [
  "IV Hydration",
  "Med Spa",
  "Dental Clinic",
  "Chiropractic",
  "Physical Therapy",
  "Aesthetic Clinic",
  "Other",
] as const;

const optInSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Phone number is required"),
  practiceType: z.string().min(1, "Practice type is required"),
  website: z.string(),
});

type OptInValues = z.infer<typeof optInSchema>;

// ── Data ──────────────────────────────────────────────────────────────────────

const VIDEO_TOPICS = [
  {
    icon: Target,
    title: "The Marketing Pyramid",
    desc: "Why 97% of your market is being ignored — and how to reach them",
  },
  {
    icon: Lightbulb,
    title: "5 Levels of Awareness",
    desc: "How to speak to cold, warm, and hot prospects differently",
  },
  {
    icon: BookOpen,
    title: "FB Ad Library Research",
    desc: "How to reverse-engineer winning ads that are already profitable",
  },
  {
    icon: BarChart3,
    title: "4 Ad Angles That Convert",
    desc: "Pain, curiosity, social proof, and news — reach the same person 4 ways",
  },
  {
    icon: TrendingUp,
    title: "The Metrics That Matter",
    desc: "CTR, CPC, and knowing exactly what to kill vs. scale",
  },
  {
    icon: Clock,
    title: "Speed to Lead",
    desc: "Why a 5-minute response is 21x more likely to book a patient",
  },
];

// ── Preview video config ──────────────────────────────────────────────────────
// Looping muted MP4 that plays automatically to look like a GIF
const PREVIEW_VIDEO = "/masterclass-preview.mp4";

// ── Component ─────────────────────────────────────────────────────────────────

export default function MasterclassOptIn() {
  const [, navigate] = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);

  // If already opted in, skip straight to the sales page
  useEffect(() => {
    if (sessionStorage.getItem("masterclass_lead")) {
      navigate("/fb-ads-course", { replace: true });
    }
  }, [navigate]);

  const { fireEvent } = usePixelTracking("masterclass");
  usePostHogEvents("masterclass");

  // Dual-tracking: database events + pixel events (same pattern as SalesPage)
  const trackEvent = trpc.funnelAdmin.events.track.useMutation();
  const sessionId = getSessionId();

  useEffect(() => {
    if (sessionId) {
      trackEvent.mutate({
        sessionId,
        eventType: "page_view",
        pageSlug: "masterclass",
        metadata: JSON.stringify({ ref: new URLSearchParams(window.location.search).get("ref") ?? undefined }),
      });
      fireEvent("page_view");
    }
  }, [sessionId]);

  const submitLead = trpc.roadmap.submitMasterclassLead.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OptInValues>({
    resolver: zodResolver(optInSchema),
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
      setShowStickyCta(false);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showModal]);

  // Show sticky CTA bar after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowStickyCta(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async (data: OptInValues) => {
    setIsSubmitting(true);
    posthog.capture("masterclass_lead_submitted", {
      page: "masterclass",
      practice_type: data.practiceType,
      has_website: Boolean(data.website?.trim()),
    });
    fireEvent("checkout_start");
    try {
      // Normalize website: auto-prepend https:// if needed, or omit if empty
      let website: string | undefined;
      if (data.website && data.website.trim() !== "") {
        const trimmed = data.website.trim();
        website = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      }

      // Fire webhook + tracking server-side (don't block navigation)
      submitLead.mutate({
        firstName: data.firstName,
        email: data.email,
        phone: data.phone,
        practiceType: data.practiceType,
        website,
      });

      sessionStorage.setItem(
        "masterclass_lead",
        JSON.stringify({ firstName: data.firstName, email: data.email, phone: data.phone, practiceType: data.practiceType, website }),
      );
      navigate("/fb-ads-course");
    } catch {
      navigate("/fb-ads-course");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--titan-background)" }}>
      <FunnelNav />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="mb-4 inline-block rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-600">
          For Health Professionals Only
        </div>

        <h1
          className="mb-4 text-4xl font-bold leading-tight md:text-5xl"
          style={{ color: "var(--titan-text-primary)" }}
        >
          The Exact Facebook Ad System That Fills Health Practices With{" "}
          <span
            style={{
              background: "var(--titan-grad-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            20+ New Patients Per Month
          </span>
        </h1>

        <p
          className="mx-auto mb-8 max-w-2xl text-lg"
          style={{ color: "var(--titan-text-secondary)" }}
        >
          Stop wasting money on ads that don't convert. Learn the proven system used by
          500+ health professionals to predictably generate high-quality patient leads on
          autopilot.
        </p>

        {/* ── Video Thumbnail with Play Gate ──────────────────────────────────── */}
        <div className="mx-auto mb-8 max-w-3xl">
          <button
            onClick={() => {
              setShowModal(true);
              posthog.capture("optin_modal_opened", { page: "masterclass", trigger: "video_play_button" });
            }}
            className="relative w-full overflow-hidden rounded-2xl border border-[var(--titan-border)] bg-gray-900 shadow-xl group cursor-pointer"
            style={{ aspectRatio: "16/9" }}
          >
            {/* Looping muted preview video (looks like a GIF) */}
            <video
              src={PREVIEW_VIDEO}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />

            {/* Top badge */}
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wide shadow-lg">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                Free Training
              </span>
            </div>

            {/* Play button with pulse glow */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                {/* Pulse ring */}
                <div className="absolute inset-0 h-20 w-20 rounded-full bg-white/30 animate-[pulse-ring_2s_ease-out_infinite]" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition group-hover:bg-white/40 group-hover:scale-110 shadow-2xl">
                  <Play className="ml-1 h-8 w-8 text-white drop-shadow-lg" fill="white" />
                </div>
              </div>
              <span className="text-white text-sm font-semibold drop-shadow-lg tracking-wide">
                Click to Watch Now
              </span>
            </div>

            {/* Bottom label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-4">
              <p className="text-white text-sm font-semibold">
                The exact Facebook ad system for health professionals
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* ── Social Proof Bar ──────────────────────────────────────────────────── */}
      <section className="border-y border-[var(--titan-border)] bg-white py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-4">
          {[
            { icon: Users, label: "500+ Students" },
            { icon: TrendingUp, label: "3.2x Avg. ROI" },
            { icon: Award, label: "4.9/5 Rating" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-blue-500" />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--titan-text-primary)" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── What You'll Learn in This Training ────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2
          className="mb-2 text-center text-2xl font-bold"
          style={{ color: "var(--titan-text-primary)" }}
        >
          What You'll Learn in This Free Training
        </h2>
        <p
          className="mx-auto mb-10 max-w-xl text-center"
          style={{ color: "var(--titan-text-secondary)" }}
        >
          A complete Facebook ad framework built specifically for clinics — not generic
          marketing advice.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {VIDEO_TOPICS.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-xl border border-[var(--titan-border)] bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(99,102,241,0.1))" }}
              >
                <item.icon className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3
                  className="font-semibold"
                  style={{ color: "var(--titan-text-primary)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="mt-0.5 text-sm leading-relaxed"
                  style={{ color: "var(--titan-text-secondary)" }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA below topics */}
        <div className="mt-10 text-center">
          <button
            onClick={() => {
              setShowModal(true);
              posthog.capture("optin_modal_opened", { page: "masterclass", trigger: "watch_training_cta" });
            }}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "var(--titan-grad-primary)" }}
          >
            Watch The Free Training
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* ── Who This Is For ───────────────────────────────────────────────────── */}
      <section className="border-t border-[var(--titan-border)] bg-white py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2
            className="mb-8 text-center text-2xl font-bold"
            style={{ color: "var(--titan-text-primary)" }}
          >
            This Training Is For You If…
          </h2>

          <div className="space-y-4">
            {[
              "You're a healthcare provider who wants to attract more patients with paid ads",
              "You've tried Facebook ads before but couldn't make them profitable",
              "You're outsourcing your marketing but don't understand what's going on",
              "You want a predictable patient acquisition system — not just referrals and hope",
              "You're ready to invest in learning the #1 skill that grows your practice",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500 mt-0.5" />
                <span style={{ color: "var(--titan-text-primary)" }}>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => {
                setShowModal(true);
                posthog.capture("optin_modal_opened", { page: "masterclass", trigger: "get_free_access_cta" });
              }}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "var(--titan-grad-primary)" }}
            >
              Get Free Access Now
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── About / Credibility ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="overflow-hidden rounded-2xl border border-[var(--titan-border)] bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Left: Large Photo */}
            <div className="lg:col-span-2 relative min-h-[320px] lg:min-h-[480px]" style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #ede9fe 100%)" }}>
              <img
                src="/dr-emeka-headshot.png"
                alt="Dr. Emeka Ajufo"
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            </div>

            {/* Right: Credentials */}
            <div className="lg:col-span-3 p-8 flex flex-col justify-center">
              <h3
                className="text-2xl font-bold mb-1"
                style={{ color: "var(--titan-text-primary)" }}
              >
                Dr. Emeka Ajufo
              </h3>
              <p className="text-sm mb-5" style={{ color: "var(--titan-text-secondary)" }}>
                Physical Medicine & Rehab Physician · Health Business Strategist
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-3 mb-5">
                <a
                  href="https://instagram.com/doctablademd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  500K+ Followers
                </a>
                <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
                  <Users className="h-4 w-4" />
                  500+ Clinics Transformed
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
                  <TrendingUp className="h-4 w-4" />
                  $1.5M+ Client Revenue
                </div>
              </div>

              {/* Bio */}
              <p className="leading-relaxed mb-6 text-sm" style={{ color: "var(--titan-text-secondary)" }}>
                Dr. Emeka is a physician based in Miami who took the skills he learned building
                his own health coaching business and now helps other healthcare practitioners
                grow their practices. He runs the Health Pro CEO Academy — a community packed
                with resources covering everything he wishes he had known when starting out.
              </p>

              {/* As Featured On */}
              <div className="border-t border-[var(--titan-border)] pt-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--titan-text-muted)" }}>
                  As Featured On
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition">
                    <span className="text-base font-black tracking-tight" style={{ color: "#333", fontFamily: "Georgia, serif" }}>OWN</span>
                    <span className="text-[9px] font-medium text-gray-400 leading-tight">Oprah Winfrey<br/>Network</span>
                  </div>
                  <span className="text-xs font-extrabold tracking-tight text-gray-400 opacity-60 hover:opacity-100 transition">WAKE UP AMERICA</span>
                  <span className="text-xs font-extrabold tracking-tight text-gray-400 opacity-60 hover:opacity-100 transition">NATIONAL REPORT</span>
                  <span className="text-xs font-extrabold tracking-tight text-gray-400 opacity-60 hover:opacity-100 transition">WELLNESS REPORT</span>
                  <span className="text-xs font-bold tracking-tight text-gray-400 opacity-60 hover:opacity-100 transition">IV BIZ BASH</span>
                  <span className="text-xs font-bold tracking-tight text-gray-400 opacity-60 hover:opacity-100 transition">BIO BOARDROOM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--titan-border)] py-8">
        <div
          className="mx-auto max-w-4xl px-4 text-center text-xs space-y-2"
          style={{ color: "var(--titan-text-muted)" }}
        >
          <p>&copy; {new Date().getFullYear()} Health Pro CEO Academy. All rights reserved.</p>
          <p>
            This site is not a part of Facebook or Meta Platforms, Inc. Additionally, this
            site is not endorsed by Facebook in any way.
          </p>
        </div>
      </footer>

      {/* ── Opt-In Modal (triggered by play button click) ─────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
            style={{ animation: "modal-enter 0.25s ease-out" }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Play className="h-5 w-5 text-blue-600 ml-0.5" fill="currentColor" />
              </div>
              <h3
                className="text-xl font-bold mb-1"
                style={{ color: "var(--titan-text-primary)" }}
              >
                Watch the Free Training
              </h3>
              <p className="text-sm" style={{ color: "var(--titan-text-secondary)" }}>
                Enter your details to get instant access
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} data-track-form="masterclass_optin" className="space-y-3">
              <div>
                <input
                  {...register("firstName")}
                  type="text"
                  placeholder="First Name"
                  autoFocus
                  className="w-full rounded-lg border border-[var(--titan-border)] bg-white px-4 py-3 text-base transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  style={{ color: "var(--titan-text-primary)" }}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="Email Address"
                  className="w-full rounded-lg border border-[var(--titan-border)] bg-white px-4 py-3 text-base transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  style={{ color: "var(--titan-text-primary)" }}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full rounded-lg border border-[var(--titan-border)] bg-white px-4 py-3 text-base transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  style={{ color: "var(--titan-text-primary)" }}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <select
                  {...register("practiceType")}
                  className="w-full rounded-lg border border-[var(--titan-border)] bg-white px-4 py-3 text-base transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  style={{ color: "var(--titan-text-primary)" }}
                  defaultValue=""
                >
                  <option value="" disabled>What type of practice do you run?</option>
                  {PRACTICE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.practiceType && (
                  <p className="mt-1 text-xs text-red-500">{errors.practiceType.message}</p>
                )}
              </div>

              <div>
                <input
                  {...register("website")}
                  type="text"
                  placeholder="Website (optional — e.g. yourpractice.com)"
                  className="w-full rounded-lg border border-[var(--titan-border)] bg-white px-4 py-3 text-base transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  style={{ color: "var(--titan-text-primary)" }}
                />
                {errors.website && (
                  <p className="mt-1 text-xs text-red-500">{errors.website.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--titan-grad-primary)" }}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    Yes, Show Me The Training
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div
                className="flex items-center justify-center gap-1.5 pt-1 text-xs"
                style={{ color: "var(--titan-text-muted)" }}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Your information is 100% secure. We never spam.</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sticky CTA Bar ────────────────────────────────────────────────── */}
      {showStickyCta && !showModal && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-blue-200/30 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
          style={{ animation: "sticky-enter 0.3s ease-out" }}
        >
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <div className="hidden sm:block">
              <p className="text-sm font-semibold" style={{ color: "var(--titan-text-primary)" }}>
                Free Facebook Ads Training for Health Pros
              </p>
              <p className="text-xs" style={{ color: "var(--titan-text-muted)" }}>
                Join 500+ practitioners who've watched this
              </p>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-3">
              <button
                onClick={() => {
                  setShowModal(true);
                  posthog.capture("optin_modal_opened", { page: "masterclass", trigger: "sticky_cta_bar" });
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "var(--titan-grad-primary)" }}
              >
                <Play className="h-4 w-4" fill="white" />
                Watch Free Training
              </button>
              <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Shield className="h-3.5 w-3.5" />
                100% Free
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes sticky-enter {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
