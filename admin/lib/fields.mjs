/**
 * Form definitions for every editable document. Field types:
 * text · textarea · markdown · number · date · bool · select · ref · refs ·
 * strings · list (of sub-fields) · group (object) · images
 */
const ILLUSTRATIONS = ['magnetizer', 'coil', 'fixture', 'rotor', 'speaker', 'housing', 'block', 'disc', 'ring', 'arc', 'horseshoe', 'pot', 'rod', 'grill', 'plate', 'lifter', 'cluster'];
const ICONS = ['motor', 'gear', 'speaker', 'magnet', 'bolt', 'sensor', 'zap', 'factory', 'clipboard', 'rupee', 'headset', 'users', 'badge', 'shield', 'truck', 'layers', 'wrench', 'lift', 'food', 'pharma', 'recycle', 'grain'];
const BLOG_TYPES = ['Buying Guide', 'Comparison', 'Specifications Explained', 'Application Guide', 'Maintenance', 'Glossary', 'Industry Insight'];

const seo = {
  key: 'seo',
  type: 'group',
  label: 'Google search result',
  help: 'What people see on Google. Make each page unique and include the main search phrase.',
  fields: [
    { key: 'title', type: 'text', label: 'SEO title', required: true, min: 10, max: 70, ideal: [45, 60] },
    { key: 'description', type: 'textarea', label: 'Meta description', required: true, min: 50, max: 170, ideal: [140, 160], rows: 3 },
  ],
};
const sample = { key: 'sample', type: 'bool', label: 'Sample content — not yet confirmed (kept out of Google until unticked)' };
const order = { key: 'order', type: 'number', label: 'Sort order', help: 'Lower numbers appear first.' };
const faqs = { key: 'faqs', type: 'list', label: 'FAQs', itemLabel: 'Question', fields: [{ key: 'q', type: 'text', label: 'Question' }, { key: 'a', type: 'textarea', label: 'Answer', rows: 3 }] };
const points = (key, label, help) => ({ key, type: 'list', label, help, itemLabel: 'Item', fields: [{ key: 'title', type: 'text', label: 'Title' }, { key: 'text', type: 'textarea', label: 'Text', rows: 2 }] });
const rows = (key, label, help) => ({ key, type: 'list', label, help, itemLabel: 'Row', compact: true, fields: [{ key: 'label', type: 'text', label: 'Label' }, { key: 'value', type: 'text', label: 'Value' }] });
const body = (label = 'Page content (Markdown)') => ({
  key: 'body',
  type: 'markdown',
  label,
  help: 'Use ## for headings, **bold**, - for bullet lists, [link text](/products/...) for links. Text in {{double braces}} is hidden from visitors until replaced.',
});

