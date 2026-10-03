/**
 * Placeholder convention: any text wrapped in {{double braces}} is content
 * that SK Enterprises still needs to supply or confirm.
 *
 * Visitors never see placeholders: they are wrapped in <span class="ph"> and hidden
 * by CSS. In review mode (?review=1) they are highlighted instead. Optional fallback
 * text (class "ph-alt") is shown to visitors in place of a missing value.
 */
export const PLACEHOLDER_RE = /\{\{([^{}]+)\}\}(, )?/g;

export const hasPlaceholder = (value?: string | null): boolean => !!value && /\{\{[^{}]+\}\}/.test(value);

/** True when the value is nothing but placeholder(s) — e.g. "{{GSTIN}}". */
export const isPlaceholderOnly = (value?: string | null): boolean =>
  !!value && hasPlaceholder(value) && value.replace(/\{\{[^{}]+\}\}/g, '').replace(/[\s.,;:–-]/g, '') === '';

/** Remove placeholders entirely — for meta tags, attributes and structured data. */
export const stripPlaceholders = (value: string): string =>
  value
    .replace(PLACEHOLDER_RE, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const span = (inner: string) => `<span class="ph" title="Placeholder — replace before launch">${inner}</span>`;

/**
 * Escape text and wrap placeholders (plus a following ", ") in a hidden-by-default span.
 * `fallback` is shown to visitors when the whole value is a placeholder.
 */
export const placeholderHtml = (value: string, fallback?: string): string => {
  const html = escapeHtml(value).replace(PLACEHOLDER_RE, (_, inner: string, comma = '') => span(inner.trim() + comma));
  return fallback && isPlaceholderOnly(value) ? `${html}<span class="ph-alt">${escapeHtml(fallback)}</span>` : html;
};

/** Value that is real (not a placeholder, not empty) — safe for structured data. */
export const realValue = (value?: string | null): string | undefined => (value && !hasPlaceholder(value) ? value : undefined);
