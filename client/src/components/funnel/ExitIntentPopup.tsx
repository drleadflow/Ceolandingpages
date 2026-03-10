import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ExitIntentPopupProps {
  quizRef?: string;
}

export function ExitIntentPopup({ quizRef = "sales-exit" }: ExitIntentPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Desktop only — skip on touch devices
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;

    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

    const handler = (e: MouseEvent) => {
      if (e.clientY > 0) return; // only fire when cursor leaves top of viewport

      const dismissedAt = sessionStorage.getItem("exit_popup_dismissed_at");
      if (dismissedAt && Date.now() - Number(dismissedAt) < COOLDOWN_MS) return;

      setVisible(true);
    };

    document.documentElement.addEventListener("mouseleave", handler);
    return () => document.documentElement.removeEventListener("mouseleave", handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <button
          onClick={() => { sessionStorage.setItem("exit_popup_dismissed_at", String(Date.now())); setVisible(false); }}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold" style={{ color: "var(--titan-text-primary)" }}>
            Wait — Don't Leave Empty-Handed
          </h2>
          <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--titan-text-secondary)" }}>
            Get your free CEO Scaling Roadmap, dashboard, and 4 bonus playbooks. Discover exactly where your practice stands and what to fix first.
          </p>

          <img
            src="/roadmap-bundle.png"
            alt="CEO Scaling Roadmap — Dashboard, Playbooks & More"
            className="mx-auto mb-5 w-full max-w-md rounded-lg"
          />

          <a
            href="/roadmap-info"
            className="inline-block w-full rounded-xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl"
            style={{ background: "linear-gradient(135deg, var(--titan-gold) 0%, var(--titan-gold-hover) 100%)" }}
          >
            Get My Free Roadmap
          </a>

          <button
            onClick={() => { sessionStorage.setItem("exit_popup_dismissed_at", String(Date.now())); setVisible(false); }}
            className="mt-4 text-sm underline"
            style={{ color: "var(--titan-text-muted)" }}
          >
            No thanks, I'm good
          </button>
        </div>
      </div>
    </div>
  );
}
