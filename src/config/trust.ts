/**
 * TRUST CONTENT — edited in the admin panel (Settings → Trust & process) or in
 * src/content/trust.json. Add only genuine, verifiable items: never invent
 * testimonials, clients or certificates. Empty lists are hidden on the site.
 */
import data from '../content/trust.json';

export const testimonials: { quote: string; name: string; role?: string; company?: string }[] = data.testimonials;
/** e.g. { name: 'ISO 9001:2015', issuer: '...', file: '/docs/iso-9001.pdf' } */
export const certifications: { name: string; issuer?: string; file?: string }[] = data.certifications;
/** Client logos — only with the client's permission. */
export const clients: { name: string; logo: string }[] = data.clients;
export const strengths: { icon: string; title: string; text: string }[] = data.strengths;
export const processSteps: { title: string; text: string }[] = data.processSteps;
