/**
 * SEO & link audit of a built site folder (dist/ or a published release).
 * Used by `npm run check:site` and by the admin panel's SEO report.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const decode = (v) =>
  v?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

export async function auditSite(dist) {
  const files = [];
  async function walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name.endsWith('.html')) files.push(p);
    }
  }
  await walk(dist);

  const exists = async (p) => !!(await stat(p).catch(() => null));
  const problems = [];
  const warnings = [];
  const pages = [];
  const titles = new Map();
  const descs = new Map();
  const checked = new Set();

  for (const file of files.sort()) {
    const url = '/' + relative(dist, file).replace(/index\.html$/, '');
    const html = await readFile(file, 'utf8');
    const is404 = url.startsWith('/404');
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1]) || '';
    const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1]) || '';
    const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || '';
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] || '';
    const schemaTypes = [...html.matchAll(/"@type":"([A-Za-z]+)"/g)].map((m) => m[1]);
    const words = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length;

    pages.push({
      url,
      title,
      titleLength: title.length,
      description,
      descriptionLength: description.length,
      h1,
      indexable: !robots.includes('noindex'),
      canonical,
      schema: [...new Set(schemaTypes)],
      words,
    });

    if (h1 !== 1) problems.push(`${url}: ${h1} <h1> elements (should be exactly 1)`);
    if (!title) problems.push(`${url}: missing <title>`);
    if (!description) problems.push(`${url}: missing meta description`);
    if (!canonical) problems.push(`${url}: missing canonical URL`);
    if (title.length > 65) warnings.push(`${url}: title is ${title.length} characters (Google shows ~60)`);
    if (description && (description.length < 110 || description.length > 165) && !is404)
      warnings.push(`${url}: meta description is ${description.length} characters (aim for 140–160)`);
    if (!is404) {
      if (title) titles.set(title, [...(titles.get(title) || []), url]);
      if (description) descs.set(description, [...(descs.get(description) || []), url]);
    }
    for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt=/.test(m[0])) problems.push(`${url}: <img> without alt text`);

    for (const m of html.matchAll(/\s(?:href|src)="(\/[^"#?]*)/g)) {
      const link = m[1];
      if (checked.has(link) || link.startsWith('/admin') || link.startsWith('/api/')) continue;
      checked.add(link);
      const target = link.endsWith('/') ? join(dist, link, 'index.html') : join(dist, link);
      if (!(await exists(target)) && !(await exists(join(dist, link, 'index.html')))) problems.push(`${url}: broken link ${link}`);
    }
  }
  for (const [t, urls] of titles) if (urls.length > 1) problems.push(`Duplicate title "${t}" on ${urls.join(', ')}`);
  for (const [, urls] of descs) if (urls.length > 1) problems.push(`Duplicate meta description on ${urls.join(', ')}`);

  return {
    checkedAt: new Date().toISOString(),
    pageCount: pages.length,
    indexableCount: pages.filter((p) => p.indexable).length,
    linkCount: checked.size,
    problems,
    warnings,
    pages,
  };
}
