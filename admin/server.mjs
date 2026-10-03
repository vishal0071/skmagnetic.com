/**
 * SK Enterprises — website admin service.
 *
 *   /admin/*        password-protected admin panel (settings, content, enquiries, SEO, publishing)
 *   /api/enquiry    public endpoint for the website enquiry form
 *   /api/health     health check
 *
 * Run locally:  npm run admin   (see README → Admin panel)
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';

import { BUILD_ON_START, CONTENT_DIR, DATA_DIR, MEDIA_DIR, PORT, PROJECT_DIR, SERVE_SITE, SITE_ROOT, assertConfig } from './lib/config.mjs';
import {
  checkCredentials,
  clearLoginFailures,
  clientIp,
  endSession,
  loginBlocked,
  recordLoginFailure,
  requireAuth,
  sameOrigin,
  startSession,
} from './lib/auth.mjs';
import { COLLECTIONS, SLUG_RE, contentStatus, deleteItem, findReferences, isCollection, itemExists, listItems, readItem, readJson, slugify, writeItem, writeJson } from './lib/content.mjs';
import { FIELDS, SETTINGS_FIELDS, TRUST_FIELDS, cleanPayload } from './lib/fields.mjs';
import { attachmentPath, createEnquiry, deleteEnquiry, getEnquiry, listEnquiries, setStatus, toCsv } from './lib/enquiries.mjs';
import { currentRelease, lastPublish, listReleases, publish, publishState, rollback, seoReport } from './lib/publish.mjs';
import * as V from './lib/views.mjs';

assertConfig();
await mkdir(DATA_DIR, { recursive: true });

const app = new Hono();

// ---------- Security headers ----------
app.use('*', async (c, next) => {
  await next();
  const path = new URL(c.req.url).pathname;
  if (path.startsWith('/admin') || path.startsWith('/api/')) {
    c.header('X-Frame-Options', 'DENY');
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'same-origin');
    c.header('Cache-Control', 'no-store');
    c.header(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'",
    );
  }
});

// ---------- Public API ----------
app.get('/api/health', async (c) => c.json({ ok: true, release: await currentRelease() }));

const enquiryHits = new Map();
app.post(
  '/api/enquiry',
  bodyLimit({ maxSize: 6 * 1024 * 1024, onError: (c) => c.json({ ok: false, error: 'The upload is too large (max 5 MB).' }, 413) }),
  async (c) => {
    const ip = clientIp(c);
    const now = Date.now();
    const hits = (enquiryHits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
    if (hits.length >= 6) return c.json({ ok: false, error: 'Too many enquiries — please call or WhatsApp us.' }, 429);
    enquiryHits.set(ip, [...hits, now]);

    let form;
    try {
      form = await c.req.parseBody();
    } catch {
      return c.json({ ok: false, error: 'Invalid form data.' }, 400);
    }
    if (String(form.website || '')) return c.json({ ok: true }); // honeypot: silently accept spam
    const name = String(form.name || '').trim();
    const mobile = String(form.mobile || '').trim();
    if (name.length < 2 || mobile.replace(/\D/g, '').length < 10) return c.json({ ok: false, error: 'Please enter your name and a valid mobile number.' }, 422);
    const file = form.attachment instanceof File && form.attachment.size > 0 ? form.attachment : null;
    try {
      await createEnquiry(form, file, { ip, userAgent: c.req.header('user-agent') });
    } catch (err) {
      return c.json({ ok: false, error: err.message }, 422);
    }
    return c.json({ ok: true });
  },
);

// ---------- Admin ----------
app.use('/admin/*', requireAuth());
app.use('/admin', requireAuth());
app.use('/admin/*', sameOrigin());
app.use('/admin/*', async (c, next) => {
  if (c.req.path === '/admin/upload') return next();
  return bodyLimit({ maxSize: 3 * 1024 * 1024 })(c, next);
});

app.use(
  '/admin/assets/*',
  serveStatic({ root: resolve(PROJECT_DIR, 'admin/public'), rewriteRequestPath: (p) => p.replace(/^\/admin\/assets/, '') }),
);

/** Common page data (new-enquiry badge, publish state) */
async function page(c, opts) {
  const enquiries = await listEnquiries();
  const html = V.layout({ ...opts, newEnquiries: enquiries.filter((e) => e.status === 'new').length, publish: publishState() });
  return c.html(String(html), opts.status || 200);
}
const savedFlash = (c, text = 'Saved. Press “Publish changes” to update the live website.') => (c.req.query('saved') ? { type: 'ok', text } : null);
const parsePayload = async (c) => {
  const form = await c.req.parseBody();
  try {
    return JSON.parse(String(form.payload || '{}'));
  } catch {
    return {};
  }
};

