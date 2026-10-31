import type { APIRoute } from 'astro';
import { site } from '@/config/site';

/**
 * While site.isLive is false the whole site is blocked from crawlers.
 * Once live, /admin and /api are kept out of Google by an X-Robots-Tag: noindex header from the
 * admin service instead of a Disallow here — a robots.txt block stops Google from seeing the noindex,
 * so a blocked URL can still be indexed ("Indexed, though blocked by robots.txt").
 */
export const GET: APIRoute = () => {
  const body = site.isLive
    ? `User-agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
`
    : `# Pre-launch: search engines are blocked until the website is set to LIVE
# (admin → Company & contact → Launch → "Website is LIVE", then Publish).
User-agent: *
Disallow: /
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
