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

    const handler = (e: MouseEvent) => {
      if (e.clientY > 0) return; // only fire when cursor leaves top of viewport
      if (sessionStorage.getItem("exit_popup_shown")) return;

      sessionStorage.setItem("exit_popup_shown", "1");
      setVisible(true);
    };

    document.documentElement.addEventListener("mouseleave", handler);
    return () => document.documentElement.removeEventListener("mouseleave", handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <button
          onClick={() => setVisible(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold" style={{ color: "var(--titan-text-primary)" }}>
            Wait — Don't Leave Empty-Handed
          </h2>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--titan-text-secondary)" }}>
            Get your free Practice Growth Roadmap. Discover exactly where your practice stands and what to fix first.
          </p>

          <a
            href={`/quiz?ref=${quizRef}`}
            className="inline-block w-full rounded-xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl"
            style={{ background: "linear-gradient(135deg, var(--titan-gold) 0%, var(--titan-gold-hover) 100%)" }}
          >
            Get My Free Roadmap
          </a>

          <button
            onClick={() => setVisible(false)}
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