// Login / logout
app.get('/admin/login', (c) => c.html(String(V.loginPage({ next: c.req.query('next') }))));
app.post('/admin/login', async (c) => {
  const ip = clientIp(c);
  const form = await c.req.parseBody();
  const next = String(form.next || '/admin');
  const safeNext = next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';
  if (loginBlocked(ip)) return c.html(String(V.loginPage({ error: 'Too many attempts. Try again in 15 minutes.', next: safeNext })), 429);
  if (!checkCredentials(String(form.user || ''), String(form.password || ''))) {
    recordLoginFailure(ip);
    await new Promise((r) => setTimeout(r, 600));
    return c.html(String(V.loginPage({ error: 'Incorrect username or password.', next: safeNext })), 401);
  }
  clearLoginFailures(ip);
  startSession(c);
  return c.redirect(safeNext);
});
app.post('/admin/logout', (c) => {
  endSession(c);
  return c.redirect('/admin/login');
});

// Dashboard
app.get('/admin', async (c) => {
  const [enquiries, status, settings, products, publishInfo, report] = await Promise.all([
    listEnquiries(),
    contentStatus(),
    readJson('settings.json'),
    listItems('products'),
    lastPublish(),
    seoReport(),
  ]);
  return page(c, {
    title: 'Dashboard',
    active: 'dashboard',
    body: V.dashboard({
      counts: { enquiries: enquiries.length, newEnquiries: enquiries.filter((e) => e.status === 'new').length, products: products.length },
      status,
      settings,
      enquiries: enquiries.slice(0, 6),
      publish: publishInfo,
      report,
    }),
  });
});

// Content collections
async function refsCtx() {
  const refs = {};
  for (const col of ['categories', 'industries', 'applications', 'products']) refs[col] = (await listItems(col)).map((i) => ({ slug: i.slug, title: i.data.title }));
  return { refs, mediaUrl: (src) => `/admin/media/${String(src).replace(/^(\.\.\/)+media\//, '')}` };
}

const ORDER = (col) => FIELDS[col].map((f) => f.key);
function orderData(col, data) {
  const out = {};
  for (const k of ORDER(col)) if (k !== 'body' && data[k] !== undefined) out[k] = data[k];
  for (const [k, v] of Object.entries(data)) if (!(k in out) && v !== undefined) out[k] = v;
  return out;
}

app.get('/admin/c/:col', async (c) => {
  const col = c.req.param('col');
  if (!isCollection(col)) return c.notFound();
  return page(c, { title: COLLECTIONS[col].label, active: col, body: V.listPage({ col, items: await listItems(col) }), flash: c.req.query('deleted') ? { text: 'Deleted.' } : null });
});

app.get('/admin/c/:col/new', async (c) => {
  const col = c.req.param('col');
  if (!isCollection(col)) return c.notFound();
  const defaults = { sample: true, order: 100, ...(col === 'blog' ? { published: new Date().toISOString().slice(0, 10) } : {}) };
  return page(c, {
    title: `New ${COLLECTIONS[col].singular.toLowerCase()}`,
    active: col,
    body: V.editPage({ col, isNew: true, data: defaults, defs: FIELDS[col], ctx: await refsCtx() }),
  });
});

app.get('/admin/c/:col/:slug', async (c) => {
  const { col, slug } = c.req.param();
  if (!isCollection(col) || !SLUG_RE.test(slug) || !(await itemExists(col, slug))) return c.notFound();
  const { data, body } = await readItem(col, slug);
  return page(c, {
    title: data.title || slug,
    active: col,
    flash: savedFlash(c),
    body: V.editPage({ col, slug, data: { ...data, body }, defs: FIELDS[col], ctx: await refsCtx(), refsTo: await findReferences(col, slug) }),
  });
});

async function saveItem(c, col, slugParam) {
  const isNew = !slugParam;
  const payload = await parsePayload(c);
  const { data, errors } = cleanPayload(FIELDS[col], payload);
  let slug = slugParam;
  if (isNew) {
    slug = String(payload._slug || '').trim() || slugify(payload.title || '');
    if (!SLUG_RE.test(slug)) errors.push('Web address (URL slug) may only contain lowercase letters, numbers and hyphens');
    else if (await itemExists(col, slug)) errors.push(`A ${COLLECTIONS[col].singular.toLowerCase()} with the address “${slug}” already exists`);
  }
  if (errors.length) {
    return page(c, {
      title: isNew ? `New ${COLLECTIONS[col].singular.toLowerCase()}` : payload.title || slug,
      active: col,
      status: 422,
      body: V.editPage({ col, slug: isNew ? payload._slug : slug, isNew, data: payload, defs: FIELDS[col], ctx: await refsCtx(), errors }),
    });
  }
  const existing = isNew ? {} : (await readItem(col, slug)).data;
  await writeItem(col, slug, orderData(col, { ...existing, ...data }), String(payload.body || ''));
  return c.redirect(`/admin/c/${col}/${slug}?saved=1`);
}
app.post('/admin/c/:col/new', async (c) => (isCollection(c.req.param('col')) ? saveItem(c, c.req.param('col'), null) : c.notFound()));
app.post('/admin/c/:col/:slug', async (c) => {
  const { col, slug } = c.req.param();
  if (!isCollection(col) || !SLUG_RE.test(slug) || !(await itemExists(col, slug))) return c.notFound();
  return saveItem(c, col, slug);
});
app.post('/admin/c/:col/:slug/delete', async (c) => {
  const { col, slug } = c.req.param();
  if (!isCollection(col) || !SLUG_RE.test(slug)) return c.notFound();
  if ((await findReferences(col, slug)).length) return c.redirect(`/admin/c/${col}/${slug}`);
  await deleteItem(col, slug);
  return c.redirect(`/admin/c/${col}?deleted=1`);
});

