import type { APIRoute } from 'astro';
import { site } from '@/config/site';
import { absoluteUrl } from '@/lib/links';
import { getRoutes } from '@/lib/routes';

/**
 * XML sitemap for Google Search Console.
 * Sample (unconfirmed) content is excluded until `sample: false` is set.
 */
export const GET: APIRoute = async () => {
  // Empty until the website is LIVE; afterwards only confirmed (non-sample) pages are listed.
  const routes = site.isLive ? (await getRoutes()).filter((r) => !r.sample) : [];
  const buildDate = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${absoluteUrl(r.url)}</loc>
    <lastmod>${r.lastmod ? r.lastmod.toISOString().slice(0, 10) : buildDate}</lastmod>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
