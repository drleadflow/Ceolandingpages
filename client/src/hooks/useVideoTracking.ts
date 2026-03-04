import { useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

type VideoEventType =
  | "video_play"
  | "video_pause"
  | "video_milestone_25"
  | "video_milestone_50"
  | "video_milestone_75"
  | "video_milestone_100";

interface UseVideoTrackingOptions {
  pageSlug: string;
  videoUrl: string;
  splitTestVariant?: string;
  firePixelEvent?: (event: string, params?: Record<string, unknown>) => void;
}

function getSessionId(): string {
  let id = sessionStorage.getItem("funnel_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("funnel_session_id", id);
  }
  return id;
}

export function useVideoTracking({
  pageSlug,
  videoUrl,
  splitTestVariant,
  firePixelEvent,
}: UseVideoTrackingOptions) {
  const firedMilestones = useRef(new Set<string>());
  const watchTimeRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const trackMutation = trpc.funnel.video.trackEvent.useMutation();

  const trackEvent = useCallback(
    (eventType: VideoEventType, watchTimeSeconds?: number) => {
      const sessionId = getSessionId();
      trackMutation.mutate({
        sessionId,
        pageSlug,
        videoUrl,
        eventType,
        splitTestVariant,
        watchTimeSeconds: watchTimeSeconds ?? Math.round(watchTimeRef.current),
      });
    },
    [pageSlug, videoUrl, splitTestVariant, trackMutation],
  );

  const onPlay = useCallback(() => {
    lastTimeRef.current = Date.now();
    trackEvent("video_play");
    firePixelEvent?.("video_play", { pageSlug, videoUrl });
  }, [trackEvent, firePixelEvent, pageSlug, videoUrl]);

  const onPause = useCallback(() => {
    if (lastTimeRef.current) {
      watchTimeRef.current += (Date.now() - lastTimeRef.current) / 1000;
      lastTimeRef.current = null;
    }
    trackEvent("video_pause", Math.round(watchTimeRef.current));
  }, [trackEvent]);

  const onTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (duration <= 0) return;

      // Update cumulative watch time
      if (lastTimeRef.current) {
        watchTimeRef.current += (Date.now() - lastTimeRef.current) / 1000;
        lastTimeRef.current = Date.now();
      }

      const pct = (currentTime / duration) * 100;
      const milestones = [
        { threshold: 25, event: "video_milestone_25" as const },
        { threshold: 50, event: "video_milestone_50" as const },
        { threshold: 75, event: "video_milestone_75" as const },
        { threshold: 100, event: "video_milestone_100" as const },
      ];

      for (const { threshold, event } of milestones) {
        const effectiveThreshold = threshold === 100 ? 95 : threshold;
        if (pct >= effectiveThreshold && !firedMilestones.current.has(event)) {
          firedMilestones.current.add(event);
          const watchTime = Math.round(watchTimeRef.current);
          trackEvent(event, watchTime);
          firePixelEvent?.(event, {
            pageSlug,
            videoUrl,
            milestone: threshold,
            watchTimeSeconds: watchTime,
          });
        }
      }
    },
    [trackEvent, firePixelEvent, pageSlug, videoUrl],
  );

  const reset = useCallback(() => {
    firedMilestones.current.clear();
    watchTimeRef.current = 0;
    lastTimeRef.current = null;
  }, []);

  return { onPlay, onPause, onTimeUpdate, reset };
}
