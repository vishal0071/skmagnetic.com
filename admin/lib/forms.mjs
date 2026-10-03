/** Renders admin edit forms from the field definitions in fields.mjs. */
import { html, raw } from './html.mjs';

let uid = 0;
const nextId = () => `f${(++uid).toString(36)}`;

const dateValue = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ? String(v).slice(0, 10) : '');
const labelFor = (f, id) =>
  html`<label class="label" for="${id}">${f.label}${f.required ? html`<span class="req" aria-hidden="true"> *</span>` : ''}</label>`;
const help = (f) => (f.help ? html`<p class="help">${f.help}</p>` : '');
const counter = (f) =>
  f.max || f.ideal
    ? html`<span class="counter" data-counter data-min="${f.ideal?.[0] ?? ''}" data-max="${f.ideal?.[1] ?? f.max ?? ''}" data-limit="${f.max ?? ''}"></span>`
    : '';

/**
 * ctx: { refs: { collection: [{slug,title}] }, mediaUrl(src) }
 */
export function renderFields(defs, values = {}, ctx = {}) {
  return defs.map((f) => renderField(f, f.type === 'section' ? values : values?.[f.key], ctx));
}

function renderField(f, value, ctx) {
  const id = nextId();
  switch (f.type) {
    case 'section':
      return html`<section class="form-section">
        <h2 class="form-section__title">${f.label}</h2>
        ${renderFields(f.fields, value, ctx)}
      </section>`;

    case 'group':
      return html`<fieldset class="field group" data-key="${f.key}" data-type="group" data-scope>
        <legend>${f.label}</legend>
        ${help(f)}
        <div class="group__fields">${renderFields(f.fields, value || {}, ctx)}</div>
      </fieldset>`;

    case 'bool':
      return html`<div class="field field--bool" data-key="${f.key}" data-type="bool">
        <label class="switch"><input type="checkbox" class="in" ${raw(value ? 'checked' : '')} /><span>${f.label}</span></label>
        ${help(f)}
      </div>`;

    case 'select':
    case 'ref': {
      const options = f.type === 'ref' ? (ctx.refs?.[f.collection] || []).map((r) => ({ value: r.slug, label: r.title })) : f.options.map((o) => ({ value: o, label: o }));
      return html`<div class="field" data-key="${f.key}" data-type="text">
        ${labelFor(f, id)}
        <select id="${id}" class="in">
          ${f.required ? '' : html`<option value="">—</option>`}
          ${options.map((o) => html`<option value="${o.value}" ${raw(o.value === value ? 'selected' : '')}>${o.label}</option>`)}
        </select>
        ${help(f)}
      </div>`;
    }

    case 'refs': {
      const options = ctx.refs?.[f.collection] || [];
      const selected = new Set(Array.isArray(value) ? value : []);
      return html`<div class="field" data-key="${f.key}" data-type="refs">
        <span class="label">${f.label}</span>
        ${help(f)}
        <div class="refs">
          ${options.map(
            (o) => html`<label class="ref"><input type="checkbox" value="${o.slug}" ${raw(selected.has(o.slug) ? 'checked' : '')} /><span>${o.title}</span></label>`,
          )}
        </div>
      </div>`;
    }

    case 'strings': {
      const items = Array.isArray(value) ? value : [];
      const row = (v) =>
        html`<div class="srow" data-item><input type="text" class="in" value="${v}" /><button type="button" class="icon-btn" data-remove title="Remove">✕</button></div>`;
      return html`<div class="field" data-key="${f.key}" data-type="strings">
        <span class="label">${f.label}</span>
        ${help(f)}
        <div class="items">${items.map(row)}</div>
        <template>${row('')}</template>
        <button type="button" class="btn btn--ghost btn--sm" data-add>+ Add</button>
      </div>`;
    }

    case 'list': {
      const items = Array.isArray(value) ? value : [];
      const item = (v, n) => html`<div class="${`item${f.compact ? ' item--compact' : ''}`}" data-item data-scope>
        <div class="item__bar">
          <span class="item__label">${f.itemLabel || 'Item'} <span data-n>${n}</span></span>
          <span class="item__tools">
            <button type="button" class="icon-btn" data-up title="Move up">↑</button>
            <button type="button" class="icon-btn" data-down title="Move down">↓</button>
            <button type="button" class="icon-btn" data-remove title="Remove">✕</button>
          </span>
        </div>
        <div class="${f.compact ? 'item__fields item__fields--row' : 'item__fields'}">${renderFields(f.fields, v || {}, ctx)}</div>
      </div>`;
      return html`<div class="field field--list" data-key="${f.key}" data-type="list">
        <span class="label">${f.label}</span>
        ${help(f)}
        <div class="items">${items.map((v, i) => item(v, i + 1))}</div>
        <template>${item({}, '')}</template>
        <button type="button" class="btn btn--ghost btn--sm" data-add>+ Add ${(f.itemLabel || 'item').toLowerCase()}</button>
      </div>`;
    }

    case 'images': {
      const items = Array.isArray(value) ? value : [];
      const item = (img) => html`<div class="img-item" data-item>
        <img src="${img.src ? ctx.mediaUrl?.(img.src) || '' : ''}" alt="" data-preview />
        <input type="hidden" data-src value="${img.src || ''}" />
        <div class="img-item__fields">
          <label class="label">Photo description (alt text) <span class="req">*</span></label>
          <input type="text" class="in" data-alt value="${img.alt || ''}" placeholder="e.g. SK Enterprises capacitor discharge magnetizer with coil fixture" />
        </div>
        <span class="item__tools">
          <button type="button" class="icon-btn" data-up title="Move up">↑</button>
          <button type="button" class="icon-btn" data-remove title="Remove">✕</button>
        </span>
      </div>`;
      return html`<div class="field" data-key="${f.key}" data-type="images">
        <span class="label">${f.label}</span>
        ${help(f)}
        <div class="items">${items.map(item)}</div>
        <template>${item({})}</template>
        <label class="upload">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple data-upload />
          <span>⬆ Upload photos</span>
        </label>
        <p class="upload-status" data-upload-status></p>
      </div>`;
    }

    case 'markdown':
      return html`<div class="field" data-key="${f.key}" data-type="text">
        ${labelFor(f, id)}
        ${help(f)}
        <textarea id="${id}" class="in in--md" rows="24" spellcheck="true">${value ?? ''}</textarea>
      </div>`;

    case 'textarea':
      return html`<div class="field" data-key="${f.key}" data-type="text">
        ${labelFor(f, id)}
        <textarea id="${id}" class="in" rows="${f.rows || 3}">${value ?? ''}</textarea>
        <div class="field__meta">${help(f)}${counter(f)}</div>
      </div>`;

    case 'number':
      return html`<div class="field field--short" data-key="${f.key}" data-type="text">
        ${labelFor(f, id)}
        <input id="${id}" type="number" class="in" value="${value ?? ''}" />
        ${help(f)}
      </div>`;

    case 'date':
      return html`<div class="field field--short" data-key="${f.key}" data-type="text">
        ${labelFor(f, id)}
        <input id="${id}" type="date" class="in" value="${dateValue(value)}" />
        ${help(f)}
      </div>`;

    default:
      return html`<div class="field" data-key="${f.key}" data-type="text">
        ${labelFor(f, id)}
        <input id="${id}" type="text" class="in" value="${value ?? ''}" />
        <div class="field__meta">${help(f)}${counter(f)}</div>
      </div>`;
  }
}
