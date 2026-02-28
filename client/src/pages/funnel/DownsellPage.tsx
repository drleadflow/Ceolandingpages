import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useFunnel } from "@/contexts/FunnelContext";
import { FunnelNav } from "@/components/funnel/FunnelNav";
import { FunnelProgressBar } from "@/components/funnel/FunnelProgressBar";
import { ValueStack } from "@/components/funnel/ValueStack";
import { PricingBlock } from "@/components/funnel/PricingBlock";
import { GuaranteeBlock } from "@/components/funnel/GuaranteeBlock";
import { FunnelVideoPlayer } from "@/components/funnel/FunnelVideoPlayer";
import { getSessionId } from "@/lib/funnelTracking";

const SESSION_ITEMS = [
  "60-Minute 1-on-1 Strategy Session with Dr. Emeka",
  "Custom 90-Day Growth Plan tailored to your practice",
  "Ad Campaign Audit — Dr. Emeka reviews your current (or planned) campaigns",
];

export default function DownsellPage() {
  const { orderId, addProduct } = useFunnel();
  const [, navigate] = useLocation();
  const chargeMutation = trpc.funnel.downsell.charge.useMutation();
  const [error, setError] = useState<string | null>(null);

  // CMS content — use draft preview when ?preview=true
  const isPreviewMode = new URLSearchParams(window.location.search).has("preview");
  const cmsPublicQuery = trpc.funnelAdmin.pages.getPublic.useQuery({ slug: "downsell" }, { enabled: !isPreviewMode });
  const cmsPreviewQuery = trpc.funnelAdmin.pages.getPreview.useQuery({ slug: "downsell" }, { enabled: isPreviewMode });
  const cmsContent = isPreviewMode ? cmsPreviewQuery.data : cmsPublicQuery.data;

  const sessionId = getSessionId();
  const variantQuery = trpc.funnelAdmin.splitTests.getVariant.useQuery(
    { pageSlug: "downsell", sessionId },
    { enabled: !!sessionId },
  );
  const variant = variantQuery.data;

  const content = {
    headline: (variant?.contentOverrides?.headline as string) ?? cmsContent?.headline ?? null,
    subheadline: (variant?.contentOverrides?.subheadline as string) ?? cmsContent?.subheadline ?? null,
    ctaText: (variant?.contentOverrides?.ctaText as string) ?? cmsContent?.ctaText ?? null,
    declineText: (variant?.contentOverrides?.declineText as string) ?? cmsContent?.declineText ?? null,
    originalPrice: (variant?.contentOverrides?.originalPrice as number) ?? cmsContent?.originalPrice ?? 497,
    salePrice: (variant?.contentOverrides?.salePrice as number) ?? cmsContent?.salePrice ?? 297,
    valueStackItems: cmsContent?.valueStackItems ? JSON.parse(cmsContent.valueStackItems) as string[] : SESSION_ITEMS,
    videoUrl: cmsContent?.videoUrl ?? null,
    heroImageUrl: cmsContent?.heroImageUrl ?? null,
    videoOverlayStyle: cmsContent?.videoOverlayStyle ?? "front-and-center",
  };

  const trackEvent = trpc.funnelAdmin.events.track.useMutation();

  const productsQuery = trpc.funnelAdmin.products.list.useQuery();
  const sessionProduct = productsQuery.data?.find(p => p.slug === "strategy-session");

  useEffect(() => {
    if (sessionId) {
      trackEvent.mutate({
        sessionId,
        eventType: "downsell_view",
        pageSlug: "downsell",
        orderId: orderId ?? undefined,
        splitTestVariant: variant?.variantId,
      });
    }
  }, [sessionId, variant?.variantId]);

  // Guard: redirect if no orderId (skip in preview mode)
  if (!orderId && !isPreviewMode) {
    navigate("/fb-ads-course");
    return null;
  }

  const handleAccept = async () => {
    setError(null);
    try {
      const result = await chargeMutation.mutateAsync({ orderId: orderId! });
      if (result.success) {
        addProduct("strategy-session");
        trackEvent.mutate({
          sessionId,
          eventType: "downsell_accept",
          pageSlug: "downsell",
          orderId: orderId ?? undefined,
          splitTestVariant: variant?.variantId,
        });
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
      <FunnelProgressBar currentStep={3} totalSteps={3} />

      <section className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="mb-2 text-base" style={{ color: "var(--titan-text-secondary)" }}>
          No problem — the vault isn't for everyone.
        </p>
        <h1 className="mb-4 text-3xl font-bold leading-tight" style={{ color: "var(--titan-text-primary)" }}>
          {content.headline ? (
            content.headline
          ) : (
            <>
              How About a{" "}
              <span style={{ background: "var(--titan-grad-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Private Strategy Session
              </span>{" "}
              Instead?
            </>
          )}
        </h1>
        <p className="mx-auto max-w-lg text-base" style={{ color: "var(--titan-text-secondary)" }}>
          {content.subheadline ?? "Get Dr. Emeka's undivided attention for a full hour. Walk away with a custom growth plan designed specifically for your practice — no fluff, just actionable strategy."}
        </p>
      </section>

      {/* Video */}
      {content.videoUrl && (
        <div className="mx-auto max-w-2xl px-4">
          <FunnelVideoPlayer
            videoUrl={content.videoUrl}
            thumbnailUrl={content.heroImageUrl}
            overlayStyle={content.videoOverlayStyle as any}
            title="Downsell Video"
          />
        </div>
      )}

      <section className="mx-auto max-w-md px-4">
        <ValueStack items={content.valueStackItems} />
      </section>

      <section className="mx-auto max-w-md px-4 py-10 text-center">
        <PricingBlock originalPrice={content.originalPrice} salePrice={content.salePrice} label="One-Time Special Price" />

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
            content.ctaText ?? `Yes, Book My Session — $${content.salePrice}`
          )}
        </button>

        {sessionProduct?.installmentCount && sessionProduct?.installmentAmountInCents && (
          <button
            onClick={handleAccept}
            disabled={chargeMutation.isPending}
            className="mt-3 w-full rounded-xl border-2 border-blue-500/30 bg-blue-500/10 px-8 py-4 text-lg font-semibold text-blue-400 transition-all hover:bg-blue-500/20 disabled:opacity-50"
          >
            Or {sessionProduct.installmentCount} Payments of ${(sessionProduct.installmentAmountInCents / 100).toFixed(0)}
          </button>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={() => {
            trackEvent.mutate({
              sessionId,
              eventType: "downsell_decline",
              pageSlug: "downsell",
              orderId: orderId ?? undefined,
              splitTestVariant: variant?.variantId,
            });
            navigate("/thank-you");
          }}
          className="mt-4 text-sm underline transition hover:opacity-70"
          style={{ color: "var(--titan-text-secondary)" }}
        >
          {content.declineText ?? "No thanks, just give me my course"}
        </button>
      </section>

      <section className="mx-auto max-w-md px-4 pb-16">
        <GuaranteeBlock />
      </section>
    </div>
  );
}
