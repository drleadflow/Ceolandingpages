import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, ExternalLink, Calendar, BookOpen, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useFunnel } from "@/contexts/FunnelContext";
import { FunnelNav } from "@/components/funnel/FunnelNav";
import { getSessionId } from "@/lib/funnelTracking";
import { usePixelTracking } from "@/hooks/usePixelTracking";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";

export default function ThankYouPage() {
  const { orderId, firstName, purchasedProducts } = useFunnel();
  const confettiFired = useRef(false);

  const orderQuery = trpc.funnel.order.get.useQuery(
    { orderId: orderId ?? 0 },
    { enabled: !!orderId },
  );

  // CMS content — use draft preview when ?preview=true
  const isPreview = new URLSearchParams(window.location.search).has("preview");
  const cmsPublicQuery = trpc.funnelAdmin.pages.getPublic.useQuery({ slug: "thank-you" }, { enabled: !isPreview });
  const cmsPreviewQuery = trpc.funnelAdmin.pages.getPreview.useQuery({ slug: "thank-you" }, { enabled: isPreview });
  const cmsContent = isPreview ? cmsPreviewQuery.data : cmsPublicQuery.data;

  const sessionId = getSessionId();
  const { fireEvent } = usePixelTracking("thank-you");
  usePostHogEvents("thank-you");
  const trackEvent = trpc.funnelAdmin.events.track.useMutation();

  useEffect(() => {
    if (!confettiFired.current) {
      confettiFired.current = true;
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } }), 500);
      if (sessionId) {
        trackEvent.mutate({
          sessionId,
          eventType: "purchase",
          pageSlug: "thank-you",
          orderId: orderId ?? undefined,
        });
        fireEvent("purchase");
      }
    }
  }, []);

  const hasVault = purchasedProducts.includes("ceo-vault");
  const hasSession = purchasedProducts.includes("strategy-session");

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(0)}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--titan-background)" }}>
      <FunnelNav />

      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Success Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mb-2 text-3xl font-bold" style={{ color: "var(--titan-text-primary)" }}>
            {cmsContent?.headline ?? `You're In${firstName ? `, ${firstName}` : ""}!`}
          </h1>
          <p className="text-base" style={{ color: "var(--titan-text-secondary)" }}>
            {cmsContent?.subheadline ?? "Your purchase is confirmed. Check your email for login details."}
          </p>
        </div>

        {/* Order Summary */}
        {orderQuery.data && (
          <div className="mb-8 rounded-2xl border border-[var(--titan-border)] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--titan-text-primary)" }}>
              Order Summary
            </h2>
            <div className="divide-y divide-[var(--titan-border)]">
              {orderQuery.data.items
                .filter((item) => item.status === "paid")
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--titan-text-primary)" }}>
                        {item.productName}
                      </p>
                      <p className="text-xs capitalize" style={{ color: "var(--titan-text-secondary)" }}>
                        {item.productType}
                      </p>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "var(--titan-text-primary)" }}>
                      {formatCents(item.amountInCents)}
                    </span>
                  </div>
                ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[var(--titan-border)] pt-3">
              <span className="font-semibold" style={{ color: "var(--titan-text-primary)" }}>Total</span>
              <span className="text-lg font-bold" style={{ color: "var(--titan-text-primary)" }}>
                {formatCents(orderQuery.data.totalInCents)}
              </span>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="mb-8 rounded-2xl border border-[var(--titan-border)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--titan-text-primary)" }}>
            Your Next Steps
          </h2>
          <div className="space-y-4">
            {/* Always: Course access */}
            <a
              href="https://skool.com/10ksidehustle/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-[var(--titan-border)] p-4 transition hover:border-blue-300 hover:bg-blue-50/50"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--titan-text-primary)" }}>
                  Access Your FB Ads Course
                </p>
                <p className="text-xs" style={{ color: "var(--titan-text-secondary)" }}>
                  Start Module 1 now — login details sent to your email
                </p>
              </div>
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-blue-500" />
            </a>

            {/* If vault: Vault access + calendar */}
            {hasVault && (
              <>
                <a
                  href="https://skool.com/10ksidehustle/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-[var(--titan-border)] p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--titan-text-primary)" }}>
                      Access the CEO Vault
                    </p>
                    <p className="text-xs" style={{ color: "var(--titan-text-secondary)" }}>
                      All trainings, templates, and resources unlocked
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-indigo-500" />
                </a>
                <a
                  href="/book-session"
                  className="flex items-center gap-4 rounded-xl border border-[var(--titan-border)] p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--titan-text-primary)" }}>
                      Book Your 1-on-1 Strategy Session
                    </p>
                    <p className="text-xs" style={{ color: "var(--titan-text-secondary)" }}>
                      Schedule your 60-min session with Dr. Emeka
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                </a>
              </>
            )}

            {/* If session only (not vault): calendar */}
            {hasSession && !hasVault && (
              <a
                href="/book-session"
                className="flex items-center gap-4 rounded-xl border border-[var(--titan-border)] p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--titan-text-primary)" }}>
                    Book Your Strategy Session
                  </p>
                  <p className="text-xs" style={{ color: "var(--titan-text-secondary)" }}>
                    Schedule your 60-min session with Dr. Emeka
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 flex-shrink-0 text-emerald-500" />
              </a>
            )}

            {/* Community */}
            <a
              href="https://skool.com/10ksidehustle/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-[var(--titan-border)] p-4 transition hover:border-purple-300 hover:bg-purple-50/50"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--titan-text-primary)" }}>
                  Join the Community
                </p>
                <p className="text-xs" style={{ color: "var(--titan-text-secondary)" }}>
                  Connect with other health pros in our Skool group
                </p>
              </div>
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-purple-500" />
            </a>
          </div>
        </div>

        {/* Support */}
        <div className="text-center">
          <p className="text-sm" style={{ color: "var(--titan-text-secondary)" }}>
            Questions? Email us at{" "}
            <a href="mailto:support@doctorleadflow.com" className="font-medium text-blue-600 hover:underline">
              support@doctorleadflow.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