export const FIELDS = {
  products: [
    { key: 'title', type: 'text', label: 'Product name (page heading)', required: true },
    { key: 'category', type: 'ref', collection: 'categories', label: 'Category', required: true },
    sample,
    { key: 'featured', type: 'bool', label: 'Show on the home page' },
    order,
    seo,
    { key: 'summary', type: 'textarea', label: 'Short summary (product cards)', required: true, max: 220, rows: 2 },
    { key: 'overview', type: 'textarea', label: 'Overview (first paragraph on the page)', required: true, rows: 4 },
    { key: 'keySpec', type: 'group', label: 'Key specification (shown on cards)', fields: [{ key: 'label', type: 'text', label: 'Label', required: true }, { key: 'value', type: 'text', label: 'Value', required: true }] },
    { key: 'highlights', type: 'strings', label: 'Highlights (2–5 bullet points)', min: 2, max: 5 },
    { key: 'images', type: 'images', label: 'Product photos', help: 'The first photo is the main image and the Google/WhatsApp share image. JPG, PNG or WebP.' },
    { key: 'illustration', type: 'select', options: ILLUSTRATIONS, label: 'Illustration (shown until photos are added)', required: true },
    rows('specs', 'Technical specifications (typical values)'),
    rows('supply', 'Models & supply details', 'Your models, energy ratings, warranty, lead time, installation…'),
    points('variants', 'Types & variants'),
    points('applications', 'Applications'),
    points('features', 'Features'),
    points('benefits', 'Benefits'),
    { key: 'industries', type: 'refs', collection: 'industries', label: 'Industries served' },
    { key: 'relatedApplications', type: 'refs', collection: 'applications', label: 'Application guides' },
    { key: 'related', type: 'refs', collection: 'products', label: 'Related products' },
    faqs,
    { key: 'datasheet', type: 'text', label: 'Datasheet link (optional)', help: 'e.g. /docs/magnetizer-datasheet.pdf' },
    body('Detailed description (Markdown)'),
  ],
  categories: [
    { key: 'title', type: 'text', label: 'Category name (page heading)', required: true },
    { key: 'navLabel', type: 'text', label: 'Short menu label', required: true },
    sample,
    order,
    seo,
    { key: 'summary', type: 'textarea', label: 'Short summary (cards)', required: true, rows: 2 },
    { key: 'intro', type: 'textarea', label: 'Intro paragraph', required: true, rows: 4 },
    { key: 'images', type: 'images', label: 'Category photo' },
    { key: 'illustration', type: 'select', options: ILLUSTRATIONS, label: 'Illustration (shown until a photo is added)', required: true },
    faqs,
    body('Buying guide (Markdown)'),
  ],
  industries: [
    { key: 'title', type: 'text', label: 'Industry name (page heading)', required: true },
    sample,
    order,
    seo,
    { key: 'summary', type: 'textarea', label: 'Short summary (cards)', required: true, rows: 2 },
    { key: 'intro', type: 'textarea', label: 'Intro paragraph', required: true, rows: 3 },
    { key: 'icon', type: 'select', options: ICONS, label: 'Icon', required: true },
    { key: 'products', type: 'refs', collection: 'products', label: 'Relevant products' },
    { key: 'applications', type: 'refs', collection: 'applications', label: 'Related applications' },
    points('needs', 'Key requirements of this industry'),
    faqs,
    body(),
  ],
  applications: [
    { key: 'title', type: 'text', label: 'Application name (page heading)', required: true },
    sample,
    order,
    seo,
    { key: 'summary', type: 'textarea', label: 'Short summary (cards)', required: true, rows: 2 },
    { key: 'intro', type: 'textarea', label: 'Intro paragraph', required: true, rows: 3 },
    { key: 'icon', type: 'select', options: ICONS, label: 'Icon', required: true },
    { key: 'products', type: 'refs', collection: 'products', label: 'Relevant products' },
    { key: 'industries', type: 'refs', collection: 'industries', label: 'Industries' },
    faqs,
    body(),
  ],
  blog: [
    { key: 'title', type: 'text', label: 'Article title (page heading)', required: true },
    sample,
    seo,
    { key: 'excerpt', type: 'textarea', label: 'Excerpt (cards and intro)', required: true, rows: 3 },
    { key: 'type', type: 'select', options: BLOG_TYPES, label: 'Article type', required: true },
    { key: 'published', type: 'date', label: 'Published date', required: true },
    { key: 'updated', type: 'date', label: 'Updated date (optional)' },
    { key: 'illustration', type: 'select', options: ILLUSTRATIONS, label: 'Illustration', required: true },
    { key: 'products', type: 'refs', collection: 'products', label: 'Products mentioned' },
    { key: 'categories', type: 'refs', collection: 'categories', label: 'Categories' },
    faqs,
    body('Article (Markdown)'),
  ],
};

