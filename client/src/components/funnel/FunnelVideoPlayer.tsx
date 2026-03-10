import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Volume2 } from "lucide-react";
import MuxPlayer from "@mux/mux-player-react";
import { useVideoHeatmap } from "@/hooks/useVideoHeatmap";

// ── Types ────────────────────────────────────────────────────────────────────

type OverlayStyle = "front-and-center" | "loud" | "classy" | "none";
type VideoSource = "youtube" | "vimeo" | "mp4" | "loom" | "mux" | "unknown";
type PlayerState = "idle" | "playing-muted" | "playing-unmuted";

interface FunnelVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  overlayStyle?: OverlayStyle;
  overlayColor?: string;
  title?: string;
  className?: string;
  onWatchProgress?: (seconds: number, percent: number) => void;
  heatmapVideoId?: string;
  heatmapPageSlug?: string;
  heatmapSessionId?: string;
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

  // Mux playback ID (bare alphanumeric string, 10+ chars, no dots/slashes)
  if (/^[a-zA-Z0-9]{10,}$/.test(trimmed)) {
    return {
      source: "mux",
      embedUrl: trimmed,
      videoId: trimmed,
      thumbnail: `https://image.mux.com/${trimmed}/thumbnail.webp?time=0`,
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
  return source === "mp4" || source === "youtube" || source === "vimeo" || source === "mux";
}

// ── Overlay Keyframe Animations ───────────────────────────────────────────────

const OVERLAY_STYLES = `
  @keyframes fac-enter {
    0%   { opacity: 0; transform: scale(0.88) translateY(6px); }
    100% { opacity: 1; transform: scale(1)    translateY(0); }
  }
  @keyframes fac-glow-pulse {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50%       { opacity: 1;   transform: scale(1.06); }
  }
  @keyframes eq-bar-1 {
    0%,100% { height: 4px;  }
    25%     { height: 14px; }
    50%     { height: 8px;  }
    75%     { height: 18px; }
  }
  @keyframes eq-bar-2 {
    0%,100% { height: 18px; }
    25%     { height: 6px;  }
    50%     { height: 20px; }
    75%     { height: 4px;  }
  }
  @keyframes eq-bar-3 {
    0%,100% { height: 10px; }
    25%     { height: 22px; }
    50%     { height: 5px;  }
    75%     { height: 14px; }
  }
  @keyframes eq-bar-4 {
    0%,100% { height: 22px; }
    25%     { height: 8px;  }
    50%     { height: 16px; }
    75%     { height: 6px;  }
  }
  @keyframes eq-bar-5 {
    0%,100% { height: 6px;  }
    25%     { height: 18px; }
    50%     { height: 12px; }
    75%     { height: 22px; }
  }
  @keyframes loud-enter {
    0%   { opacity: 0; letter-spacing: 0.3em; }
    100% { opacity: 1; letter-spacing: 0.12em; }
  }
  @keyframes loud-ring {
    0%,100% { box-shadow: 0 0 0 0 currentColor; opacity: 0.7; }
    50%      { box-shadow: 0 0 0 12px transparent; opacity: 1; }
  }
  @keyframes loud-scan {
    0%   { transform: translateY(-100%); opacity: 0; }
    10%  { opacity: 0.6; }
    90%  { opacity: 0.6; }
    100% { transform: translateY(100%); opacity: 0; }
  }
  @keyframes classy-enter {
    0%   { opacity: 0; transform: translateX(-8px) scale(0.94); }
    100% { opacity: 1; transform: translateX(0)   scale(1); }
  }
  @keyframes classy-dot {
    0%,100% { opacity: 1; transform: scale(1);    }
    50%      { opacity: 0.4; transform: scale(0.6); }
  }
  @keyframes classy-bar-1 {
    0%,100% { height: 3px;  }
    50%     { height: 10px; }
  }
  @keyframes classy-bar-2 {
    0%,100% { height: 10px; }
    50%     { height: 3px;  }
  }
  @keyframes classy-bar-3 {
    0%,100% { height: 6px; }
    33%     { height: 12px; }
    66%     { height: 2px;  }
  }
`;

// ── Overlay Components ───────────────────────────────────────────────────────

interface OverlayProps {
  color: string;
  onClick: () => void;
}

/** Injects keyframe styles once into the document head. */
function useOverlayStyles() {
  if (typeof document !== "undefined" && !document.getElementById("funnel-overlay-keyframes")) {
    const el = document.createElement("style");
    el.id = "funnel-overlay-keyframes";
    el.textContent = OVERLAY_STYLES;
    document.head.appendChild(el);
  }
}

// ── Equalizer Bar sub-component ───────────────────────────────────────────────

function EqBars({ color, size = "md" }: { color: string; size?: "sm" | "md" }) {
  const bars = [
    { anim: "eq-bar-1", delay: "0s" },
    { anim: "eq-bar-2", delay: "0.12s" },
    { anim: "eq-bar-3", delay: "0.24s" },
    { anim: "eq-bar-4", delay: "0.07s" },
    { anim: "eq-bar-5", delay: "0.18s" },
  ];
  const w = size === "sm" ? "2px" : "3px";
  const maxH = size === "sm" ? 14 : 24;
  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: size === "sm" ? "2px" : "3px", height: `${maxH}px` }}
      aria-hidden="true"
    >
      {bars.map((b, i) => (
        <span
          key={i}
          style={{
            display: "block",
            width: w,
            height: "4px",
            borderRadius: "2px",
            backgroundColor: color,
            animation: `${b.anim} 0.9s ease-in-out infinite`,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  );
}

// ── 1. Front and Center ───────────────────────────────────────────────────────

function FrontAndCenterOverlay({ color, onClick }: OverlayProps) {
  useOverlayStyles();

  return (
    <button
      onClick={onClick}
      aria-label="Unmute video"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.18)",
        cursor: "pointer",
        border: "none",
        padding: 0,
      }}
    >
      {/* Ambient glow behind card */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          width: "260px",
          height: "140px",
          borderRadius: "50%",
          background: color,
          filter: "blur(60px)",
          opacity: 0.28,
          animation: "fac-glow-pulse 2.4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Glass card */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          padding: "28px 40px",
          borderRadius: "20px",
          background: "rgba(8, 12, 22, 0.62)",
          backdropFilter: "blur(18px) saturate(1.4)",
          WebkitBackdropFilter: "blur(18px) saturate(1.4)",
          border: `1px solid ${color}44`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.06) inset, 0 24px 64px rgba(0,0,0,0.55), 0 0 32px ${color}22`,
          animation: "fac-enter 0.38s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        {/* Icon + eq bars row */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Volume2
            style={{ width: "22px", height: "22px", color: color, flexShrink: 0 }}
            strokeWidth={1.75}
          />
          <EqBars color={color} size="md" />
        </div>

        {/* Label */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1,
            }}
          >
            Your video is playing
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "#ffffff",
              lineHeight: 1,
            }}
          >
            Tap to Unmute
          </p>
        </div>

        {/* Accent bottom line */}
        <span
          aria-hidden="true"
          style={{
            display: "block",
            width: "48px",
            height: "2px",
            borderRadius: "2px",
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
        />
      </div>
    </button>
  );
}

// ── 2. Loud ───────────────────────────────────────────────────────────────────

function LoudOverlay({ color, onClick }: OverlayProps) {
  useOverlayStyles();

  return (
    <button
      onClick={onClick}
      aria-label="Unmute video"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "clamp(20px, 5%, 40px)",
        background: "rgba(0,0,0,0.46)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        cursor: "pointer",
        border: "none",
        overflow: "hidden",
      }}
    >
      {/* Horizontal scan-line sweep */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, transparent, ${color}18 50%, transparent)`,
          animation: "loud-scan 3.5s linear infinite",
          pointerEvents: "none",
        }}
      />

      {/* Top label */}
      <span
        style={{
          position: "relative",
          fontSize: "clamp(13px, 2.2vw, 16px)",
          fontWeight: 600,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.65)",
          animation: "loud-enter 0.5s ease-out both",
        }}
      >
        Your Video Is Playing
      </span>

      {/* Center HUD ring */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            position: "relative",
            width: "clamp(72px, 12vw, 96px)",
            height: "clamp(72px, 12vw, 96px)",
            borderRadius: "50%",
            border: `2px solid ${color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 24px ${color}66, inset 0 0 24px ${color}22`,
            animation: "loud-ring 1.8s ease-in-out infinite",
            color: color,
          }}
        >
          {/* Inner fill */}
          <div
            style={{
              position: "absolute",
              inset: "8px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}33, transparent 70%)`,
            }}
          />
          <Volume2
            style={{ width: "clamp(24px,4.5vw,36px)", height: "clamp(24px,4.5vw,36px)", color: "#fff", position: "relative" }}
            strokeWidth={1.5}
          />
        </div>

        {/* Equalizer bars under icon */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "28px" }} aria-hidden="true">
          {[
            { anim: "eq-bar-1", delay: "0s" },
            { anim: "eq-bar-2", delay: "0.1s" },
            { anim: "eq-bar-3", delay: "0.22s" },
            { anim: "eq-bar-4", delay: "0.06s" },
            { anim: "eq-bar-5", delay: "0.16s" },
            { anim: "eq-bar-2", delay: "0.3s" },
            { anim: "eq-bar-1", delay: "0.08s" },
          ].map((b, i) => (
            <span
              key={i}
              style={{
                display: "block",
                width: "4px",
                height: "4px",
                borderRadius: "2px",
                backgroundColor: color,
                animation: `${b.anim} 0.85s ease-in-out infinite`,
                animationDelay: b.delay,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <span
        style={{
          position: "relative",
          fontSize: "clamp(20px, 4vw, 34px)",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "#ffffff",
          textShadow: `0 0 40px ${color}cc, 0 2px 12px rgba(0,0,0,0.6)`,
          animation: "loud-enter 0.5s 0.1s ease-out both",
        }}
      >
        Click to Unmute
      </span>
    </button>
  );
}

// ── 3. Classy ─────────────────────────────────────────────────────────────────

function ClassyOverlay({ color, onClick }: OverlayProps) {
  useOverlayStyles();

  return (
    <button
      onClick={onClick}
      aria-label="Unmute video"
      style={{
        position: "absolute",
        left: "12px",
        top: "12px",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "7px 14px 7px 10px",
        borderRadius: "999px",
        background: "rgba(6, 10, 20, 0.72)",
        backdropFilter: "blur(16px) saturate(1.5)",
        WebkitBackdropFilter: "blur(16px) saturate(1.5)",
        border: `1px solid ${color}55`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.06) inset, 0 4px 20px rgba(0,0,0,0.45), 0 0 12px ${color}33`,
        cursor: "pointer",
        animation: "classy-enter 0.35s cubic-bezier(0.16,1,0.3,1) both",
        color: "#fff",
      }}
    >
      {/* Live indicator dot */}
      <span
        aria-hidden="true"
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
          boxShadow: `0 0 6px ${color}`,
          animation: "classy-dot 1.4s ease-in-out infinite",
        }}
      />

      {/* Mini eq bars */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "12px" }} aria-hidden="true">
        {[
          { anim: "classy-bar-1", delay: "0s" },
          { anim: "classy-bar-2", delay: "0.15s" },
          { anim: "classy-bar-3", delay: "0.07s" },
        ].map((b, i) => (
          <span
            key={i}
            style={{
              display: "block",
              width: "2px",
              height: "3px",
              borderRadius: "1px",
              backgroundColor: color,
              animation: `${b.anim} 0.8s ease-in-out infinite`,
              animationDelay: b.delay,
            }}
          />
        ))}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: "rgba(255,255,255,0.92)",
          whiteSpace: "nowrap",
        }}
      >
        Tap to Unmute
      </span>
    </button>
  );
}

// ── YouTube IFrame API types (minimal subset) ────────────────────────────────

interface YTPlayer {
  destroy(): void;
  unMute(): void;
  setVolume(volume: number): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
}

interface YTPlayerConstructor {
  new (
    elementId: string,
    config: {
      width?: string | number;
      height?: string | number;
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: { onReady?: () => void; onStateChange?: (event: { data: number }) => void };
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract video ID from embed URL
  const videoId = embedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/)?.[1] ?? "";

  // Build a plain iframe src — no IFrame API constructor, no cookie resume
  const iframeSrc = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&start=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0&modestbranding=1`
    : "";

  useEffect(() => {
    if (!iframeRef.current || !videoId) return;

    // Expose a minimal "player" interface via postMessage so unmute still works
    const iframe = iframeRef.current;
    playerRef.current = {
      destroy: () => {},
      unMute: () => {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "unMute", args: "" }),
          "*",
        );
      },
      setVolume: (vol: number) => {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [vol] }),
          "*",
        );
      },
      seekTo: (seconds: number) => {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }),
          "*",
        );
      },
      getCurrentTime: () => 0,
    };

    // Signal ready after a short delay for iframe to initialize
    const timer = setTimeout(() => onReady(), 1500);
    return () => clearTimeout(timer);
  }, [videoId, onReady, playerRef]);

  if (!iframeSrc) return null;

  return (
    <div className="relative aspect-video w-full">
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className="absolute inset-0 w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
      />
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
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onSeeking?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onSeeked?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onPause?: () => void;
  onEnded?: () => void;
}

