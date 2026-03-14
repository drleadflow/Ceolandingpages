import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Clock, Users, Target, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useFunnel } from "@/contexts/FunnelContext";
import { FunnelNav } from "@/components/funnel/FunnelNav";
import { SenjaTestimonials } from "@/components/funnel/SenjaTestimonials";
import { getSessionId } from "@/lib/funnelTracking";
import { usePixelTracking } from "@/hooks/usePixelTracking";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";

const GHL_BOOKING_URL = "https://links.doctorleadflow.com/widget/booking/9UjOQl0JVnNqG41Uboyh";

const WHAT_TO_EXPECT = [
  { icon: Clock, text: "60-minute deep-dive strategy session" },
  { icon: Target, text: "Custom growth plan tailored to your practice" },
  { icon: MessageSquare, text: "Ad campaign audit & optimization roadmap" },
  { icon: Users, text: "Actionable next steps you can implement immediately" },
];

export default function BookingPage() {
  const { orderId, firstName, purchasedProducts } = useFunnel();
  const [, navigate] = useLocation();

  // CMS content — use draft preview when ?preview=true
  const isPreviewMode = new URLSearchParams(window.location.search).has("preview");
  const cmsPublicQuery = trpc.funnelAdmin.pages.getPublic.useQuery({ slug: "book-session" }, { enabled: !isPreviewMode });
  const cmsPreviewQuery = trpc.funnelAdmin.pages.getPreview.useQuery({ slug: "book-session" }, { enabled: isPreviewMode });
  const cmsContent = isPreviewMode ? cmsPreviewQuery.data : cmsPublicQuery.data;

  const sessionId = getSessionId();
  const { fireEvent } = usePixelTracking("book-session");
  usePostHogEvents("book-session");
  const trackEvent = trpc.funnelAdmin.events.track.useMutation();

  // Determine purchase value from purchased products
  const purchaseValue = purchasedProducts.includes("ceo-vault")
    ? 997
    : purchasedProducts.includes("strategy-session")
      ? 297
      : purchasedProducts.includes("fb-ads-course")
        ? 197
        : 0;

  const purchaseItemName = purchasedProducts.includes("ceo-vault")
    ? "CEO Vault — All Courses"
    : purchasedProducts.includes("strategy-session")
      ? "Course + 1-on-1 Session"
      : purchasedProducts.includes("fb-ads-course")
        ? "FB Ads Course"
        : "Unknown";

  const purchaseItemId = purchasedProducts.includes("ceo-vault")
    ? "ceo-vault"
    : purchasedProducts.includes("strategy-session")
      ? "strategy-session"
      : purchasedProducts.includes("fb-ads-course")
        ? "fb-ads-course"
        : "unknown";

  useEffect(() => {
    if (sessionId) {
      trackEvent.mutate({
        sessionId,
        eventType: "page_view",
        pageSlug: "book-session",
        orderId: orderId ?? undefined,
      });
      fireEvent("page_view");

      // Fire purchase event for GTM (tag triggers on URL containing "book-session")
      const purchaseData = {
        transaction_id: orderId ? String(orderId) : `session-${sessionId}`,
        value: purchaseValue,
        currency: "USD",
        item_id: purchaseItemId,
        item_name: purchaseItemName,
        items: [{ item_id: purchaseItemId, item_name: purchaseItemName, price: purchaseValue, quantity: 1 }],
      };

      fireEvent("purchase", purchaseData);

      // Direct dataLayer push as fallback — ensures GTM gets the event
      // even if pixel config hasn't loaded yet
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "purchase", ...purchaseData });
    }
  }, [sessionId]);

  const hasVault = purchasedProducts.includes("ceo-vault");
  const productLabel = hasVault ? "CEO Vault" : "Strategy Session";

  return (
    <div className="min-h-screen" style={{ background: "var(--titan-background)" }}>
      <FunnelNav />

      {/* Confirmation Banner */}
      <div className="border-b border-emerald-200 bg-emerald-50 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">
            {cmsContent?.headline ??
              `Your ${productLabel} access is confirmed${firstName ? `, ${firstName}` : ""}! Now book your strategy call.`}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Left: Calendar Embed */}
          <div>
            <h2
              className="mb-2 text-2xl font-bold"
              style={{ color: "var(--titan-text-primary)" }}
            >
              {cmsContent?.subheadline ?? "Pick a Time That Works for You"}
            </h2>
            <p
              className="mb-6 text-sm"
              style={{ color: "var(--titan-text-secondary)" }}
            >
              Select a date and time below to schedule your 1-on-1 strategy call with Dr. Emeka.
            </p>
            <div className="overflow-hidden rounded-2xl border border-[var(--titan-border)] bg-white shadow-sm">
              <iframe
                src={GHL_BOOKING_URL}
                className="h-[700px] w-full border-0"
                title="Book Your Strategy Session"
                allow="camera; microphone"
              />
            </div>
          </div>

          {/* Right: What to Expect + Testimonials */}
          <div>
            <div className="mb-8 rounded-2xl border border-[var(--titan-border)] bg-white p-6 shadow-sm">
              <h3
                className="mb-4 text-lg font-semibold"
                style={{ color: "var(--titan-text-primary)" }}
              >
                What to Expect
              </h3>
              <div className="space-y-4">
                {WHAT_TO_EXPECT.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <p
                      className="pt-1.5 text-sm"
                      style={{ color: "var(--titan-text-primary)" }}
                    >
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* After booking, link to call prep */}
            <div className="mb-8 rounded-2xl border border-amber-400 bg-amber-50 p-5 text-center shadow-md"
              style={{ boxShadow: "0 0 20px rgba(245,158,11,0.15)" }}
            >
              <p className="mb-2 text-sm font-bold text-amber-800">
                Already booked?
              </p>
              <a
                href="/call-prep"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl hover:scale-[1.02]"
                style={{
                  background:
                    "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                }}
              >
                Go to Call Prep Page →
              </a>
            </div>

            {/* Testimonials */}
            <SenjaTestimonials />
          </div>
        </div>
      </div>
    </div>
  );
}
