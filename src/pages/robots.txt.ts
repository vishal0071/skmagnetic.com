import type { APIRoute } from 'astro';
import { site } from '@/config/site';

/** While site.isLive is false the whole site is blocked from crawlers. */
export const GET: APIRoute = () => {
  const body = site.isLive
    ? `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${site.url}/sitemap.xml
`
    : `# Pre-launch: crawling disabled. Set isLive: true in src/config/site.ts to open the site to search engines.
User-agent: *
Disallow: /

Sitemap: ${site.url}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
