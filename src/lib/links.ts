import { site, whatsappMessages } from '@/config/site';

export const whatsappHref = (message: string = whatsappMessages.general) =>
  `https://wa.me/${site.contact.whatsapp.number}?text=${encodeURIComponent(message)}`;

export const telHref = () => `tel:${site.contact.phone.href}`;

export const mailHref = (subject?: string) =>
  `mailto:${site.contact.email.address}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

export const productUrl = (categorySlug: string, productSlug: string) => `/products/${categorySlug}/${productSlug}/`;
export const categoryUrl = (categorySlug: string) => `/products/${categorySlug}/`;
export const industryUrl = (slug: string) => `/industries/${slug}/`;
export const applicationUrl = (slug: string) => `/applications/${slug}/`;
export const blogUrl = (slug: string) => `/blog/${slug}/`;
export const quoteUrl = (productSlug?: string) => (productSlug ? `/get-quote/?product=${productSlug}` : '/get-quote/');

export const absoluteUrl = (path: string) => new URL(path, site.url).toString();
