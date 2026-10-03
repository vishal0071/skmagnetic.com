import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * CONTENT MODEL
 *
 *   categories  → /products/[category]/
 *   products    → /products/[category]/[product]/
 *   industries  → /industries/[industry]/
 *   applications→ /applications/[application]/
 *   blog        → /blog/[post]/
 *
 * The file name is the URL slug. Cross-links use reference() so a broken
 * slug fails the build instead of shipping a dead link.
 *
 * `sample: true` marks starter content that SK Enterprises has not yet
 * confirmed. Sample pages are noindexed, left out of sitemap.xml and show a
 * "confirm before launch" notice.
 */

const seo = z.object({
  /** <title> — aim for 50–60 characters. Brand suffix is NOT added automatically. */
  title: z.string().min(10).max(70),
  /** Meta description — aim for 140–160 characters. */
  description: z.string().min(50).max(170),
});

const faq = z.object({ q: z.string(), a: z.string() });
const point = z.object({ title: z.string(), text: z.string() });
const specRow = z.object({ label: z.string(), value: z.string() });

/** Built-in SVG illustrations used until real product photography is added */
export const illustrations = [
  'magnetizer',
  'coil',
  'fixture',
  'rotor',
  'speaker',
  'housing',
  'block',
  'disc',
  'ring',
  'arc',
  'horseshoe',
  'pot',
  'rod',
  'grill',
  'plate',
  'lifter',
  'cluster',
] as const;

const imageList = (image: () => z.ZodType) =>
  z
    .array(
      z.object({
        src: image(),
        /** Describe what the photo shows — e.g. "Nickel-coated neodymium block magnets in N42 grade" */
        alt: z.string().min(5),
      }),
    )
    .default([]);

const categories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/categories' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Short name for menus and chips */
      navLabel: z.string(),
      seo,
      /** One-line summary for cards */
      summary: z.string(),
      /** Lead paragraph under the H1 */
      intro: z.string(),
      illustration: z.enum(illustrations),
      images: imageList(image),
      order: z.number().default(100),
      sample: z.boolean().default(false),
      faqs: z.array(faq).default([]),
    }),
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: ({ image }) =>
    z.object({
      /** Product name — used as the H1 */
      title: z.string(),
      category: reference('categories'),
      seo,
      /** Short description for product cards (1–2 sentences) */
      summary: z.string().max(220),
      /** Lead paragraph at the top of the product page */
      overview: z.string(),
      /** Card highlight, e.g. { label: 'Grades', value: 'N35 – N52' } */
      keySpec: specRow,
      /** 3–4 quick highlights shown beside the gallery */
      highlights: z.array(z.string()).min(2).max(5),
      illustration: z.enum(illustrations),
      images: imageList(image),

      /** Typical, product-type reference values (not a supply promise) */
      specs: z.array(specRow).default([]),
      /** What SK Enterprises actually supplies — grades, sizes, MOQ, lead time */
      supply: z.array(specRow).default([]),
      variants: z.array(point).default([]),
      applications: z.array(point).default([]),
      features: z.array(point).default([]),
      benefits: z.array(point).default([]),

      industries: z.array(reference('industries')).default([]),
      relatedApplications: z.array(reference('applications')).default([]),
      related: z.array(reference('products')).default([]),
      faqs: z.array(faq).default([]),

      /** Optional downloadable datasheet in /public, e.g. /docs/neodymium-magnets.pdf */
      datasheet: z.string().optional(),
      /** Only set a price if SK Enterprises wants it published, e.g. { amount: 120, unit: 'per piece' } */
      price: z.object({ amount: z.number(), unit: z.string() }).optional(),

      featured: z.boolean().default(false),
      order: z.number().default(100),
      sample: z.boolean().default(false),
      updated: z.coerce.date().optional(),
    }),
});

const industries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/industries' }),
  schema: z.object({
    title: z.string(),
    seo,
    summary: z.string(),
    intro: z.string(),
    icon: z.string(),
    products: z.array(reference('products')).default([]),
    applications: z.array(reference('applications')).default([]),
    needs: z.array(point).default([]),
    faqs: z.array(faq).default([]),
    order: z.number().default(100),
    sample: z.boolean().default(false),
  }),
});

const applications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/applications' }),
  schema: z.object({
    title: z.string(),
    seo,
    summary: z.string(),
    intro: z.string(),
    icon: z.string(),
    products: z.array(reference('products')).default([]),
    industries: z.array(reference('industries')).default([]),
    faqs: z.array(faq).default([]),
    order: z.number().default(100),
    sample: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      seo,
      /** Summary for cards and the article intro */
      excerpt: z.string(),
      type: z.enum(['Buying Guide', 'Comparison', 'Specifications Explained', 'Application Guide', 'Maintenance', 'Glossary', 'Industry Insight']),
      published: z.coerce.date(),
      updated: z.coerce.date().optional(),
      author: z.string().default('SK Enterprises Team'),
      illustration: z.enum(illustrations).default('cluster'),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      products: z.array(reference('products')).default([]),
      categories: z.array(reference('categories')).default([]),
      faqs: z.array(faq).default([]),
      sample: z.boolean().default(false),
    }),
});

export const collections = { categories, products, industries, applications, blog };
