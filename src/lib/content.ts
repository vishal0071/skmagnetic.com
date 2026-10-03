import { getCollection, getEntries, type CollectionEntry } from 'astro:content';
import { site } from '@/config/site';
import { productUrl } from '@/lib/links';

export type Product = CollectionEntry<'products'>;
export type Category = CollectionEntry<'categories'>;
export type Industry = CollectionEntry<'industries'>;
export type Application = CollectionEntry<'applications'>;
export type Post = CollectionEntry<'blog'>;

const byOrder = <T extends { data: { order: number; title: string } }>(a: T, b: T) =>
  a.data.order - b.data.order || a.data.title.localeCompare(b.data.title);

export async function getCategories() {
  return (await getCollection('categories')).sort(byOrder);
}

export async function getProducts() {
  const categories = await getCategories();
  const catOrder = new Map(categories.map((c, i) => [c.id, i]));
  return (await getCollection('products')).sort(
    (a, b) => (catOrder.get(a.data.category.id) ?? 99) - (catOrder.get(b.data.category.id) ?? 99) || byOrder(a, b),
  );
}

export async function getIndustries() {
  return (await getCollection('industries')).sort(byOrder);
}

export async function getApplications() {
  return (await getCollection('applications')).sort(byOrder);
}

export async function getPosts() {
  return (await getCollection('blog')).sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
}

export const productHref = (p: Product) => productUrl(p.data.category.id, p.id);

/** Products grouped by category, in display order — for menus, selects and listings. */
export async function getCatalogue() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return categories.map((category) => ({
    category,
    products: products.filter((p) => p.data.category.id === category.id),
  }));
}

export async function resolve<C extends 'products' | 'industries' | 'applications' | 'categories'>(
  refs: { collection: C; id: string }[],
) {
  return refs.length ? ((await getEntries(refs as any)) as CollectionEntry<C>[]).filter(Boolean) : [];
}

/** Blog posts that link to a given product or category. */
export async function getPostsFor(opts: { product?: string; category?: string }) {
  const posts = await getPosts();
  return posts.filter(
    (p) =>
      (opts.product && p.data.products.some((r) => r.id === opts.product)) ||
      (opts.category && p.data.categories.some((r) => r.id === opts.category)),
  );
}

/** Should this page be kept out of search results? */
export const isNoindex = (entry?: { data: { sample?: boolean } }) => !site.isLive || !!entry?.data.sample;

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

export const readingTime = (body = '') => Math.max(1, Math.round(body.split(/\s+/).length / 220));
