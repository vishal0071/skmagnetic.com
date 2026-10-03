/** Admin page templates. Every attribute value is quoted and every interpolation escaped. */
import { html, raw } from './html.mjs';
import { renderFields } from './forms.mjs';
import { COLLECTIONS } from './content.mjs';

const MARK = raw(`<svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#0b141d"/><path d="M14 15.5Q32 4 50 15.5M14 48.5Q32 60 50 48.5" fill="none" stroke="#8fa3b8" stroke-width="2.2" stroke-linecap="round" opacity=".6"/><text x="11" y="42" font-family="Arial Black,Arial" font-weight="900" font-size="25" fill="#ff5a4e">S</text><text x="37" y="42" font-family="Arial Black,Arial" font-weight="900" font-size="25" fill="#d6e0ea">K</text><path d="M34 17L27 33h4.4L29 46.5l7.4-17h-4.3L35 17Z" fill="#ffb21f"/></svg>`);

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '—';

const NAV = [
  { href: '/admin', label: 'Dashboard', key: 'dashboard' },
  { href: '/admin/enquiries', label: 'Enquiries', key: 'enquiries' },
  { sep: 'Website content' },
  ...Object.entries(COLLECTIONS).map(([key, c]) => ({ href: `/admin/c/${key}`, label: c.label, key })),
  { sep: 'Settings' },
  { href: '/admin/settings', label: 'Company & contact', key: 'settings' },
  { href: '/admin/trust', label: 'Trust & process', key: 'trust' },
  { href: '/admin/seo', label: 'SEO report', key: 'seo' },
  { href: '/admin/publish', label: 'Publish & history', key: 'publish' },
];

export function layout({ title, active, body, flash, newEnquiries = 0, publish, isLive = false }) {
  const building = publish?.running;
  return html`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>${title} · SK Enterprises admin</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/admin/assets/admin.css" />
  </head>
  <body>
    <div class="shell">
      <aside class="sidebar" id="sidebar">
        <a class="brand" href="/admin">${MARK}<span><strong>SK ENTERPRISES</strong><small>Website admin</small></span></a>
        <nav>
          ${NAV.map((n) =>
            n.sep
              ? html`<p class="nav-sep">${n.sep}</p>`
              : html`<a class="${n.key === active ? 'active' : ''}" href="${n.href}"
                  >${n.label}${n.key === 'enquiries' && newEnquiries ? html`<span class="pill">${newEnquiries}</span>` : ''}</a
                >`,
          )}
        </nav>
        <form method="post" action="/admin/logout"><button class="link-btn" type="submit">Sign out</button></form>
      </aside>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn menu-btn" type="button" data-menu aria-label="Menu">☰</button>
          <h1>${title}</h1>
          <a class="${`seo-status ${isLive ? 'seo-status--live' : ''}`}" href="/admin/settings" title="Change in Company & contact → Launch">
            ${isLive ? '● Live on Google' : '● Hidden from Google'}
          </a>
          <div class="topbar__actions">
            <a class="btn btn--ghost" href="/" target="_blank" rel="noopener">View website ↗</a>
            <form method="post" action="/admin/publish" data-publish-form>
              <button class="btn btn--primary" type="submit" ${raw(building ? 'disabled' : '')} data-publish-btn>
                ${building ? 'Publishing…' : 'Publish changes'}
              </button>
            </form>
          </div>
        </header>
        <div class="publish-bar ${building ? 'is-active' : ''}" data-publish-bar>
          <span data-publish-text>${building ? 'Publishing — the website is being rebuilt…' : ''}</span>
        </div>
        <main class="content">
          ${flash ? html`<div class="flash flash--${flash.type || 'ok'}">${flash.text}</div>` : ''} ${body}
        </main>
      </div>
    </div>
    <script src="/admin/assets/admin.js" defer></script>
  </body>
</html>`;
}

