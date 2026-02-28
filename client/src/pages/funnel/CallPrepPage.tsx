import { useEffect } from "react";
import { CheckCircle2, ClipboardList, ExternalLink, Users, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useFunnel } from "@/contexts/FunnelContext";
import { FunnelNav } from "@/components/funnel/FunnelNav";
import { FunnelVideoPlayer } from "@/components/funnel/FunnelVideoPlayer";
import { getSessionId } from "@/lib/funnelTracking";

const PREP_ITEMS = [
  "Write down your top 3 business goals for the next 90 days",
  "Know your current monthly revenue and patient/client volume",
  "Have your current ad campaigns or marketing materials ready to share",
  "List your biggest bottleneck or challenge right now",
  "Come with an open mind — be ready to think bigger",
];

export default function CallPrepPage() {
  const { orderId, firstName } = useFunnel();

  // CMS content — use draft preview when ?preview=true
  const isPreview = new URLSearchParams(window.location.search).has("preview");
  const cmsPublicQuery = trpc.funnelAdmin.pages.getPublic.useQuery({ slug: "call-prep" }, { enabled: !isPreview });
  const cmsPreviewQuery = trpc.funnelAdmin.pages.getPreview.useQuery({ slug: "call-prep" }, { enabled: isPreview });
  const cmsContent = isPreview ? cmsPreviewQuery.data : cmsPublicQuery.data;

  const sessionId = getSessionId();
  const trackEvent = trpc.funnelAdmin.events.track.useMutation();

  useEffect(() => {
    if (sessionId) {
      trackEvent.mutate({
        sessionId,
        eventType: "page_view",
        pageSlug: "call-prep",
        orderId: orderId ?? undefined,
      });
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen" style={{ background: "var(--titan-background)" }}>
      <FunnelNav />

      {/* Success Banner */}
      <div className="border-b border-emerald-200 bg-emerald-50 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">
            {cmsContent?.headline ??
              `You're booked${firstName ? `, ${firstName}` : ""}! Here's how to prepare.`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Video Section */}
        <div className="mb-10">
          <h2
            className="mb-4 text-center text-2xl font-bold"
            style={{ color: "var(--titan-text-primary)" }}
          >
            {cmsContent?.subheadline ?? "Get the Most Out of Your Strategy Call"}
          </h2>
          {cmsContent?.videoUrl ? (
            <FunnelVideoPlayer
              videoUrl={cmsContent.videoUrl}
              thumbnailUrl={cmsContent.heroImageUrl}
              overlayStyle={(cmsContent.videoOverlayStyle as any) ?? "front-and-center"}
              title="Call Prep Video"
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--titan-border)] bg-black shadow-sm">
              <div className="flex aspect-video items-center justify-center text-slate-400">
                <p className="text-sm">Video coming soon — check back before your call</p>
              </div>
            </div>
          )}
        </div>

        {/* Prep Checklist */}
        <div className="mb-10 rounded-2xl border border-[var(--titan-border)] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--titan-text-primary)" }}
            >
              Your Prep Checklist
            </h3>
          </div>
          <div className="space-y-3">
            {PREP_ITEMS.map((item, index) => (
              <label
                key={index}
                className="flex items-start gap-3 rounded-lg border border-[var(--titan-border)] p-3 transition hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  className="text-sm"
                  style={{ color: "var(--titan-text-primary)" }}
                >
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-4">
          <a
            href="https://skool.com/10ksidehustle/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl border border-[var(--titan-border)] bg-white p-4 shadow-sm transition hover:border-purple-300 hover:bg-purple-50/50"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--titan-text-primary)" }}
              >
                Join the Community
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--titan-text-secondary)" }}
              >
                Connect with other health pros in our Skool group
              </p>
            </div>
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-purple-500" />
          </a>

          <a
            href="https://skool.com/10ksidehustle/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl border border-[var(--titan-border)] bg-white p-4 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/50"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--titan-text-primary)" }}
              >
                Access Your Course
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--titan-text-secondary)" }}
              >
                Start learning while you wait for your strategy call
              </p>
            </div>
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-blue-500" />
          </a>
        </div>

        {/* Support */}
        <div className="mt-10 text-center">
          <p className="text-sm" style={{ color: "var(--titan-text-secondary)" }}>
            Need to reschedule? Email us at{" "}
            <a
              href="mailto:support@doctorleadflow.com"
              className="font-medium text-blue-600 hover:underline"
            >
              support@doctorleadflow.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
