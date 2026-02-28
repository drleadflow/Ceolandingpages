import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { Loader2, Users, TrendingUp, Award, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useFunnel } from "@/contexts/FunnelContext";
import { FunnelNav } from "@/components/funnel/FunnelNav";
import { ValueStack } from "@/components/funnel/ValueStack";
import { PricingBlock } from "@/components/funnel/PricingBlock";
import { GuaranteeBlock } from "@/components/funnel/GuaranteeBlock";
import { SenjaTestimonials } from "@/components/funnel/SenjaTestimonials";
import { FunnelVideoPlayer } from "@/components/funnel/FunnelVideoPlayer";
import { getSessionId } from "@/lib/funnelTracking";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Valid email is required"),
});

type FormValues = z.infer<typeof formSchema>;

const VALUE_ITEMS = [
  "Complete FB Ads Masterclass — 12 video modules covering targeting, creative, and scaling",
  "Done-For-You Ad Templates — Copy-paste ads proven to convert for health professionals",
  "Audience Targeting Blueprint — Find your ideal patients on Facebook & Instagram",
  "Ad Creative Swipe File — 50+ high-converting image and video ad examples",
  "Campaign Budget Optimizer Guide — Get more leads without increasing ad spend",
  "BONUS: Weekly Live Q&A Access — Get your ads reviewed by our team for 30 days",
  "BONUS: Private Community Access — Network with other health pros running profitable ads",
  "BONUS: Quick-Start Checklist — Launch your first campaign in 48 hours",
];

const FAQ_ITEMS = [
  {
    q: "How quickly will I see results?",
    a: "Most students launch their first campaign within 48 hours and start seeing leads within the first week. Full optimization typically happens within 2-4 weeks.",
  },
  {
    q: "Do I need a big ad budget to start?",
    a: "No. We teach you how to start with as little as $10/day and scale profitably. The strategies work at any budget level.",
  },
  {
    q: "What if I've never run Facebook ads before?",
    a: "This course is designed for beginners. We walk you through everything step-by-step, from setting up your ad account to launching your first campaign.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Yes! You have a full 30-day money-back guarantee. If you're not satisfied, just email us for a complete refund.",
  },
];

