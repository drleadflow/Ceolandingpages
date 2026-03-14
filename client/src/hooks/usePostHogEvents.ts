import { useEffect, useRef } from "react";
import posthog from "posthog-js";

// ── Scroll Depth Tracking ────────────────────────────────────────────────────

const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;

/**
 * Tracks scroll depth at 25%, 50%, 75%, 100% milestones.
 * Fires once per threshold per page load.
 */
export function useScrollDepthTracking(pageSlug: string) {
  const firedRef = useRef(new Set<number>());

  useEffect(() => {
    firedRef.current = new Set<number>();

    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const percent = Math.round((scrollTop / docHeight) * 100);

      for (const threshold of SCROLL_THRESHOLDS) {
        if (percent >= threshold && !firedRef.current.has(threshold)) {
          firedRef.current.add(threshold);
          posthog.capture("scroll_depth_reached", {
            page: pageSlug,
            depth_percent: threshold,
            url: window.location.pathname,
          });
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pageSlug]);
}

// ── Button Click Tracking ────────────────────────────────────────────────────

/**
 * Tracks all button clicks within the page, capturing button text as a property.
 * Uses event delegation on document.body.
 */
export function useButtonClickTracking(pageSlug: string) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const button = target.closest("button, a[role='button'], [data-track-button]");
      if (!button) return;

      const text =
        button.getAttribute("data-track-label") ??
        button.textContent?.trim().slice(0, 100) ??
        "unknown";

      // Skip empty or icon-only buttons
      if (!text || text.length === 0) return;

      posthog.capture("button_clicked", {
        page: pageSlug,
        button_text: text,
        button_id: button.id || undefined,
        url: window.location.pathname,
      });
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pageSlug]);
}

// ── Form Submission Tracking ─────────────────────────────────────────────────

/**
 * Tracks all form submissions, capturing the form name/id.
 * Uses event delegation on document.body.
 */
export function useFormSubmitTracking(pageSlug: string) {
  useEffect(() => {
    function handleSubmit(e: Event) {
      const form = e.target as HTMLFormElement;
      if (form.tagName !== "FORM") return;

      const formName =
        form.getAttribute("data-track-form") ??
        form.getAttribute("name") ??
        form.id ??
        "unnamed_form";

      posthog.capture("form_submitted", {
        page: pageSlug,
        form_name: formName,
        url: window.location.pathname,
      });
    }

    document.addEventListener("submit", handleSubmit, { capture: true });
    return () => document.removeEventListener("submit", handleSubmit, { capture: true });
  }, [pageSlug]);
}

// ── Outbound Link Tracking ───────────────────────────────────────────────────

/**
 * Tracks clicks on links that navigate to external domains.
 */
export function useOutboundLinkTracking(pageSlug: string) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.href;
      if (!href) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.hostname === window.location.hostname) return;

        posthog.capture("outbound_link_clicked", {
          page: pageSlug,
          link_url: href,
          link_text: link.textContent?.trim().slice(0, 100) ?? "",
          url: window.location.pathname,
        });
      } catch {
        // invalid URL, skip
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pageSlug]);
}

// ── Combined Hook ────────────────────────────────────────────────────────────

/**
 * All-in-one hook that enables all PostHog custom event tracking for a page.
 * Drop this into any page component alongside usePixelTracking.
 */
export function usePostHogEvents(pageSlug: string) {
  useScrollDepthTracking(pageSlug);
  useButtonClickTracking(pageSlug);
  useFormSubmitTracking(pageSlug);
  useOutboundLinkTracking(pageSlug);
}