// Photo upload (product / category images)
const IMAGE_TYPES = {
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  webp: (b) => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP',
};
app.post(
  '/admin/upload',
  bodyLimit({ maxSize: 12 * 1024 * 1024, onError: (c) => c.json({ error: 'Photo is larger than 10 MB.' }, 413) }),
  async (c) => {
    const form = await c.req.parseBody();
    const file = form.file;
    const col = String(form.col || '');
    const base = slugify(String(form.slug || 'photo')) || 'photo';
    if (!(file instanceof File) || !isCollection(col)) return c.json({ error: 'No photo received.' }, 400);
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = Object.keys(IMAGE_TYPES).find((k) => IMAGE_TYPES[k](buf));
    if (!ext) return c.json({ error: 'Only JPG, PNG or WebP photos are accepted.' }, 415);
    const name = `${base}-${Date.now().toString(36)}.${ext}`;
    const dir = join(MEDIA_DIR, col);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name), buf);
    return c.json({ src: `../media/${col}/${name}`, url: `/admin/media/${col}/${name}` });
  },
);
app.get('/admin/media/*', async (c) => {
  const rel = decodeURIComponent(c.req.path.replace(/^\/admin\/media\//, ''));
  const full = resolve(MEDIA_DIR, rel);
  if (!full.startsWith(MEDIA_DIR + sep)) return c.notFound();
  const ext = extname(full).slice(1).toLowerCase();
  const type = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext];
  if (!type) return c.notFound();
  try {
    return c.body(await readFile(full), 200, { 'Content-Type': type });
  } catch {
    return c.notFound();
  }
});

// Settings & trust content
function settingsErrors(s) {
  const errors = [];
  const c = s.contact || {};
  if (c.phone && !/x/i.test(c.phone) && !/^\+\d{10,15}$/.test(c.phone)) errors.push('Phone for the Call button must look like +919876543210');
  if (c.whatsapp && !/x/i.test(c.whatsapp) && !/^\d{11,15}$/.test(c.whatsapp)) errors.push('WhatsApp number must be digits only with country code, e.g. 919876543210');
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) errors.push('Email address looks invalid');
  if (c.mapsEmbedUrl && !/^https:\/\/www\.google\.com\/maps\/embed/.test(c.mapsEmbedUrl)) errors.push('Google Maps embed URL must start with https://www.google.com/maps/embed');
  for (const [k, v] of Object.entries(s.social || {})) if (v && !/^https:\/\//.test(v)) errors.push(`${k} link must start with https://`);
  if (s.analytics?.gtmId && !/^GTM-[A-Z0-9]+$/.test(s.analytics.gtmId)) errors.push('Tag Manager ID must look like GTM-ABC1234');
  if (s.analytics?.ga4Id && !/^G-[A-Z0-9]+$/.test(s.analytics.ga4Id)) errors.push('GA4 ID must look like G-XXXXXXXXXX');
  return errors;
}

app.get('/admin/settings', async (c) =>
  page(c, {
    title: 'Company & contact',
    active: 'settings',
    flash: savedFlash(c),
    body: V.docPage({
      action: '/admin/settings',
      defs: SETTINGS_FIELDS,
      data: await readJson('settings.json'),
      intro: 'Contact details, address, analytics and the launch switch. Text in {{double braces}} is a placeholder that visitors do not see.',
    }),
  }),
);
app.post('/admin/settings', async (c) => {
  const payload = await parsePayload(c);
  const { data, errors } = cleanPayload(SETTINGS_FIELDS, payload, '', { keepEmpty: true });
  const merged = { ...(await readJson('settings.json')), ...data };
  errors.push(...settingsErrors(merged));
  if (errors.length)
    return page(c, { title: 'Company & contact', active: 'settings', status: 422, body: V.docPage({ action: '/admin/settings', defs: SETTINGS_FIELDS, data: payload, errors }) });
  await writeJson('settings.json', merged);
  return c.redirect('/admin/settings?saved=1');
});

app.get('/admin/trust', async (c) =>
  page(c, {
    title: 'Trust & process',
    active: 'trust',
    flash: savedFlash(c),
    body: V.docPage({
      action: '/admin/trust',
      defs: TRUST_FIELDS,
      data: await readJson('trust.json'),
      intro: 'Only add genuine testimonials, real certificates and client logos you have permission to use. Empty sections are hidden on the website.',
    }),
  }),
);
app.post('/admin/trust', async (c) => {
  const payload = await parsePayload(c);
  const { data, errors } = cleanPayload(TRUST_FIELDS, payload, '', { keepEmpty: true });
  if (errors.length) return page(c, { title: 'Trust & process', active: 'trust', status: 422, body: V.docPage({ action: '/admin/trust', defs: TRUST_FIELDS, data: payload, errors }) });
  await writeJson('trust.json', { ...(await readJson('trust.json')), ...data });
  return c.redirect('/admin/trust?saved=1');
});

// Enquiries
app.get('/admin/enquiries', async (c) =>
  page(c, { title: 'Enquiries', active: 'enquiries', body: V.enquiriesPage({ items: await listEnquiries(), filter: c.req.query('status') || '' }), flash: c.req.query('deleted') ? { text: 'Enquiry deleted.' } : null }),
);
app.get('/admin/enquiries.csv', async (c) =>
  c.body(toCsv(await listEnquiries()), 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="sk-enterprises-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
  }),
);
app.get('/admin/enquiries/:id', async (c) => {
  let e;
  try {
    e = await getEnquiry(c.req.param('id'));
  } catch {
    return c.notFound();
  }
  if (e.status === 'new') e = await setStatus(e.id, 'in-progress');
  return page(c, { title: `Enquiry from ${e.name}`, active: 'enquiries', body: V.enquiryPage({ e }), flash: c.req.query('saved') ? { text: 'Status updated.' } : null });
});
app.get('/admin/enquiries/:id/file', async (c) => {
  try {
    const e = await getEnquiry(c.req.param('id'));
    const path = attachmentPath(e);
    if (!path) return c.notFound();
    return c.body(await readFile(path), 200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${e.attachment.name.replace(/[^\w.\- ]/g, '_')}"`,
    });
  } catch {
    return c.notFound();
  }
});
app.post('/admin/enquiries/:id/status', async (c) => {
  const form = await c.req.parseBody();
  try {
    await setStatus(c.req.param('id'), String(form.status || ''));
  } catch {
    return c.notFound();
  }
  return c.redirect(`/admin/enquiries/${c.req.param('id')}?saved=1`);
});
app.post('/admin/enquiries/:id/delete', async (c) => {
  try {
    await deleteEnquiry(c.req.param('id'));
  } catch {
    return c.notFound();
  }
  return c.redirect('/admin/enquiries?deleted=1');
});

