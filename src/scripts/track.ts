type Params = Record<string, string | number | boolean | undefined | null>;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Push a conversion / interaction event to GTM's dataLayer (and gtag if GA4 runs without GTM). */
export function track(event: string, params: Params = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, page_path: location.pathname, ...clean });
  if (typeof window.gtag === 'function' && !('google_tag_manager' in window)) {
    window.gtag('event', event, clean);
  }
  if (import.meta.env.DEV) console.debug('[track]', event, clean);
}