export function loginPage({ error, next }) {
  return html`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Sign in · SK Enterprises admin</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/admin/assets/admin.css" />
  </head>
  <body class="login-body">
    <form class="login" method="post" action="/admin/login">
      <div class="brand brand--center">${MARK}<span><strong>SK ENTERPRISES</strong><small>Website admin</small></span></div>
      ${error ? html`<div class="flash flash--error">${error}</div>` : ''}
      <input type="hidden" name="next" value="${next || '/admin'}" />
      <label class="label" for="user">Username</label>
      <input class="in" id="user" name="user" autocomplete="username" required autofocus />
      <label class="label" for="password">Password</label>
      <input class="in" id="password" name="password" type="password" autocomplete="current-password" required />
      <button class="btn btn--primary btn--block" type="submit">Sign in</button>
    </form>
  </body>
</html>`;
}

const statusBadge = (s) => html`<span class="badge badge--${s}">${s.replace('-', ' ')}</span>`;

export function dashboard({ counts, status, settings, enquiries, publish, report }) {
  const checks = [
    { ok: !/x/i.test(settings.contact.phone), text: 'Phone number entered', href: '/admin/settings' },
    { ok: !/x/i.test(settings.contact.whatsapp), text: 'WhatsApp number entered', href: '/admin/settings' },
    { ok: settings.contact.emailConfirmed, text: 'Email address confirmed', href: '/admin/settings' },
    { ok: !/\{\{/.test(settings.contact.street + settings.contact.city + settings.contact.pin), text: 'Full address entered', href: '/admin/settings' },
    { ok: !/\{\{/.test(settings.business.gstin), text: 'GSTIN entered', href: '/admin/settings' },
    { ok: !!(settings.analytics.gtmId || settings.analytics.ga4Id), text: 'Google Analytics / Tag Manager connected', href: '/admin/settings' },
    { ok: !!settings.seo.googleSiteVerification, text: 'Google Search Console verified', href: '/admin/settings' },
    { ok: status.samples === 0, text: `All pages confirmed (${status.samples} still marked “sample”)`, href: '/admin/c/products' },
    { ok: status.placeholders === 0, text: `No placeholders left (${status.placeholders} remaining)`, href: '/admin/seo' },
    { ok: settings.isLive, text: 'Website set to LIVE (visible to Google)', href: '/admin/settings' },
  ];
  const done = checks.filter((c) => c.ok).length;
  return html`
    <div class="stats">
      <a class="stat" href="/admin/enquiries"><strong>${counts.newEnquiries}</strong><span>New enquiries</span></a>
      <a class="stat" href="/admin/enquiries"><strong>${counts.enquiries}</strong><span>Total enquiries</span></a>
      <a class="stat" href="/admin/c/products"><strong>${counts.products}</strong><span>Products</span></a>
      <a class="stat" href="/admin/seo"><strong>${report ? report.indexableCount : '—'}</strong><span>Pages visible to Google</span></a>
    </div>
    <div class="cols">
      <section class="panel">
        <h2>Launch checklist <span class="muted">${done}/${checks.length}</span></h2>
        <div class="progress"><span style="${`width:${Math.round((done / checks.length) * 100)}%`}"></span></div>
        <ul class="checklist">
          ${checks.map((c) => html`<li class="${c.ok ? 'ok' : ''}"><a href="${c.href}">${c.ok ? '✓' : '○'} ${c.text}</a></li>`)}
        </ul>
      </section>
      <section class="panel">
        <h2>Latest enquiries</h2>
        ${enquiries.length
          ? html`<ul class="mini-list">
              ${enquiries.map(
                (e) => html`<li>
                  <a href="${`/admin/enquiries/${e.id}`}"><strong>${e.name}</strong> ${e.company ? html`· ${e.company}` : ''}</a>
                  <span class="muted">${e.product || 'General enquiry'} · ${fmtDate(e.createdAt)}</span> ${statusBadge(e.status)}
                </li>`,
              )}
            </ul>`
          : html`<p class="muted">No enquiries yet. They appear here as soon as someone submits the website form.</p>`}
        <h2 class="mt">Last publish</h2>
        ${publish
          ? html`<p>${statusBadge(publish.status)} ${fmtDate(publish.finishedAt || publish.startedAt)}</p>
              ${publish.error ? html`<p class="error-text">${publish.error}</p>` : ''}`
          : html`<p class="muted">Not published yet.</p>`}
        <p class="muted small">After editing content or settings, press <strong>Publish changes</strong> (top right) to update the live website.</p>
      </section>
    </div>`;
}

export function listPage({ col, items }) {
  const c = COLLECTIONS[col];
  return html`
    <div class="toolbar">
      <p class="muted">${items.length} ${items.length === 1 ? c.singular.toLowerCase() : c.label.toLowerCase()}</p>
      <a class="btn btn--primary" href="${`/admin/c/${col}/new`}">+ New ${c.singular.toLowerCase()}</a>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>SEO title</th>
          <th>Status</th>
          <th>Updated</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${items.map(
          (i) => html`<tr>
            <td><a href="${`/admin/c/${col}/${i.slug}`}"><strong>${i.data.title}</strong></a><br /><span class="muted small">${c.url(i.data, i.slug)}</span></td>
            <td class="small">${i.data.seo?.title || ''} <span class="${`len ${(i.data.seo?.title || '').length > 60 ? 'warn' : ''}`}">${(i.data.seo?.title || '').length}</span></td>
            <td>${i.data.sample ? html`<span class="badge badge--sample">sample</span>` : html`<span class="badge badge--ok">confirmed</span>`}</td>
            <td class="small muted">${fmtDate(i.modified)}</td>
            <td class="right"><a class="btn btn--ghost btn--sm" href="${`/admin/c/${col}/${i.slug}`}">Edit</a></td>
          </tr>`,
        )}
      </tbody>
    </table>`;
}

export function editPage({ col, slug, isNew, data, defs, ctx, errors = [], refsTo = [] }) {
  const c = COLLECTIONS[col];
  const action = isNew ? `/admin/c/${col}/new` : `/admin/c/${col}/${slug}`;
  return html`
    ${errors.length ? html`<div class="flash flash--error"><strong>Please fix:</strong><ul>${errors.map((e) => html`<li>${e}</li>`)}</ul></div>` : ''}
    <form class="editor" method="post" action="${action}" data-editor>
      <input type="hidden" name="payload" />
      <div class="editor__main" data-scope data-root>
        ${isNew
          ? html`<div class="field" data-key="_slug" data-type="text">
              <label class="label" for="slug">Web address (URL slug) <span class="req">*</span></label>
              <input id="slug" class="in" data-slug value="${slug || ''}" placeholder="auto-filled from the title" pattern="[a-z0-9]+(-[a-z0-9]+)*" />
              <p class="help">Lowercase words separated by hyphens. Cannot be changed later without breaking links.</p>
            </div>`
          : html`<p class="muted small">Web address: <a href="${c.url(data, slug)}" target="_blank" rel="noopener">${c.url(data, slug)} ↗</a></p>`}
        ${renderFields(defs, data, ctx)}
      </div>
      <div class="editor__bar">
        <button class="btn btn--primary" type="submit">Save</button>
        <a class="btn btn--ghost" href="${`/admin/c/${col}`}">Cancel</a>
        <span class="muted small">Saved changes go live when you press <strong>Publish changes</strong>.</span>
      </div>
    </form>
    ${isNew
      ? ''
      : html`<form class="danger-zone" method="post" action="${`/admin/c/${col}/${slug}/delete`}" data-confirm="Delete this ${c.singular.toLowerCase()} permanently?">
          ${refsTo.length
            ? html`<p class="muted small">Cannot delete: linked from ${refsTo.map((r, i) => html`${i ? ', ' : ''}<a href="${`/admin/c/${r.col}/${r.slug}`}">${r.title}</a>`)}. Remove those links first.</p>`
            : html`<button class="btn btn--danger btn--sm" type="submit">Delete ${c.singular.toLowerCase()}</button>`}
        </form>`}`;
}

export function docPage({ action, defs, data, errors = [], intro }) {
  return html`
    ${intro ? html`<p class="intro">${intro}</p>` : ''}
    ${errors.length ? html`<div class="flash flash--error"><strong>Please fix:</strong><ul>${errors.map((e) => html`<li>${e}</li>`)}</ul></div>` : ''}
    <form class="editor" method="post" action="${action}" data-editor>
      <input type="hidden" name="payload" />
      <div class="editor__main" data-scope data-root>${renderFields(defs, data, {})}</div>
      <div class="editor__bar">
        <button class="btn btn--primary" type="submit">Save</button>
        <span class="muted small">Saved changes go live when you press <strong>Publish changes</strong>.</span>
      </div>
    </form>`;
}

export function enquiriesPage({ items, filter }) {
  const shown = filter === 'all' ? items : items.filter((e) => (filter ? e.status === filter : e.status !== 'closed'));
  const tabs = [
    ['', 'Open'],
    ['new', 'New'],
    ['in-progress', 'In progress'],
    ['quoted', 'Quoted'],
    ['closed', 'Closed'],
    ['all', 'All'],
  ];
  return html`
    <div class="toolbar">
      <nav class="tabs">${tabs.map(([v, l]) => html`<a class="${v === (filter || '') ? 'active' : ''}" href="${`/admin/enquiries${v ? `?status="${v}"` : ''}`}">${l}</a>`)}</nav>
      <a class="btn btn--ghost" href="/admin/enquiries.csv">Download CSV</a>
    </div>
    ${shown.length
      ? html`<table class="table">
          <thead>
            <tr>
              <th>Received</th>
              <th>Name / company</th>
              <th>Product</th>
              <th>Contact</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${shown.map(
              (e) => html`<tr class="${e.status === 'new' ? 'is-new' : ''}">
                <td class="small">${fmtDate(e.createdAt)}</td>
                <td><a href="${`/admin/enquiries/${e.id}`}"><strong>${e.name}</strong></a><br /><span class="muted small">${e.company}</span></td>
                <td class="small">${e.product || '—'}${e.quantity ? html`<br /><span class="muted">${e.quantity}</span>` : ''}</td>
                <td class="small">
                  <a href="${`tel:${e.mobile.replace(/[^0-9+]/g, '')}`}">${e.mobile}</a>
                  ${e.email ? html`<br /><a href="${`mailto:${e.email}`}">${e.email}</a>` : ''}
                </td>
                <td>${statusBadge(e.status)}</td>
              </tr>`,
            )}
          </tbody>
        </table>`
      : html`<div class="empty">No enquiries here yet.</div>`}`;
}

export function enquiryPage({ e }) {
  const wa = `https://wa.me/${e.mobile.replace(/\D/g, '').replace(/^0/, '').replace(/^(\d{10})$/, '91$1')}?text="${encodeURIComponent(`Hello ${e.name}, thank you for your enquiry to SK Enterprises${e.product ? ` about ${e.product}` : ''}.`)}"`;
  const rows = [
    ['Name', e.name],
    ['Company', e.company],
    ['Mobile', e.mobile],
    ['Email', e.email],
    ['Product', e.product],
    ['Quantity', e.quantity],
    ['Location', e.location],
    ['Form', e.form_type],
    ['Page', e.page_url],
    ['Received', fmtDate(e.createdAt)],
  ];
  return html`
    <div class="cols cols--wide">
      <section class="panel">
        <dl class="dl">${rows.filter(([, v]) => v).map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl>
        ${e.message ? html`<h2 class="mt">Requirement</h2><p class="message">${e.message}</p>` : ''}
        ${e.attachment
          ? html`<h2 class="mt">Attachment</h2>
              <p><a class="btn btn--ghost" href="${`/admin/enquiries/${e.id}/file`}">⬇ ${e.attachment.name}</a> <span class="muted small">${Math.round(e.attachment.size / 1024)} KB</span></p>`
          : ''}
      </section>
      <section class="panel">
        <h2>Reply</h2>
        <p class="stack-btns">
          <a class="btn btn--wa" href="${wa}" target="_blank" rel="noopener">WhatsApp ${e.name.split(' ')[0]}</a>
          <a class="btn btn--ghost" href="${`tel:${e.mobile.replace(/[^0-9+]/g, '')}`}">Call ${e.mobile}</a>
          ${e.email ? html`<a class="btn btn--ghost" href="${`mailto:${e.email}?subject="${encodeURIComponent(`Your enquiry to SK Enterprises${e.product ? ` — ${e.product}` : ''}`)}"`}">Email</a>` : ''}
        </p>
        <h2 class="mt">Status</h2>
        <form method="post" action="${`/admin/enquiries/${e.id}/status`}" class="status-form">
          <select name="status" class="in">
            ${['new', 'in-progress', 'quoted', 'closed'].map((s) => html`<option value="${s}" ${raw(s === e.status ? 'selected' : '')}>${s.replace('-', ' ')}</option>`)}
          </select>
          <button class="btn btn--primary btn--sm" type="submit">Update</button>
        </form>
        <form method="post" action="${`/admin/enquiries/${e.id}/delete`}" data-confirm="Delete this enquiry permanently?" class="mt">
          <button class="btn btn--danger btn--sm" type="submit">Delete enquiry</button>
        </form>
      </section>
    </div>`;
}

export function seoPage({ report, status }) {
  if (!report) return html`<div class="empty">No report yet — press <strong>Publish changes</strong> to build the website and run the SEO check.</div>`;
  const noindexed = report.pages.filter((p) => !p.indexable);
  return html`
    <div class="stats">
      <div class="stat"><strong>${report.pageCount}</strong><span>Pages</span></div>
      <div class="stat"><strong>${report.indexableCount}</strong><span>Visible to Google</span></div>
      <div class="stat ${report.problems.length ? 'stat--bad' : 'stat--good'}"><strong>${report.problems.length}</strong><span>Problems</span></div>
      <div class="stat"><strong>${status.placeholders}</strong><span>Placeholders left</span></div>
    </div>
    ${noindexed.length
      ? html`<div class="flash flash--warn">
          <strong>${noindexed.length} page(s) are hidden from Google.</strong> Pages stay hidden while the website is not set to LIVE (Settings → Launch)
          or while a page is still marked “sample”.
        </div>`
      : ''}
    ${report.problems.length ? html`<section class="panel"><h2>Problems</h2><ul class="issues">${report.problems.map((p) => html`<li>${p}</li>`)}</ul></section>` : ''}
    ${report.warnings.length ? html`<section class="panel"><h2>Suggestions</h2><ul class="issues issues--warn">${report.warnings.map((p) => html`<li>${p}</li>`)}</ul></section>` : ''}
    <section class="panel">
      <h2>All pages <span class="muted small">checked ${fmtDate(report.checkedAt)}</span></h2>
      <table class="table table--seo">
        <thead>
          <tr>
            <th>Page</th>
            <th>Title</th>
            <th>Description</th>
            <th>Google</th>
          </tr>
        </thead>
        <tbody>
          ${report.pages.map(
            (p) => html`<tr>
              <td class="small"><a href="${p.url}" target="_blank" rel="noopener">${p.url}</a></td>
              <td class="small">${p.title} <span class="${`len ${p.titleLength > 60 ? 'warn' : ''}`}">${p.titleLength}</span></td>
              <td class="small">${p.description} <span class="${`len ${p.descriptionLength > 160 || p.descriptionLength < 120 ? 'warn' : ''}`}">${p.descriptionLength}</span></td>
              <td>${p.indexable ? html`<span class="badge badge--ok">visible</span>` : html`<span class="badge badge--sample">hidden</span>`}</td>
            </tr>`,
          )}
        </tbody>
      </table>
    </section>`;
}

export function publishPage({ state, releases }) {
  return html`
    <section class="panel">
      <h2>Status</h2>
      <p>${statusBadge(state?.status || 'idle')} ${state?.finishedAt ? html`<span class="muted">finished ${fmtDate(state.finishedAt)}</span>` : ''}</p>
      ${state?.error ? html`<p class="error-text">${state.error}</p>` : ''}
      ${state?.log ? html`<details ${raw(state.status === 'failed' ? 'open' : '')}><summary>Build log</summary><pre class="log" data-log>${state.log}</pre></details>` : ''}
    </section>
    <section class="panel">
      <h2>Published versions</h2>
      <p class="muted small">The last versions are kept. If something looks wrong after publishing, switch back to an earlier version instantly.</p>
      <table class="table">
        <tbody>
          ${releases.map(
            (r) => html`<tr>
              <td><strong>${r.id.replace(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2}).*$/, '$3-$2-$1 $4:$5 UTC')}</strong></td>
              <td>${r.current ? html`<span class="badge badge--ok">live</span>` : ''}</td>
              <td class="right">
                ${r.current
                  ? ''
                  : html`<form method="post" action="${`/admin/releases/${r.id}/rollback`}" data-confirm="Switch the live website back to this version?">
                      <button class="btn btn--ghost btn--sm" type="submit">Restore this version</button>
                    </form>`}
              </td>
            </tr>`,
          )}
        </tbody>
      </table>
    </section>`;
}
