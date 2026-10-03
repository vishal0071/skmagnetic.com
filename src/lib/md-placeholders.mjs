/**
 * Markdown plugin (Sätteri mdast): turns {{placeholder text}} inside Markdown content into
 * <span class="ph">…</span>. Placeholders are hidden from visitors and highlighted in review
 * mode (?review=1). A ", " directly after a placeholder is hidden with it, so
 * "based in {{City}}, Maharashtra" reads "based in Maharashtra" until the city is filled in.
 */
import { defineMdastPlugin } from 'satteri';

const RE = /\{\{([^{}]+)\}\}(, )?/g;
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export const placeholders = defineMdastPlugin({
  name: 'sk-placeholders',
  text(node, ctx) {
    if (!node.value.includes('{{')) return;
    const parts = [];
    let last = 0;
    for (const match of node.value.matchAll(RE)) {
      if (match.index > last) parts.push({ type: 'text', value: node.value.slice(last, match.index) });
      parts.push({
        type: 'html',
        value: `<span class="ph" title="Placeholder — replace before launch">${escapeHtml(match[1].trim() + (match[2] || ''))}</span>`,
      });
      last = match.index + match[0].length;
    }
    if (!parts.length) return;
    if (last < node.value.length) parts.push({ type: 'text', value: node.value.slice(last) });
    ctx.replaceNode(node, parts);
  },
});
