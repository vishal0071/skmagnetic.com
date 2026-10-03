/**
 * SITE CONFIGURATION.
 *
 * Anything wrapped in {{double braces}} is a PLACEHOLDER that must be replaced
 * with real information before launch. Run `npm run check:placeholders` to list
 * every remaining placeholder across the site.
 *
 * Do not invent details here: phone numbers, addresses, GSTIN, certifications,
 * years in business, etc. must come from SK Enterprises.
 */

import settings from '../content/settings.json';

/**
 * Most values come from src/content/settings.json, which the admin panel edits.
 * The structure below is what the rest of the site uses.
 */
const c = settings.contact;
const isPlaceholderNumber = (v: string) => !v || /x/i.test(v);

export const site = {
  url: 'https://skmagnetic.com',

  /** Company name — used everywhere on the site (no separate brand name) */
  brand: 'SK Enterprises',
  /** Registered / legal name */
  legalName: 'SK Enterprises',
  /** Short descriptor shown under the logo */
  tagline: settings.tagline,

  /**
   * LAUNCH SWITCH (admin → Settings → Launch)
   * false → every page is `noindex` and robots.txt blocks crawlers (safe for staging).
   * true  → site is indexable. Flip only after placeholders and sample content are replaced.
   */
  isLive: settings.isLive,

  /**
   * REVIEW MODE. Visitors never see {{placeholders}} — they are hidden and the page
   * reads as finished. Open any page with ?review=1 to highlight every placeholder and
   * "sample content" notice (?review=0 turns it off again).
   * Set false at launch to strip the review tools from the HTML completely.
   */
  showContentNotices: settings.showContentNotices,

  /** SK Enterprises manufactures its machines — controls wording such as "manufacturer". */
  isManufacturer: true,

  /** Primary market — used in titles, local SEO copy and schema. Only real locations. */
  location: {
    state: c.state || 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
  },

  contact: {
    phone: { display: c.phoneDisplay, href: c.phone, isPlaceholder: isPlaceholderNumber(c.phone) },
    whatsapp: { display: c.whatsappDisplay, number: c.whatsapp, isPlaceholder: isPlaceholderNumber(c.whatsapp) },
    email: { address: c.email, isPlaceholder: !c.emailConfirmed },
    address: {
      street: c.street,
      locality: c.city,
      region: c.state || 'Maharashtra',
      postalCode: c.pin,
      country: 'India',
    },
    /** Google Maps → Share → Embed a map → copy only the src="" URL */
    mapsEmbedUrl: c.mapsEmbedUrl,
    /** Google Maps place link (opens directions) */
    mapsLink: c.mapsLink,
    hours: c.hours,
    /** Typical time to respond to an enquiry — only promise what the team can deliver */
    responseTime: c.responseTime,
  },

  business: settings.business,

  /** Leave a value empty to hide that icon. */
  social: settings.social,

  analytics: settings.analytics,

  seo: {
    googleSiteVerification: settings.seo.googleSiteVerification,
    bingSiteVerification: settings.seo.bingSiteVerification,
    defaultOgImage: '/og/og-default.png',
    twitterHandle: '',
    locale: 'en_IN',
  },

  forms: {
    /**
     * POST endpoint for enquiry submissions (multipart/form-data).
     * Default "/api/enquiry" = the admin service on the same server (stores leads in the
     * admin inbox and emails a notification). Any other form backend URL also works.
     * If sending fails, the form offers WhatsApp / email instead, so no lead is lost.
     */
    endpoint: settings.forms.endpoint,
    /** Extra hidden fields some providers require, e.g. { access_key: '...' } for Web3Forms */
    hiddenFields: {} as Record<string, string>,
    maxUploadMB: 5,
    acceptedFiles: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp',
  },
};

/** WhatsApp message templates */
export const whatsappMessages = {
  general: `Hello ${site.brand}, I would like to know more about your products. Please share details, price and availability.`,
  product: (productName: string) =>
    `Hello ${site.brand}, I am interested in ${productName}. Please share product details, price and availability.`,
  category: (categoryName: string) =>
    `Hello ${site.brand}, I am looking for ${categoryName}. Please share product details, price and availability.`,
};

export const mainNav = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products/', hasMenu: true },
  { label: 'Industries', href: '/industries/' },
  { label: 'About Us', href: '/about/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Contact', href: '/contact/' },
] as const;

export const legalNav = [
  { label: 'Privacy Policy', href: '/privacy-policy/' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions/' },
  { label: 'Shipping Policy', href: '/shipping-policy/' },
  { label: 'Refund Policy', href: '/refund-policy/' },
  { label: 'Sitemap', href: '/sitemap/' },
] as const;
