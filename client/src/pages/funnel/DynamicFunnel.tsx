import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import FunnelRenderer from "@/components/builder/runtime/FunnelRenderer";

export default function DynamicFunnel() {
  const [, params] = useRoute("/f/:slug");
  const slug = params?.slug ?? "";

  const { data: funnel, isLoading, error } = trpc.funnelSubmissions.getPublished.useQuery(
    { slug },
    { enabled: !!slug },
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E5C158] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !funnel) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
          <p>This funnel doesn't exist or hasn't been published yet.</p>
        </div>
      </div>
    );
  }

  return (
    <FunnelRenderer
      funnelId={funnel.id}
      steps={funnel.steps}
      conditionalRoutes={funnel.conditionalRoutes}
      settings={funnel.settings}
    />
  );
}
