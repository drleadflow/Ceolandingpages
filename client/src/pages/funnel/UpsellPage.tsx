import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useFunnel } from "@/contexts/FunnelContext";
import { FunnelNav } from "@/components/funnel/FunnelNav";
import { FunnelProgressBar } from "@/components/funnel/FunnelProgressBar";
import { CountdownTimer } from "@/components/funnel/CountdownTimer";
import { ValueStack } from "@/components/funnel/ValueStack";
import { PricingBlock } from "@/components/funnel/PricingBlock";
import { GuaranteeBlock } from "@/components/funnel/GuaranteeBlock";
import { SenjaTestimonials } from "@/components/funnel/SenjaTestimonials";
import { FunnelVideoPlayer } from "@/components/funnel/FunnelVideoPlayer";
import { getSessionId } from "@/lib/funnelTracking";
import { usePixelTracking } from "@/hooks/usePixelTracking";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";

const VAULT_ITEMS = [
  "EVERYTHING in the FB Ads Course (you already have this!)",
  "The Complete Health Pro CEO Vault — All current & future training programs",
  "1-on-1 Strategy Session with Dr. Emeka (60 min, valued at $497)",
  "Advanced Scaling Playbook — Go from 6 to 7 figures",
  "Done-For-You Funnel Templates — Plug and play patient acquisition systems",
  "VIP Community Access — Direct line to Dr. Emeka and top performers",
  "Monthly Group Coaching Calls — Stay accountable and get live feedback",
  "Priority Support — 24-hour response guarantee on all questions",
];

