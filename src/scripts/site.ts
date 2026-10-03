/**
 * Site-wide behaviour: mobile menu, conversion tracking, reveal-on-scroll.
 * Kept deliberately small — no frameworks.
 *
 * Analytics events are pushed to window.dataLayer (Google Tag Manager).
 * If GA4 is configured without GTM, events are also sent with gtag().
 *
 *   phone_click      tel: links
 *   whatsapp_click   wa.me links
 *   email_click      mailto: links
 *   cta_click        quote / enquiry buttons
 *   product_enquiry  enquiry buttons tied to a product
 *   file_download    datasheets / documents
 *   view_item        product page view
 *   generate_lead, quote_request — sent by the enquiry form (see EnquiryForm.astro)
 */
import { track } from './track';

// ---------- Mobile navigation ----------
const header = document.querySelector<HTMLElement>('[data-header]');
const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const panel = document.getElementById('mobile-nav');
const label = document.querySelector('[data-nav-label]');

function setMenu(open: boolean) {
  if (!header || !toggle || !panel) return;
  toggle.setAttribute('aria-expanded', String(open));
  panel.hidden = !open;
  header.toggleAttribute('data-open', open);
  document.documentElement.style.overflow = open ? 'hidden' : '';
  if (label) label.textContent = open ? 'Close menu' : 'Open menu';
}
toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    toggle.focus();
  }
});
panel?.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('a')) setMenu(false);
});
matchMedia('(min-width: 1100px)').addEventListener('change', (e) => e.matches && setMenu(false));

// ---------- Click tracking ----------
const pageProduct = (() => {
  try {
    return JSON.parse(document.body.dataset.product || 'null') as { name: string; category: string } | null;
  } catch {
    return null;
  }
})();

document.addEventListener(
  'click',
  (e) => {
    const el = (e.target as HTMLElement).closest<HTMLAnchorElement | HTMLButtonElement>('a, button');
    if (!el) return;
    const href = el instanceof HTMLAnchorElement ? el.href : '';
    let event = el.dataset.track;
    if (!event) {
      if (href.startsWith('tel:')) event = 'phone_click';
      else if (href.includes('wa.me/') || href.includes('api.whatsapp.com')) event = 'whatsapp_click';
      else if (href.startsWith('mailto:')) event = 'email_click';
      else if (el.hasAttribute('download')) event = 'file_download';
    }
    if (!event) return;
    track(event, {
      link_text: (el.dataset.label || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
      link_location: el.dataset.location,
      link_url: href || undefined,
      product_name: el.dataset.product || pageProduct?.name,
      product_category: pageProduct?.category,
    });
  },
  { capture: true },
);

// ---------- Product page view ----------
if (pageProduct) {
  track('view_item', { product_name: pageProduct.name, product_category: pageProduct.category });
}

// ---------- Reveal on scroll ----------
const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}
