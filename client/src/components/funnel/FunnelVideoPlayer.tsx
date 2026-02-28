import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Volume2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type OverlayStyle = "front-and-center" | "loud" | "classy" | "none";
type VideoSource = "youtube" | "vimeo" | "mp4" | "loom" | "unknown";
type PlayerState = "idle" | "playing-muted" | "playing-unmuted";

interface FunnelVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  overlayStyle?: OverlayStyle;
  overlayColor?: string;
  title?: string;
  className?: string;
}

interface ParsedVideo {
  source: VideoSource;
  embedUrl: string;
  videoId: string | null;
  thumbnail: string | null;
}

// ── URL Parser ───────────────────────────────────────────────────────────────

function parseVideoUrl(url: string): ParsedVideo {
  const trimmed = url.trim();

  // YouTube
  const ytMatch =
    trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/) ??
    trimmed.match(/youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      source: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&enablejsapi=1&origin=${window.location.origin}`,
      videoId: id,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Vimeo
  const vimeoMatch =
    trimmed.match(/vimeo\.com\/(\d+)/) ??
    trimmed.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      source: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1&muted=1`,
      videoId: id,
      thumbnail: null,
    };
  }

  // Loom
  const loomMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    const id = loomMatch[1];
    return {
      source: "loom",
      embedUrl: `https://www.loom.com/embed/${id}`,
      videoId: id,
      thumbnail: `https://cdn.loom.com/sessions/thumbnails/${id}-with-play.gif`,
    };
  }

  // Direct MP4/video file
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
    return {
      source: "mp4",
      embedUrl: trimmed,
      videoId: null,
      thumbnail: null,
    };
  }

  // Unknown / already an embed URL
  return {
    source: "unknown",
    embedUrl: trimmed,
    videoId: null,
    thumbnail: null,
  };
}

function canSmartAutoplay(source: VideoSource): boolean {
  return source === "mp4" || source === "youtube" || source === "vimeo";
}

// ── Overlay Components ───────────────────────────────────────────────────────

interface OverlayProps {
  color: string;
  onClick: () => void;
}

function FrontAndCenterOverlay({ color, onClick }: OverlayProps) {
  return (
    <button
      onClick={onClick}
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 transition-opacity cursor-pointer"
    >
      <div
        className="flex flex-col items-center gap-2 rounded-2xl px-8 py-6 text-white shadow-2xl animate-pulse"
        style={{ backgroundColor: `${color}dd` }}
      >
        <Volume2 className="h-8 w-8" />
        <span className="text-base font-bold tracking-wide">Your Video Is Playing</span>
        <span className="text-sm font-medium opacity-90">Click To Unmute</span>
      </div>
    </button>
  );
}

function LoudOverlay({ color, onClick }: OverlayProps) {
  return (
    <button
      onClick={onClick}
      className="absolute inset-0 z-10 flex flex-col items-center justify-between py-6 bg-black/30 transition-opacity cursor-pointer"
    >
      <span
        className="text-2xl font-extrabold tracking-wider text-white drop-shadow-lg md:text-3xl"
        style={{ textShadow: `0 2px 12px ${color}` }}
      >
        Your Video is Playing
      </span>
      <Volume2 className="h-14 w-14 text-white animate-bounce" />
      <span
        className="text-xl font-extrabold tracking-wider text-white drop-shadow-lg md:text-2xl"
        style={{ textShadow: `0 2px 12px ${color}` }}
      >
        Click here to Unmute
      </span>
    </button>
  );
}

function ClassyOverlay({ color, onClick }: OverlayProps) {
  return (
    <button
      onClick={onClick}
      className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full px-4 py-2 text-white text-sm font-semibold shadow-lg animate-bounce cursor-pointer"
      style={{ backgroundColor: `${color}ee` }}
    >
      <Volume2 className="h-4 w-4" />
      Click to Unmute
    </button>
  );
}

// ── YouTube IFrame API types (minimal subset) ────────────────────────────────

interface YTPlayer {
  destroy(): void;
  unMute(): void;
  setVolume(volume: number): void;
}

interface YTPlayerConstructor {
  new (
    elementId: string,
    config: {
      width?: string | number;
      height?: string | number;
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: { onReady?: () => void };
    },
  ): YTPlayer;
}

interface YTNamespace {
  Player: YTPlayerConstructor;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: YTNamespace;
  }
}

// ── YouTube Player (uses IFrame API for mute control) ────────────────────────

interface YouTubePlayerProps {
  embedUrl: string;
  onReady: () => void;
  playerRef: React.MutableRefObject<YTPlayer | null>;
}

function useYouTubeApi(): boolean {
  const [ready, setReady] = useState(!!window.YT?.Player);

  useEffect(() => {
    if (window.YT?.Player) {
      setReady(true);
      return;
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      setReady(true);
    };

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  }, []);

  return ready;
}

