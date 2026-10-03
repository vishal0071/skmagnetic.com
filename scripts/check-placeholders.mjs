/**
 * Launch checklist: lists every {{placeholder}} still in the content and settings, every
 * page still marked `sample: true`, and the launch settings.  Run: npm run check:placeholders
 * (The admin dashboard shows the same checklist.)
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const contentDir = join(root, 'src/content');
const files = [];
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (/\.(md|json)$/.test(e.name)) files.push(p);
  }
}
await walk(contentDir);
for (const extra of ['src/pages/privacy-policy.md', 'src/pages/terms-and-conditions.md', 'src/pages/shipping-policy.md', 'src/pages/refund-policy.md'])
  files.push(join(root, extra));

let total = 0;
const samples = [];
const report = [];
for (const f of files) {
  const text = await readFile(f, 'utf8');
  const found = [...text.matchAll(/\{\{([^{}]+)\}\}/g)].map((m) => m[1].trim());
  if (/^sample:\s*true/m.test(text)) samples.push(relative(root, f));
  if (found.length) {
    total += found.length;
    report.push(`\n${relative(root, f)} (${found.length})\n  - ${[...new Set(found)].join('\n  - ')}`);
  }
}

const s = JSON.parse(await readFile(join(contentDir, 'settings.json'), 'utf8'));
const flags = [
  [!s.isLive, 'Website is not LIVE yet — every page is noindex and robots.txt blocks crawlers (admin → Company & contact → Launch)'],
  [/x/i.test(s.contact.phone) || /x/i.test(s.contact.whatsapp), 'Phone / WhatsApp numbers are still placeholders'],
  [!s.contact.emailConfirmed, 'Email address not confirmed'],
  [!s.analytics.gtmId && !s.analytics.ga4Id, 'No Google Tag Manager or GA4 ID — conversions are not being recorded'],
  [!s.seo.googleSiteVerification, 'Google Search Console not verified'],
];

console.log('SK Enterprises — launch checklist\n==================================');
for (const [on, msg] of flags) if (on) console.log(`• ${msg}`);
console.log(`• ${samples.length} page(s) still marked sample: true (hidden from Google, excluded from sitemap)`);
for (const x of samples) console.log(`    ${x}`);
console.log(`• ${total} {{placeholder}} value(s) in ${report.length} file(s):`);
console.log(report.join('\n'));