function Mp4Player({ src, videoRef, onCanPlay, onTimeUpdate, onSeeking, onSeeked, onPause, onEnded }: Mp4PlayerProps) {
  return (
    <video
      ref={videoRef}
      src={src}
      className="aspect-video w-full"
      autoPlay
      muted
      playsInline
      onCanPlay={onCanPlay}
      onTimeUpdate={onTimeUpdate}
      onSeeking={onSeeking}
      onSeeked={onSeeked}
      onPause={onPause}
      onEnded={onEnded}
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
  onWatchProgress,
  heatmapVideoId,
  heatmapPageSlug,
  heatmapSessionId,
}: FunnelVideoPlayerProps) {
  const parsed = parseVideoUrl(videoUrl);
  const smartAutoplay = canSmartAutoplay(parsed.source);

  const [state, setState] = useState<PlayerState>(smartAutoplay ? "playing-muted" : "idle");
  const [playerReady, setPlayerReady] = useState(false);

  // Refs for different player types
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const vimeoIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Video heatmap tracking
  const enableHeatmap = !!(heatmapVideoId && heatmapPageSlug && heatmapSessionId);
  const heatmap = useVideoHeatmap({
    videoId: heatmapVideoId ?? parsed.videoId ?? videoUrl,
    pageSlug: heatmapPageSlug ?? "",
    sessionId: heatmapSessionId ?? "",
    onProgress: onWatchProgress,
  });

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
      case "mux":
        // MuxPlayer reacts to muted prop change via state
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
              onCanPlay={() => {
                handleMp4CanPlay();
                if (enableHeatmap && videoRef.current) {
                  heatmap.handleLoadedMetadata(videoRef.current.duration);
                }
              }}
              onTimeUpdate={enableHeatmap ? (e: React.SyntheticEvent<HTMLVideoElement>) => {
                heatmap.handleTimeUpdate(e.currentTarget.currentTime);
              } : undefined}
              onSeeking={enableHeatmap ? (e: React.SyntheticEvent<HTMLVideoElement>) => {
                heatmap.handleSeeking(e.currentTarget.currentTime);
              } : undefined}
              onSeeked={enableHeatmap ? (e: React.SyntheticEvent<HTMLVideoElement>) => {
                heatmap.handleSeeked(e.currentTarget.currentTime);
              } : undefined}
              onPause={enableHeatmap ? heatmap.handlePause : undefined}
              onEnded={enableHeatmap ? heatmap.handleEnded : undefined}
            />
          )}

          {parsed.source === "mux" && (
            <MuxPlayer
              playbackId={parsed.videoId ?? ""}
              autoPlay="muted"
              startTime={0}
              disableCookies
              className="aspect-video w-full"
              onCanPlay={(e: any) => {
                // Force playback to start from 0 in case of cached position
                const el = e.target;
                if (el && el.currentTime > 1) {
                  el.currentTime = 0;
                }
                setPlayerReady(true);
              }}
              muted={state === "playing-muted"}
              onLoadedMetadata={enableHeatmap ? (e: any) => {
                heatmap.handleLoadedMetadata(e.target?.duration ?? 0);
              } : undefined}
              onTimeUpdate={enableHeatmap ? (e: any) => {
                heatmap.handleTimeUpdate(e.target?.currentTime ?? 0);
              } : undefined}
              onSeeking={enableHeatmap ? (e: any) => {
                heatmap.handleSeeking(e.target?.currentTime ?? 0);
              } : undefined}
              onSeeked={enableHeatmap ? (e: any) => {
                heatmap.handleSeeked(e.target?.currentTime ?? 0);
              } : undefined}
              onPause={enableHeatmap ? heatmap.handlePause : undefined}
              onEnded={enableHeatmap ? heatmap.handleEnded : undefined}
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