export default function SalesPage() {
  const [, navigate] = useLocation();
  const { setOrder, addProduct } = useFunnel();
  const createCheckout = trpc.funnel.checkout.createCheckout.useMutation();
  const confirmMutation = trpc.funnel.checkout.confirmPurchase.useMutation();
  const [checkoutData, setCheckoutData] = useState<{ checkoutConfigId: string; orderId: number } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<FormValues | null>(null);

  // CMS content — use draft preview when ?preview=true
  const isPreview = new URLSearchParams(window.location.search).has("preview");
  const cmsPublicQuery = trpc.funnelAdmin.pages.getPublic.useQuery({ slug: "sales" }, { enabled: !isPreview });
  const cmsPreviewQuery = trpc.funnelAdmin.pages.getPreview.useQuery({ slug: "sales" }, { enabled: isPreview });
  const cmsContent = isPreview ? cmsPreviewQuery.data : cmsPublicQuery.data;

  // Split test variant
  const sessionId = getSessionId();
  const variantQuery = trpc.funnelAdmin.splitTests.getVariant.useQuery(
    { pageSlug: "sales", sessionId },
    { enabled: !!sessionId },
  );
  const variant = variantQuery.data;

  // Merge content: defaults → CMS → split test overrides
  const content = {
    headline: (variant?.contentOverrides?.headline as string) ?? cmsContent?.headline ?? null,
    subheadline: (variant?.contentOverrides?.subheadline as string) ?? cmsContent?.subheadline ?? null,
    ctaText: (variant?.contentOverrides?.ctaText as string) ?? cmsContent?.ctaText ?? null,
    originalPrice: (variant?.contentOverrides?.originalPrice as number) ?? cmsContent?.originalPrice ?? 297,
    salePrice: (variant?.contentOverrides?.salePrice as number) ?? cmsContent?.salePrice ?? 197,
    valueStackItems: cmsContent?.valueStackItems ? JSON.parse(cmsContent.valueStackItems) as string[] : VALUE_ITEMS,
    faqItems: cmsContent?.faqItems ? JSON.parse(cmsContent.faqItems) as Array<{q: string; a: string}> : FAQ_ITEMS,
    videoUrl: cmsContent?.videoUrl ?? null,
    heroImageUrl: cmsContent?.heroImageUrl ?? null,
    videoOverlayStyle: cmsContent?.videoOverlayStyle ?? "front-and-center",
  };

  // Event tracking
  const trackEvent = trpc.funnelAdmin.events.track.useMutation();

  useEffect(() => {
    if (sessionId) {
      trackEvent.mutate({
        sessionId,
        eventType: "page_view",
        pageSlug: "sales",
        splitTestVariant: variant?.variantId,
      });
    }
  }, [sessionId, variant?.variantId]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { firstName: "", email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setFormValues(values);
    trackEvent.mutate({
      sessionId,
      eventType: "checkout_start",
      pageSlug: "sales",
      splitTestVariant: variant?.variantId,
    });
    const result = await createCheckout.mutateAsync(values);
    setOrder(result.orderId, values.email, values.firstName);
    setCheckoutData({ checkoutConfigId: result.checkoutConfigId, orderId: result.orderId });
  };

  const handleCheckoutComplete = async (planId: string, receiptId?: string) => {
    if (!checkoutData) return;

    await confirmMutation.mutateAsync({
      orderId: checkoutData.orderId,
      whopPaymentId: receiptId,
    });
    addProduct("fb-ads-course");
    trackEvent.mutate({
      sessionId,
      eventType: "purchase",
      pageSlug: "sales",
      orderId: checkoutData.orderId,
      splitTestVariant: variant?.variantId,
    });
    navigate("/offer/vault");
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--titan-background)" }}>
      <FunnelNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="mb-4 inline-block rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-600">
          For Health Professionals Only
        </div>
        <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl" style={{ color: "var(--titan-text-primary)" }}>
          {content.headline ?? (
            <>
              The Exact Facebook Ad System That Fills Health Practices With{" "}
              <span style={{ background: "var(--titan-grad-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                20+ New Patients Per Month
              </span>
            </>
          )}
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg" style={{ color: "var(--titan-text-secondary)" }}>
          {content.subheadline ?? "Stop wasting money on ads that don't convert. Learn the proven system used by 500+ health professionals to predictably generate high-quality patient leads on autopilot."}
        </p>

        {/* VSL Video */}
        {content.videoUrl ? (
          <div className="mx-auto mb-8 max-w-3xl">
            <FunnelVideoPlayer
              videoUrl={content.videoUrl}
              thumbnailUrl={content.heroImageUrl}
              overlayStyle={content.videoOverlayStyle as any}
              title="Sales Video"
            />
          </div>
        ) : (
          <div className="mx-auto mb-8 max-w-3xl overflow-hidden rounded-2xl border border-[var(--titan-border)] bg-gray-900 shadow-xl" style={{ aspectRatio: "16/9" }}>
            <div className="flex h-full items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-white text-sm">No video set</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Social Proof Bar */}
      <section className="border-y border-[var(--titan-border)] bg-white py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-4">
          {[
            { icon: Users, label: "500+ Students" },
            { icon: TrendingUp, label: "3.2x Avg. ROI" },
            { icon: Award, label: "4.9/5 Rating" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-semibold" style={{ color: "var(--titan-text-primary)" }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Value Stack */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-6 text-center text-2xl font-bold" style={{ color: "var(--titan-text-primary)" }}>
          Everything You Get Inside
        </h2>
        <ValueStack items={content.valueStackItems} />
      </section>

      {/* Testimonials (Senja) */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold" style={{ color: "var(--titan-text-primary)" }}>
            What Health Professionals Are Saying
          </h2>
          <SenjaTestimonials />
        </div>
      </section>

      {/* Pricing + Checkout */}
      <section id="checkout" className="mx-auto max-w-lg px-4 py-12">
        <PricingBlock originalPrice={content.originalPrice} salePrice={content.salePrice} label="Special Launch Price" />

        <div className="mt-8 rounded-2xl border border-[var(--titan-border)] bg-white p-6 shadow-lg">
          {!checkoutData ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: "var(--titan-text-primary)" }}>
                  First Name
                </label>
                <input
                  {...form.register("firstName")}
                  placeholder="Your first name"
                  className="w-full rounded-lg border border-[var(--titan-border)] px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                {form.formState.errors.firstName && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: "var(--titan-text-primary)" }}>
                  Email Address
                </label>
                <input
                  {...form.register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[var(--titan-border)] px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={createCheckout.isPending}
                className="w-full rounded-xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--titan-gold) 0%, var(--titan-gold-hover) 100%)" }}
              >
                {createCheckout.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Setting up checkout...
                  </span>
                ) : (
                  content.ctaText ?? `Continue to Payment — $${content.salePrice}`
                )}
              </button>
              {createCheckout.isError && (
                <p className="text-center text-sm text-red-500">
                  {createCheckout.error.message}
                </p>
              )}
            </form>
          ) : (
            <div>
              <WhopCheckoutEmbed
                sessionId={checkoutData.checkoutConfigId}
                theme="light"
                prefill={{ email: formValues?.email }}
                setupFutureUsage="off_session"
                skipRedirect
                onComplete={handleCheckoutComplete}
                fallback={
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                }
              />
            </div>
          )}
        </div>

        <div className="mt-6">
          <GuaranteeBlock />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-4 pb-16">
        <h2 className="mb-6 text-center text-2xl font-bold" style={{ color: "var(--titan-text-primary)" }}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {content.faqItems.map((item, i) => (
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
    </div>
  );
}
