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
    : `# Pre-launch: search engines are blocked until the website is set to LIVE
# (admin → Company & contact → Launch → "Website is LIVE", then Publish).
User-agent: *
Disallow: /
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
