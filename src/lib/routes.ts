/**
 * Every public URL on the site, with whether it may be indexed.
 * Used by sitemap.xml and the HTML sitemap so nothing is forgotten.
 */
import { getApplications, getCategories, getIndustries, getPosts, getProducts, productHref } from '@/lib/content';
import { applicationUrl, blogUrl, categoryUrl, industryUrl } from '@/lib/links';
import { legalNav } from '@/config/site';

export interface Route {
  url: string;
  title: string;
  group: string;
  sample?: boolean;
  lastmod?: Date;
  priority: number;
}

export async function getRoutes(): Promise<Route[]> {
  const [categories, products, industries, applications, posts] = await Promise.all([
    getCategories(),
    getProducts(),
    getIndustries(),
    getApplications(),
    getPosts(),
  ]);

  return [
    { url: '/', title: 'Home', group: 'Main pages', priority: 1 },
    { url: '/products/', title: 'All Products', group: 'Main pages', priority: 0.9 },
    { url: '/industries/', title: 'Industries', group: 'Main pages', priority: 0.7 },
    { url: '/applications/', title: 'Applications', group: 'Main pages', priority: 0.7 },
    { url: '/about/', title: 'About Us', group: 'Main pages', priority: 0.6 },
    { url: '/blog/', title: 'Blog & Guides', group: 'Main pages', priority: 0.6 },
    { url: '/contact/', title: 'Contact', group: 'Main pages', priority: 0.8 },
    { url: '/get-quote/', title: 'Get a Quote', group: 'Main pages', priority: 0.8 },
    ...categories.map((c) => ({ url: categoryUrl(c.id), title: c.data.title, group: 'Product categories', sample: c.data.sample, priority: 0.9 })),
    ...products.map((p) => ({
      url: productHref(p),
      title: p.data.title,
      group: 'Products',
      sample: p.data.sample,
      lastmod: p.data.updated,
      priority: 0.9,
    })),
    ...industries.map((i) => ({ url: industryUrl(i.id), title: i.data.title, group: 'Industries', sample: i.data.sample, priority: 0.6 })),
    ...applications.map((a) => ({ url: applicationUrl(a.id), title: a.data.title, group: 'Applications', sample: a.data.sample, priority: 0.6 })),
    ...posts.map((p) => ({
      url: blogUrl(p.id),
      title: p.data.title,
      group: 'Blog',
      sample: p.data.sample,
      lastmod: p.data.updated ?? p.data.published,
      priority: 0.5,
    })),
    ...legalNav.filter((l) => l.href !== '/sitemap/').map((l) => ({ url: l.href, title: l.label, group: 'Policies', priority: 0.2 })),
  ];
}