function YouTubePlayer({ embedUrl, onReady, playerRef }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiReady = useYouTubeApi();
  const [iframeId] = useState(() => `yt-player-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (!apiReady || !containerRef.current) return;

    // Extract video ID from embed URL
    const match = embedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (!match) return;

    const player = new (window.YT!).Player(iframeId, {
      width: "100%",
      height: "100%",
      videoId: match[1],
      playerVars: {
        autoplay: 1,
        mute: 1,
        start: 0,
        enablejsapi: 1,
        origin: window.location.origin,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: () => {
          playerRef.current = player;
          onReady();
        },
      },
    });

    return () => {
      try {
        player.destroy();
      } catch {
        // player may already be destroyed
      }
    };
  }, [apiReady, embedUrl, iframeId, onReady, playerRef]);

  return (
    <div className="relative aspect-video w-full" ref={containerRef}>
      <div id={iframeId} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

// ── Vimeo Player (uses postMessage for mute control) ─────────────────────────

interface VimeoPlayerProps {
  embedUrl: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

function VimeoPlayer({ embedUrl, iframeRef }: VimeoPlayerProps) {
  return (
    <iframe
      ref={iframeRef}
      src={embedUrl}
      className="aspect-video w-full border-0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
    />
  );
}

// ── MP4 Player ───────────────────────────────────────────────────────────────

interface Mp4PlayerProps {
  src: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onCanPlay: () => void;
}

function Mp4Player({ src, videoRef, onCanPlay }: Mp4PlayerProps) {
  return (
    <video
      ref={videoRef}
      src={src}
      className="aspect-video w-full"
      autoPlay
      muted
      playsInline
      onCanPlay={onCanPlay}
    />
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function FunnelVideoPlayer({
  videoUrl,
  thumbnailUrl,
  overlayStyle = "front-and-center",
  overlayColor = "#3974FF",
  title = "Video",
  className = "",
}: FunnelVideoPlayerProps) {
  const parsed = parseVideoUrl(videoUrl);
  const smartAutoplay = canSmartAutoplay(parsed.source);

  const [state, setState] = useState<PlayerState>(smartAutoplay ? "playing-muted" : "idle");
  const [playerReady, setPlayerReady] = useState(false);

  // Refs for different player types
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const vimeoIframeRef = useRef<HTMLIFrameElement | null>(null);

  const resolvedThumbnail = thumbnailUrl ?? parsed.thumbnail;

  const handleUnmute = useCallback(() => {
    if (state !== "playing-muted") return;

    switch (parsed.source) {
      case "mp4":
        if (videoRef.current) {
          videoRef.current.muted = false;
        }
        break;
      case "youtube":
        if (ytPlayerRef.current) {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(100);
        }
        break;
      case "vimeo":
        if (vimeoIframeRef.current?.contentWindow) {
          vimeoIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ method: "setVolume", value: 1 }),
            "*",
          );
        }
        break;
    }

    setState("playing-unmuted");
  }, [state, parsed.source]);

  const handlePlayFromIdle = useCallback(() => {
    setState("playing-unmuted");
  }, []);

  const handleYouTubeReady = useCallback(() => {
    setPlayerReady(true);
  }, []);

  const handleMp4CanPlay = useCallback(() => {
    setPlayerReady(true);
  }, []);

  // For Vimeo, set ready immediately since we can't easily detect
  useEffect(() => {
    if (parsed.source === "vimeo" && state === "playing-muted") {
      const timer = setTimeout(() => setPlayerReady(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [parsed.source, state]);

  const showOverlay = state === "playing-muted" && overlayStyle !== "none" && playerReady;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[var(--titan-border)] bg-black shadow-xl ${className}`}
    >
      {/* Idle State: Thumbnail + Play Button */}
      {state === "idle" && (
        <button
          onClick={handlePlayFromIdle}
          className="relative aspect-video w-full cursor-pointer group"
        >
          {resolvedThumbnail ? (
            <img
              src={resolvedThumbnail}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-900" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/40">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition group-hover:bg-white/30 group-hover:scale-110">
              <Play className="ml-1 h-8 w-8 text-white" fill="white" />
            </div>
          </div>
        </button>
      )}

      {/* Playing States: Render the actual player */}
      {state !== "idle" && (
        <>
          {parsed.source === "mp4" && (
            <Mp4Player
              src={parsed.embedUrl}
              videoRef={videoRef}
              onCanPlay={handleMp4CanPlay}
            />
          )}

          {parsed.source === "youtube" && (
            <YouTubePlayer
              embedUrl={parsed.embedUrl}
              onReady={handleYouTubeReady}
              playerRef={ytPlayerRef}
            />
          )}

          {parsed.source === "vimeo" && (
            <VimeoPlayer
              embedUrl={parsed.embedUrl}
              iframeRef={vimeoIframeRef}
            />
          )}

          {(parsed.source === "loom" || parsed.source === "unknown") && (
            <iframe
              src={parsed.embedUrl}
              className="aspect-video w-full border-0"
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* Unmute Overlay */}
          {showOverlay && (
            <>
              {overlayStyle === "front-and-center" && (
                <FrontAndCenterOverlay color={overlayColor} onClick={handleUnmute} />
              )}
              {overlayStyle === "loud" && (
                <LoudOverlay color={overlayColor} onClick={handleUnmute} />
              )}
              {overlayStyle === "classy" && (
                <ClassyOverlay color={overlayColor} onClick={handleUnmute} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export type { OverlayStyle, FunnelVideoPlayerProps };
