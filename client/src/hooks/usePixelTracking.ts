import { useEffect, useCallback, useRef } from "react";
import posthog from "posthog-js";
import { trpc } from "@/lib/trpc";

// Default event mappings per platform
const DEFAULT_EVENT_MAPPINGS: Record<string, Record<string, string>> = {
  facebook: {
    page_view: "PageView",
    checkout_start: "InitiateCheckout",
    purchase: "Purchase",
    upsell_view: "ViewContent",
    upsell_accept: "Purchase",
    downsell_view: "ViewContent",
    downsell_accept: "Purchase",
  },
  google_analytics: {
    page_view: "page_view",
    checkout_start: "begin_checkout",
    purchase: "purchase",
    upsell_view: "view_item",
    upsell_accept: "purchase",
    downsell_view: "view_item",
    downsell_accept: "purchase",
  },
  tiktok: {
    page_view: "ViewContent",
    checkout_start: "InitiateCheckout",
    purchase: "CompletePayment",
    upsell_view: "ViewContent",
    upsell_accept: "CompletePayment",
    downsell_view: "ViewContent",
    downsell_accept: "CompletePayment",
  },
  google_tag_manager: {
    page_view: "page_view",
    checkout_start: "begin_checkout",
    purchase: "purchase",
    upsell_view: "view_item",
    upsell_accept: "purchase",
    downsell_view: "view_item",
    downsell_accept: "purchase",
  },
  hyros: {
    page_view: "PageView",
    checkout_start: "InitiateCheckout",
    purchase: "Purchase",
    upsell_view: "ViewContent",
    upsell_accept: "Purchase",
    downsell_view: "ViewContent",
    downsell_accept: "Purchase",
  },
  posthog: {
    page_view: "$pageview",
    checkout_start: "checkout_started",
    purchase: "purchase_completed",
    upsell_view: "upsell_viewed",
    upsell_accept: "upsell_accepted",
    downsell_view: "downsell_viewed",
    downsell_accept: "downsell_accepted",
  },
};

type PixelConfig = {
  id: number;
  platform: string;
  pixelId: string;
  pageScope: string | null;
  eventMapping: string | null;
};

function getEventMapping(pixel: PixelConfig): Record<string, string> {
  if (pixel.eventMapping) {
    try {
      return JSON.parse(pixel.eventMapping);
    } catch {
      // fall through to defaults
    }
  }
  return DEFAULT_EVENT_MAPPINGS[pixel.platform] ?? {};
}

function matchesPageScope(pixel: PixelConfig, pageSlug: string): boolean {
  if (!pixel.pageScope) return true; // null = all pages
  try {
    const scopes = JSON.parse(pixel.pageScope) as string[];
    return scopes.includes(pageSlug);
  } catch {
    return true;
  }
}

// Track which scripts have been injected to avoid duplicates
const injectedPixels = new Set<string>();

function injectFacebookPixel(pixelId: string): void {
  const key = `fb_${pixelId}`;
  if (injectedPixels.has(key)) return;
  injectedPixels.add(key);

  // fbq init snippet
  const script = document.createElement("script");
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
}

function injectGoogleAnalytics(measurementId: string): void {
  const key = `ga_${measurementId}`;
  if (injectedPixels.has(key)) return;
  injectedPixels.add(key);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  const initScript = document.createElement("script");
  initScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(initScript);
}

function injectGTM(containerId: string): void {
  const key = `gtm_${containerId}`;
  if (injectedPixels.has(key)) return;
  injectedPixels.add(key);

  const script = document.createElement("script");
  script.innerHTML = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${containerId}');
  `;
  document.head.appendChild(script);
}

function injectTikTokPixel(pixelId: string): void {
  const key = `tt_${pixelId}`;
  if (injectedPixels.has(key)) return;
  injectedPixels.add(key);

  const script = document.createElement("script");
  script.innerHTML = `
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
      ttq.load('${pixelId}');
      ttq.page();
    }(window, document, 'ttq');
  `;
  document.head.appendChild(script);
}

function injectHyrosScript(pixelId: string): void {
  const key = `hyros_${pixelId}`;
  if (injectedPixels.has(key)) return;
  injectedPixels.add(key);

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = `https://212704.t.hyros.com/v1/lst/universal-script?ph=${pixelId}&tag=!clicked&ref_url=${encodeURI(document.URL)}`;
  document.head.appendChild(script);
}

function initPostHog(apiKey: string): void {
  const key = `ph_${apiKey}`;
  if (injectedPixels.has(key)) return;
  injectedPixels.add(key);

  posthog.init(apiKey, {
    api_host: "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
  });
}

function injectPixelScript(pixel: PixelConfig): void {
  switch (pixel.platform) {
    case "facebook":
      injectFacebookPixel(pixel.pixelId);
      break;
    case "google_analytics":
      injectGoogleAnalytics(pixel.pixelId);
      break;
    case "google_tag_manager":
      injectGTM(pixel.pixelId);
      break;
    case "tiktok":
      injectTikTokPixel(pixel.pixelId);
      break;
    case "hyros":
      injectHyrosScript(pixel.pixelId);
      break;
    case "posthog":
      initPostHog(pixel.pixelId);
      break;
  }
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void };
  }
}

function firePixelEvent(
  pixel: PixelConfig,
  mappedEvent: string,
  params?: Record<string, unknown>,
): void {
  switch (pixel.platform) {
    case "facebook":
      window.fbq?.("track", mappedEvent, params);
      break;
    case "google_analytics":
      window.gtag?.("event", mappedEvent, params);
      break;
    case "google_tag_manager":
      window.dataLayer?.push({ event: mappedEvent, ...params });
      break;
    case "tiktok":
      window.ttq?.track(mappedEvent, params);
      break;
    case "posthog":
      posthog.capture(mappedEvent, params);
      break;
  }
}

export function usePixelTracking(pageSlug: string) {
  const injectedRef = useRef(false);

  const { data: pixels } = trpc.funnelAdmin.tracking.getActive.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  // Filter pixels for this page
  const activePixels = pixels?.filter((p) => matchesPageScope(p, pageSlug)) ?? [];

  // Inject scripts on mount
  useEffect(() => {
    if (injectedRef.current || activePixels.length === 0) return;
    injectedRef.current = true;
    for (const pixel of activePixels) {
      injectPixelScript(pixel);
    }
  }, [activePixels]);

  const fireEvent = useCallback(
    (internalEvent: string, params?: Record<string, unknown>) => {
      for (const pixel of activePixels) {
        const mapping = getEventMapping(pixel);
        const mappedEvent = mapping[internalEvent];
        if (mappedEvent) {
          firePixelEvent(pixel, mappedEvent, params);
        }
      }
    },
    [activePixels],
  );

  return { fireEvent };
}