// SEO report
app.get('/admin/seo', async (c) =>
  page(c, { title: 'SEO report', active: 'seo', body: V.seoPage({ report: await seoReport(), status: await contentStatus() }) }),
);

// Publishing
app.get('/admin/publish', async (c) =>
  page(c, { title: 'Publish & history', active: 'publish', body: V.publishPage({ state: (await lastPublish()) || publishState(), releases: await listReleases() }) }),
);
app.post('/admin/publish', (c) => {
  publish('manual');
  if (c.req.header('accept')?.includes('application/json')) return c.json(publishState());
  return c.redirect('/admin/publish');
});
app.get('/admin/publish/status', (c) => c.json(publishState()));
app.post('/admin/releases/:id/rollback', async (c) => {
  try {
    await rollback(c.req.param('id'));
  } catch {
    return c.notFound();
  }
  return c.redirect('/admin/publish');
});

// ---------- Local preview of the published site ----------
if (SERVE_SITE) {
  const current = join(SITE_ROOT, 'current');
  app.use('/*', serveStatic({ root: current, rewriteRequestPath: (p) => (p.endsWith('/') ? `${p}index.html` : p) }));
  app.notFound(async (c) => {
    if (!c.req.path.endsWith('/') && !extname(c.req.path)) return c.redirect(`${c.req.path}/`);
    const html = await readFile(join(current, '404.html'), 'utf8').catch(() => 'Not found');
    return c.html(html, 404);
  });
}

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`SK Enterprises admin running on http://localhost:${info.port}/admin`);
  console.log(`Content: ${CONTENT_DIR} · Site: ${SITE_ROOT} · Data: ${DATA_DIR}`);
  if (BUILD_ON_START) publish('startup');
});