export const SETTINGS_FIELDS = [
  {
    key: '_launch',
    type: 'section',
    label: 'Launch',
    fields: [
      { key: 'isLive', type: 'bool', label: 'Website is LIVE — visible to Google (turn on only when contact details and content are confirmed)' },
      { key: 'showContentNotices', type: 'bool', label: 'Enable review mode (open any page with ?review=1 to highlight unfinished content)' },
    ],
  },
  { key: 'tagline', type: 'text', label: 'Tagline under the logo', required: true },
  {
    key: 'contact',
    type: 'group',
    label: 'Contact details',
    fields: [
      { key: 'phoneDisplay', type: 'text', label: 'Phone — as shown', help: 'e.g. +91 98765 43210' },
      { key: 'phone', type: 'text', label: 'Phone — for the Call button', help: 'International format, no spaces, e.g. +919876543210' },
      { key: 'whatsappDisplay', type: 'text', label: 'WhatsApp — as shown' },
      { key: 'whatsapp', type: 'text', label: 'WhatsApp number — digits only', help: 'Country code first, e.g. 919876543210' },
      { key: 'email', type: 'text', label: 'Email' },
      { key: 'emailConfirmed', type: 'bool', label: 'This mailbox exists and is checked daily' },
      { key: 'street', type: 'text', label: 'Street address' },
      { key: 'city', type: 'text', label: 'City' },
      { key: 'state', type: 'text', label: 'State' },
      { key: 'pin', type: 'text', label: 'PIN code' },
      { key: 'mapsEmbedUrl', type: 'text', label: 'Google Maps embed URL', help: 'Google Maps → Share → Embed a map → copy only the src="…" link' },
      { key: 'mapsLink', type: 'text', label: 'Google Maps link (directions)' },
      { key: 'hours', type: 'list', label: 'Business hours', itemLabel: 'Row', compact: true, fields: [{ key: 'days', type: 'text', label: 'Days' }, { key: 'time', type: 'text', label: 'Time' }] },
      { key: 'responseTime', type: 'text', label: 'Typical response time', help: 'e.g. within 1 business day' },
    ],
  },
  {
    key: 'business',
    type: 'group',
    label: 'Company details',
    fields: [
      { key: 'gstin', type: 'text', label: 'GSTIN' },
      { key: 'established', type: 'text', label: 'Year established' },
      { key: 'shortDescription', type: 'textarea', label: 'Short description (footer & Google)', rows: 3 },
    ],
  },
  {
    key: 'social',
    type: 'group',
    label: 'Social media links (leave empty to hide)',
    fields: ['linkedin', 'facebook', 'instagram', 'youtube', 'x'].map((k) => ({ key: k, type: 'text', label: k === 'x' ? 'X (Twitter)' : k[0].toUpperCase() + k.slice(1) })),
  },
  {
    key: 'analytics',
    type: 'group',
    label: 'Analytics & conversion tracking',
    fields: [
      { key: 'gtmId', type: 'text', label: 'Google Tag Manager ID', help: 'e.g. GTM-ABC1234 (recommended)' },
      { key: 'ga4Id', type: 'text', label: 'Google Analytics 4 ID', help: 'e.g. G-XXXXXXXXXX — used only if no Tag Manager ID' },
    ],
  },
  {
    key: 'seo',
    type: 'group',
    label: 'Search engine verification',
    fields: [
      { key: 'googleSiteVerification', type: 'text', label: 'Google Search Console code', help: 'Only the content="…" value of the HTML tag' },
      { key: 'bingSiteVerification', type: 'text', label: 'Bing Webmaster code' },
    ],
  },
  {
    key: 'forms',
    type: 'group',
    label: 'Enquiry form',
    fields: [{ key: 'endpoint', type: 'text', label: 'Form endpoint', help: 'Keep /api/enquiry to receive enquiries in this admin panel.' }],
  },
];

