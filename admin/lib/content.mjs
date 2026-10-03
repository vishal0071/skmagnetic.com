/** Read / write the site's Markdown content files and JSON settings. */
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import YAML from 'yaml';
import { CONTENT_DIR } from './config.mjs';

export const COLLECTIONS = {
  products: { label: 'Products', singular: 'Product', dir: 'products', url: (d, slug) => `/products/${d.category}/${slug}/` },
  categories: { label: 'Categories', singular: 'Category', dir: 'categories', url: (_, slug) => `/products/${slug}/` },
  industries: { label: 'Industries', singular: 'Industry', dir: 'industries', url: (_, slug) => `/industries/${slug}/` },
  applications: { label: 'Applications', singular: 'Application', dir: 'applications', url: (_, slug) => `/applications/${slug}/` },
  blog: { label: 'Blog articles', singular: 'Article', dir: 'blog', url: (_, slug) => `/blog/${slug}/` },
};

/** Which fields in which collections reference other collections (for safe deletes). */
const REFERENCES = {
  products: { category: 'categories', industries: 'industries', relatedApplications: 'applications', related: 'products' },
  industries: { products: 'products', applications: 'applications' },
  applications: { products: 'products', industries: 'industries' },
  blog: { products: 'products', categories: 'categories' },
};

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const isCollection = (c) => Object.hasOwn(COLLECTIONS, c);
export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const fileOf = (col, slug) => {
  if (!isCollection(col) || !SLUG_RE.test(slug)) throw new Error('Invalid collection or slug');
  return join(CONTENT_DIR, COLLECTIONS[col].dir, `${slug}.md`);
};

export function parseMarkdown(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  return { data: YAML.parse(m[1]) || {}, body: m[2].replace(/^\n+/, '') };
}

export function stringifyMarkdown(data, body) {
  const fm = YAML.stringify(data, { lineWidth: 0 }).trimEnd();
  return `---\n${fm}\n---\n\n${(body || '').trim()}\n`;
}

export async function listItems(col) {
  const dir = join(CONTENT_DIR, COLLECTIONS[col].dir);
  const names = (await readdir(dir).catch(() => [])).filter((n) => n.endsWith('.md'));
  const items = await Promise.all(
    names.map(async (name) => {
      const slug = name.replace(/\.md$/, '');
      const path = join(dir, name);
      const [text, info] = await Promise.all([readFile(path, 'utf8'), stat(path)]);
      const { data } = parseMarkdown(text);
      return { slug, data, modified: info.mtime };
    }),
  );
  return items.sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999) || String(a.data.title).localeCompare(String(b.data.title)));
}

export async function readItem(col, slug) {
  const text = await readFile(fileOf(col, slug), 'utf8');
  return parseMarkdown(text);
}

export async function itemExists(col, slug) {
  return !!(await stat(fileOf(col, slug)).catch(() => null));
}

/** Atomic write: temp file + rename, so the site never reads a half-written file. */
async function atomicWrite(path, text) {
  const tmp = `${path}.tmp-${process.pid}`;
  await writeFile(tmp, text, 'utf8');
  await rename(tmp, path);
}

export async function writeItem(col, slug, data, body) {
  const path = fileOf(col, slug);
  await mkdir(join(CONTENT_DIR, COLLECTIONS[col].dir), { recursive: true });
  await atomicWrite(path, stringifyMarkdown(data, body));
}

export async function deleteItem(col, slug) {
  await rm(fileOf(col, slug));
}

/** Pages that link to this item through a reference field (deleting it would break them). */
export async function findReferences(col, slug) {
  const found = [];
  for (const [fromCol, fields] of Object.entries(REFERENCES)) {
    const targets = Object.entries(fields).filter(([, to]) => to === col);
    if (!targets.length) continue;
    for (const item of await listItems(fromCol)) {
      if (fromCol === col && item.slug === slug) continue;
      for (const [field] of targets) {
        const v = item.data[field];
        if (v === slug || (Array.isArray(v) && v.includes(slug))) found.push({ col: fromCol, slug: item.slug, title: item.data.title, field });
      }
    }
  }
  return found;
}

// ---- JSON documents (settings.json, trust.json) ----
export async function readJson(name) {
  return JSON.parse(await readFile(join(CONTENT_DIR, name), 'utf8'));
}
export async function writeJson(name, data) {
  await atomicWrite(join(CONTENT_DIR, name), JSON.stringify(data, null, 2) + '\n');
}

/** Count {{placeholders}} and sample pages — for the launch checklist. */
export async function contentStatus() {
  let placeholders = 0;
  let samples = 0;
  let total = 0;
  for (const col of Object.keys(COLLECTIONS)) {
    const dir = join(CONTENT_DIR, COLLECTIONS[col].dir);
    for (const name of (await readdir(dir).catch(() => [])).filter((n) => n.endsWith('.md'))) {
      const text = await readFile(join(dir, name), 'utf8');
      total++;
      placeholders += (text.match(/\{\{[^{}]+\}\}/g) || []).length;
      if (/^sample:\s*true/m.test(text)) samples++;
    }
  }
  for (const name of ['settings.json', 'trust.json']) {
    const text = await readFile(join(CONTENT_DIR, name), 'utf8').catch(() => '');
    placeholders += (text.match(/\{\{[^{}]+\}\}/g) || []).length;
  }
  return { placeholders, samples, total };
}
