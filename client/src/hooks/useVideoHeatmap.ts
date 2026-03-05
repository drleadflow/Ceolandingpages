import { useRef, useCallback, useEffect } from "react";

interface UseVideoHeatmapOptions {
  videoId: string;
  pageSlug: string;
  sessionId: string;
  onProgress?: (seconds: number, percent: number) => void;
}

interface SeekEvent {
  from: number;
  to: number;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

export function useVideoHeatmap({
  videoId,
  pageSlug,
  sessionId,
  onProgress,
}: UseVideoHeatmapOptions) {
  const vectorRef = useRef<number[]>([]);
  const seekEventsRef = useRef<SeekEvent[]>([]);
  const durationRef = useRef(0);
  const maxSecondRef = useRef(0);
  const seekFromRef = useRef<number | null>(null);
  const sentRef = useRef(false);
  const lastSecondRef = useRef(-1);

  const sendData = useCallback(() => {
    if (sentRef.current || vectorRef.current.length === 0) return;
    sentRef.current = true;

    const totalWatched = vectorRef.current.reduce((sum, v) => sum + v, 0);

    const payload = JSON.stringify({
      sessionId,
      videoId,
      pageSlug,
      playbackVector: vectorRef.current,
      seekEvents: seekEventsRef.current,
      maxSecondReached: maxSecondRef.current,
      totalWatchTimeSec: totalWatched,
      videoDurationSec: durationRef.current,
      deviceType: getDeviceType(),
    });

    const url = "/api/video-heatmap/track";
    const blob = new Blob([payload], { type: "application/json" });

    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(url, blob);
      if (!sent) {
        fetch(url, { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
      }
    } else {
      fetch(url, { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  }, [sessionId, videoId, pageSlug]);

  // Send on page unload
  useEffect(() => {
    const handleUnload = () => sendData();
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      // Also send when hook unmounts (navigating away)
      sendData();
    };
  }, [sendData]);

  const handleLoadedMetadata = useCallback((duration: number) => {
    const rounded = Math.ceil(duration);
    durationRef.current = rounded;
    vectorRef.current = new Array(rounded).fill(0);
  }, []);

  const handleTimeUpdate = useCallback(
    (currentTime: number) => {
      const sec = Math.floor(currentTime);
      if (sec < 0 || sec >= vectorRef.current.length) return;

      vectorRef.current[sec] = 1;

      if (sec > maxSecondRef.current) {
        maxSecondRef.current = sec;
      }

      // Avoid calling onProgress for the same second repeatedly
      if (sec !== lastSecondRef.current) {
        lastSecondRef.current = sec;
        const duration = durationRef.current;
        if (duration > 0 && onProgress) {
          const percent = Math.round((sec / duration) * 100);
          onProgress(sec, percent);
        }
      }
    },
    [onProgress],
  );

  const handleSeeking = useCallback((fromTime: number) => {
    seekFromRef.current = Math.floor(fromTime);
  }, []);

  const handleSeeked = useCallback((toTime: number) => {
    if (seekFromRef.current !== null) {
      seekEventsRef.current = [
        ...seekEventsRef.current,
        { from: seekFromRef.current, to: Math.floor(toTime) },
      ];
      seekFromRef.current = null;
    }
  }, []);

  const handlePause = useCallback(() => {
    // Reset sent flag so we can send updated data later
    sentRef.current = false;
    sendData();
    // Allow re-sending on next pause/end
    sentRef.current = false;
  }, [sendData]);

  const handleEnded = useCallback(() => {
    sentRef.current = false;
    sendData();
  }, [sendData]);

  return {
    handleLoadedMetadata,
    handleTimeUpdate,
    handleSeeking,
    handleSeeked,
    handlePause,
    handleEnded,
  };
}