export const TRUST_FIELDS = [
  {
    key: 'strengths',
    type: 'list',
    label: '“Why choose us” points',
    itemLabel: 'Point',
    fields: [
      { key: 'icon', type: 'select', options: ICONS, label: 'Icon' },
      { key: 'title', type: 'text', label: 'Title' },
      { key: 'text', type: 'textarea', label: 'Text', rows: 2 },
    ],
  },
  { key: 'processSteps', type: 'list', label: '“How we work” steps', itemLabel: 'Step', fields: [{ key: 'title', type: 'text', label: 'Title' }, { key: 'text', type: 'textarea', label: 'Text', rows: 2 }] },
  {
    key: 'testimonials',
    type: 'list',
    label: 'Customer testimonials (genuine only)',
    itemLabel: 'Testimonial',
    fields: [
      { key: 'quote', type: 'textarea', label: 'Quote', rows: 3 },
      { key: 'name', type: 'text', label: 'Name' },
      { key: 'role', type: 'text', label: 'Role' },
      { key: 'company', type: 'text', label: 'Company' },
    ],
  },
  { key: 'certifications', type: 'list', label: 'Certifications (real certificates only)', itemLabel: 'Certificate', compact: true, fields: [{ key: 'name', type: 'text', label: 'Name' }, { key: 'issuer', type: 'text', label: 'Issued by' }, { key: 'file', type: 'text', label: 'PDF link (optional)' }] },
  { key: 'clients', type: 'list', label: 'Client logos (with permission)', itemLabel: 'Client', compact: true, fields: [{ key: 'name', type: 'text', label: 'Client name' }, { key: 'logo', type: 'text', label: 'Logo URL' }] },
];

/**
 * Clean a submitted payload against field definitions: coerce types, trim, drop empty
 * optional values. Returns { data, errors }.
 */
export function cleanPayload(defs, input, prefix = '', opts = {}) {
  const data = {};
  const errors = [];
  for (const f of defs) {
    if (f.type === 'section') {
      const r = cleanPayload(f.fields, input, prefix, opts);
      Object.assign(data, r.data);
      errors.push(...r.errors);
      continue;
    }
    if (f.type === 'markdown') continue;
    const v = input?.[f.key];
    const label = prefix + f.label;
    let out;
    switch (f.type) {
      case 'bool':
        out = !!v;
        break;
      case 'number':
        out = v === '' || v === null || v === undefined ? undefined : Number(v);
        if (out !== undefined && !Number.isFinite(out)) {
          errors.push(`${label}: must be a number`);
          out = undefined;
        }
        break;
      case 'group': {
        const r = cleanPayload(f.fields, v || {}, `${f.label} → `, opts);
        errors.push(...r.errors);
        out = Object.keys(r.data).length ? r.data : undefined;
        break;
      }
      case 'list':
        out = (Array.isArray(v) ? v : [])
          .map((item) => cleanPayload(f.fields, item || {}, `${f.label} → `, opts))
          .filter((r) => Object.values(r.data).some((x) => x !== '' && x !== undefined))
          .map((r) => r.data);
        break;
      case 'strings':
      case 'refs':
        out = (Array.isArray(v) ? v : []).map((s) => String(s).trim()).filter(Boolean);
        break;
      case 'images':
        out = (Array.isArray(v) ? v : [])
          .filter((i) => i && i.src)
          .map((i) => ({ src: String(i.src), alt: String(i.alt || '').trim() }));
        for (const i of out) if (i.alt.length < 5) errors.push(`${label}: every photo needs a description (alt text) of at least 5 characters`);
        break;
      default:
        out = typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim() : v === undefined || v === null ? '' : String(v);
    }
    const empty = out === undefined || out === '' || (Array.isArray(out) && !out.length);
    if (f.required && empty) errors.push(`${label} is required`);
    if (typeof out === 'string' && f.max && out.length > f.max) errors.push(`${label} is ${out.length} characters (maximum ${f.max})`);
    if (typeof out === 'string' && f.min && out && out.length < f.min) errors.push(`${label} is too short (minimum ${f.min} characters)`);
    if (Array.isArray(out) && f.type === 'strings' && f.min && out.length < f.min) errors.push(`${label}: add at least ${f.min}`);
    if (Array.isArray(out) && f.max && out.length > f.max) errors.push(`${label}: at most ${f.max}`);
    if (!empty || f.type === 'bool' || (opts.keepEmpty && out !== undefined)) data[f.key] = out;
    else if (prefix === '' && ['text', 'textarea', 'date'].includes(f.type)) data[f.key] = undefined;
  }
  return { data, errors };
}
