import { useParams, useSearch } from "wouter";
import MuxPlayer from "@mux/mux-player-react";
import { useVideoTracking } from "@/hooks/useVideoTracking";
import { useCallback } from "react";

export default function VideoPlayerPage() {
  const params = useParams<{ playbackId: string }>();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const ref = searchParams.get("ref") ?? "embed";
  const playbackId = params.playbackId ?? "";

  const { onPlay, onPause, onTimeUpdate } = useVideoTracking({
    pageSlug: `embed-${ref}`,
    videoUrl: playbackId,
  });

  const handleTimeUpdate = useCallback(
    (e: Event) => {
      const player = e.target as HTMLMediaElement;
      if (player?.currentTime != null && player?.duration > 0) {
        onTimeUpdate(player.currentTime, player.duration);
      }
    },
    [onTimeUpdate],
  );

  if (!playbackId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Video not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <MuxPlayer
        playbackId={playbackId}
        autoPlay="muted"
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={handleTimeUpdate}
        style={{ width: "100%", maxWidth: "1280px", aspectRatio: "16/9" }}
      />
    </div>
  );
}