export default function UpsellPage() {
  const { orderId, firstName, addProduct } = useFunnel();
  const [, navigate] = useLocation();
  const chargeMutation = trpc.funnel.upsell.charge.useMutation();
  const [error, setError] = useState<string | null>(null);
  const isPreview = new URLSearchParams(window.location.search).has("preview");

  // CMS content — use draft preview when ?preview=true
  const cmsPublicQuery = trpc.funnelAdmin.pages.getPublic.useQuery({ slug: "upsell" }, { enabled: !isPreview });
  const cmsPreviewQuery = trpc.funnelAdmin.pages.getPreview.useQuery({ slug: "upsell" }, { enabled: isPreview });
  const cmsContent = isPreview ? cmsPreviewQuery.data : cmsPublicQuery.data;

  // Split test
  const sessionId = getSessionId();
  const variantQuery = trpc.funnelAdmin.splitTests.getVariant.useQuery(
    { pageSlug: "upsell", sessionId },
    { enabled: !!sessionId },
  );
  const variant = variantQuery.data;

  // Merge content
  const content = {
    headline: (variant?.contentOverrides?.headline as string) ?? cmsContent?.headline ?? null,
    subheadline: (variant?.contentOverrides?.subheadline as string) ?? cmsContent?.subheadline ?? null,
    ctaText: (variant?.contentOverrides?.ctaText as string) ?? cmsContent?.ctaText ?? null,
    declineText: (variant?.contentOverrides?.declineText as string) ?? cmsContent?.declineText ?? null,
    originalPrice: (variant?.contentOverrides?.originalPrice as number) ?? cmsContent?.originalPrice ?? 1997,
    salePrice: (variant?.contentOverrides?.salePrice as number) ?? cmsContent?.salePrice ?? 997,
    valueStackItems: cmsContent?.valueStackItems ? JSON.parse(cmsContent.valueStackItems) as string[] : VAULT_ITEMS,
    videoUrl: cmsContent?.videoUrl ?? null,
    heroImageUrl: cmsContent?.heroImageUrl ?? null,
    videoOverlayStyle: cmsContent?.videoOverlayStyle ?? "front-and-center",
  };

  // Products query for installment plan
  const productsQuery = trpc.funnelAdmin.products.list.useQuery();
  const vaultProduct = productsQuery.data?.find(p => p.slug === "ceo-vault");

  const { fireEvent } = usePixelTracking("upsell");
  usePostHogEvents("upsell");

  // Event tracking
  const trackEvent = trpc.funnelAdmin.events.track.useMutation();

  useEffect(() => {
    if (sessionId) {
      trackEvent.mutate({
        sessionId,
        eventType: "upsell_view",
        pageSlug: "upsell",
        orderId: orderId ?? undefined,
        splitTestVariant: variant?.variantId,
      });
      fireEvent("upsell_view");
    }
  }, [sessionId, variant?.variantId]);

  // Guard: redirect if no orderId (skip in preview mode)
  if (!orderId && !isPreview) {
    navigate("/fb-ads-course");
    return null;
  }

  const handleAccept = async () => {
    setError(null);
    try {
      const result = await chargeMutation.mutateAsync({ orderId: orderId! });
      if (result.success) {
        addProduct("ceo-vault");
        trackEvent.mutate({
          sessionId,
          eventType: "upsell_accept",
          pageSlug: "upsell",
          orderId: orderId ?? undefined,
          splitTestVariant: variant?.variantId,
        });
        fireEvent("upsell_accept", { value: 997, currency: "USD" });
        navigate("/book-session");
      } else {
        setError("Payment could not be processed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--titan-background)" }}>
      <FunnelNav />
      <FunnelProgressBar currentStep={2} totalSteps={3} />

      {/* Confirmation Banner */}
      <div className="border-b border-emerald-200 bg-emerald-50 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">
            Congratulations{firstName ? `, ${firstName}` : ""}! Your FB Ads Course access is confirmed.
          </p>
        </div>
      </div>

      {/* Pattern Interrupt */}
      <section className="mx-auto max-w-3xl px-4 pt-10 text-center">
        <p className="mb-2 text-lg font-medium" style={{ color: "var(--titan-blue)" }}>
          Wait — before you go...
        </p>
        <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl" style={{ color: "var(--titan-text-primary)" }}>
          {content.headline ?? (
            <>
              Upgrade to the{" "}
              <span style={{ background: "var(--titan-grad-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Health Pro CEO Vault
              </span>{" "}
              and Get Everything You Need to Scale
            </>
          )}
        </h1>
        <p className="mx-auto max-w-2xl text-base" style={{ color: "var(--titan-text-secondary)" }}>
          {content.subheadline ?? "You're already ahead of 90% of health professionals. The Vault gives you the complete system — all trainings, templates, and a personal strategy session — to go from where you are to where you want to be."}
        </p>
      </section>

      {/* Timer */}
      <div className="mx-auto mt-8 max-w-sm px-4">
        <CountdownTimer />
      </div>

      {/* Video */}
      {content.videoUrl && (
        <div className="mx-auto mt-8 max-w-3xl px-4">
          <FunnelVideoPlayer
            videoUrl={content.videoUrl}
            thumbnailUrl={content.heroImageUrl}
            overlayStyle={content.videoOverlayStyle as any}
            autoplayMode={(content as any).videoAutoplayMode === "click-to-play" ? "click-to-play" : "smart"}
            title="Upsell Video"
          />
        </div>
      )}

      {/* Value Stack */}
      <section className="mx-auto max-w-3xl px-4 py-10">
        <ValueStack items={content.valueStackItems} title="Everything Inside the CEO Vault" />
      </section>

      {/* Pricing + CTA */}
      <section className="mx-auto max-w-lg px-4 pb-6 text-center">
        <PricingBlock originalPrice={content.originalPrice} salePrice={content.salePrice} label="One-Time Upgrade Price" />

        <button
          onClick={handleAccept}
          disabled={chargeMutation.isPending}
          className="mt-6 w-full rounded-xl px-8 py-5 text-xl font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--titan-gold) 0%, var(--titan-gold-hover) 100%)" }}
        >
          {chargeMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Processing...
            </span>
          ) : (
            content.ctaText ?? `Yes, Upgrade Me — $${content.salePrice}`
          )}
        </button>

        {vaultProduct?.installmentCount && vaultProduct?.installmentAmountInCents && (
          <button
            onClick={handleAccept}
            disabled={chargeMutation.isPending}
            className="mt-3 w-full rounded-xl border-2 border-blue-500/30 bg-blue-500/10 px-8 py-4 text-lg font-semibold text-blue-400 transition-all hover:bg-blue-500/20 disabled:opacity-50"
          >
            Or {vaultProduct.installmentCount} Payments of ${(vaultProduct.installmentAmountInCents / 100).toFixed(0)}
          </button>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={() => {
            trackEvent.mutate({
              sessionId,
              eventType: "upsell_decline",
              pageSlug: "upsell",
              orderId: orderId ?? undefined,
              splitTestVariant: variant?.variantId,
            });
            navigate("/offer/session");
          }}
          className="mt-4 text-sm underline transition hover:opacity-70"
          style={{ color: "var(--titan-text-secondary)" }}
        >
          {content.declineText ?? "No thanks, take me to my course"}
        </button>
      </section>

      {/* Testimonials (Senja) */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-5xl px-4">
          <SenjaTestimonials />
        </div>
      </section>

      {/* Guarantee */}
      <section className="mx-auto max-w-lg px-4 pb-16">
        <GuaranteeBlock />
      </section>
    </div>
  );
}
