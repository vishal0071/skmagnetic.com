/**
 * JSON-LD structured data builders.
 * Only real values are emitted — {{placeholders}} are filtered out so Google
 * never sees unfinished business details.
 */
import { site } from '@/config/site';
import { absoluteUrl } from '@/lib/links';
import { hasPlaceholder, realValue, stripPlaceholders } from '@/lib/placeholders';

type Json = Record<string, unknown>;

const ORG_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;
const LOCAL_ID = `${site.url}/#localbusiness`;

const phone = () => (site.contact.phone.isPlaceholder ? undefined : site.contact.phone.href);
const email = () => (site.contact.email.isPlaceholder ? undefined : site.contact.email.address);
const sameAs = () => Object.values(site.social).filter(Boolean);

const postalAddress = () => {
  const a = site.contact.address;
  const address: Json = {
    '@type': 'PostalAddress',
    streetAddress: realValue(a.street),
    addressLocality: realValue(a.locality),
    addressRegion: realValue(a.region),
    postalCode: realValue(a.postalCode),
    addressCountry: site.location.countryCode,
  };
  return address;
};

const addressComplete = () => {
  const a = site.contact.address;
  return [a.street, a.locality, a.postalCode].every((v) => v && !hasPlaceholder(v));
};

export function organization(): Json {
  return clean({
    '@type': 'Organization',
    '@id': ORG_ID,
    name: site.brand,
    legalName: site.legalName,
    alternateName: site.legalName,
    url: site.url,
    logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png'), width: 512, height: 512 },
    description: site.business.shortDescription,
    knowsAbout: [
      'Magnetizers',
      'Magnet charging machines',
      'Capacitor discharge magnetizers',
      'Impulse magnetizers',
      'Rotor magnetizing',
      'Magnetizing fixtures',
      'Magnetizing coils',
      'Multi-pole magnetizing',
    ],
    email: email(),
    telephone: phone(),
    address: postalAddress(),
    areaServed: { '@type': 'Country', name: site.location.country },
    sameAs: sameAs().length ? sameAs() : undefined,
    contactPoint: phone()
      ? [
          {
            '@type': 'ContactPoint',
            telephone: phone(),
            email: email(),
            contactType: 'sales',
            areaServed: site.location.countryCode,
            availableLanguage: ['en', 'hi', 'mr'],
          },
        ]
      : undefined,
  });
}

/**
 * LocalBusiness is only emitted once a real street address, city and PIN are set.
 * Google requires a complete address for local results.
 */
export function localBusiness(): Json | null {
  if (!addressComplete()) return null;
  return clean({
    '@type': 'LocalBusiness',
    '@id': LOCAL_ID,
    name: site.brand,
    legalName: site.legalName,
    url: site.url,
    image: absoluteUrl(site.seo.defaultOgImage),
    telephone: phone(),
    email: email(),
    address: postalAddress(),
    parentOrganization: { '@id': ORG_ID },
    hasMap: site.contact.mapsLink || undefined,
    areaServed: [
      { '@type': 'State', name: site.location.state },
      { '@type': 'Country', name: site.location.country },
    ],
  });
}

export function website(): Json {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: site.url,
    name: site.brand,
    alternateName: [site.legalName, 'skmagnetic.com'],
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-IN',
  };
}

export function breadcrumbs(items: { label: string; href: string }[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
}

export function faqPage(faqs: { q: string; a: string }[]): Json | null {
  // Only questions with finished answers go into structured data
  const done = faqs.filter((f) => !hasPlaceholder(f.q) && !hasPlaceholder(f.a));
  if (!done.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: done.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function product(opts: {
  name: string;
  description: string;
  url: string;
  image: string[];
  category: string;
  sku?: string;
  price?: { amount: number; unit: string };
}): Json {
  return clean({
    '@type': 'Product',
    '@id': `${absoluteUrl(opts.url)}#product`,
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.url),
    image: opts.image.map(absoluteUrl),
    category: opts.category,
    sku: opts.sku,
    brand: { '@type': 'Brand', name: site.brand },
    manufacturer: { '@id': ORG_ID },
    // Offers are only included when a published price exists — never invented.
    offers: opts.price
      ? {
          '@type': 'Offer',
          price: opts.price.amount,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          url: absoluteUrl(opts.url),
          seller: { '@id': ORG_ID },
        }
      : undefined,
  });
}

export function itemList(name: string, items: { name: string; url: string }[]): Json {
  return {
    '@type': 'ItemList',
    name,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: absoluteUrl(it.url),
    })),
  };
}

export function article(opts: {
  title: string;
  description: string;
  url: string;
  image: string;
  published: Date;
  updated?: Date;
  author: string;
}): Json {
  return {
    '@type': 'BlogPosting',
    headline: opts.title,
    description: opts.description,
    url: absoluteUrl(opts.url),
    mainEntityOfPage: absoluteUrl(opts.url),
    image: absoluteUrl(opts.image),
    datePublished: opts.published.toISOString(),
    dateModified: (opts.updated ?? opts.published).toISOString(),
    author: { '@type': 'Organization', name: opts.author, url: site.url },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-IN',
  };
}

export function webPage(opts: { type?: string; name: string; description: string; url: string }): Json {
  return {
    '@type': opts.type ?? 'WebPage',
    name: stripPlaceholders(opts.name),
    description: stripPlaceholders(opts.description),
    url: absoluteUrl(opts.url),
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    inLanguage: 'en-IN',
  };
}

/** Remove undefined / empty values recursively */
function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined) as T;
  if (value && typeof value === 'object') {
    const out: Json = {};
    for (const [k, v] of Object.entries(value)) {
      const c = clean(v);
      if (c === undefined || c === null || c === '') continue;
      if (typeof c === 'object' && !Array.isArray(c) && Object.keys(c).length === 0) continue;
      out[k] = c;
    }
    return out as T;
  }
  return value;
}
