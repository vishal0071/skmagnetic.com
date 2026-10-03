/* SK Enterprises admin — forms, uploads, publishing. No dependencies. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Mobile menu
  $('[data-menu]')?.addEventListener('click', () => $('#sidebar').classList.toggle('open'));

  // Confirm destructive actions
  $$('form[data-confirm]').forEach((f) => f.addEventListener('submit', (e) => !confirm(f.dataset.confirm) && e.preventDefault()));

  // ---------- Serialise editor forms to JSON ----------
  const scopeOf = (el) => el.parentElement.closest('[data-scope]');
  function collect(scope) {
    const out = {};
    $$('[data-key]', scope)
      .filter((f) => scopeOf(f) === scope)
      .forEach((f) => (out[f.dataset.key] = read(f)));
    return out;
  }
  function read(field) {
    const items = () => [...field.querySelector(':scope > .items').children];
    switch (field.dataset.type) {
      case 'bool':
        return field.querySelector('input').checked;
      case 'group':
        return collect(field);
      case 'list':
        return items().map(collect);
      case 'strings':
        return items().map((i) => i.querySelector('input').value);
      case 'refs':
        return $$('input:checked', field).map((i) => i.value);
      case 'images':
        return items().map((i) => ({ src: i.querySelector('[data-src]').value, alt: i.querySelector('[data-alt]').value }));
      default:
        return field.querySelector('.in').value;
    }
  }
  $$('form[data-editor]').forEach((form) => {
    form.addEventListener('submit', () => {
      form.querySelector('[name=payload]').value = JSON.stringify(collect(form.querySelector('[data-root]')));
    });
  });

  // ---------- Repeatable lists ----------
  const renumber = (list) => $$(':scope > .items > [data-item]', list).forEach((it, i) => it.querySelector('[data-n]') && (it.querySelector('[data-n]').textContent = i + 1));
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add],[data-remove],[data-up],[data-down]');
    if (!btn) return;
    const field = btn.closest('[data-type]');
    if (btn.hasAttribute('data-add')) {
      const tpl = field.querySelector(':scope > template');
      field.querySelector(':scope > .items').append(tpl.content.cloneNode(true));
      renumber(field);
      bindCounters(field);
      return;
    }
    const item = btn.closest('[data-item]');
    const listField = item.parentElement.closest('[data-type]');
    if (btn.hasAttribute('data-remove')) item.remove();
    if (btn.hasAttribute('data-up') && item.previousElementSibling) item.previousElementSibling.before(item);
    if (btn.hasAttribute('data-down') && item.nextElementSibling) item.nextElementSibling.after(item);
    renumber(listField);
  });

  // ---------- Character counters (SEO title / description) ----------
  function bindCounters(root = document) {
    $$('[data-counter]', root).forEach((counter) => {
      const input = counter.closest('.field').querySelector('.in');
      if (input.dataset.counted) return;
      input.dataset.counted = '1';
      const min = Number(counter.dataset.min) || 0;
      const max = Number(counter.dataset.max) || 0;
      const limit = Number(counter.dataset.limit) || max;
      const update = () => {
        const n = input.value.length;
        counter.textContent = min ? `${n} characters · ideal ${min}–${max}` : `${n} / ${limit}`;
        counter.className = 'counter ' + (n > limit ? 'bad' : min && (n < min || n > max) ? 'warn' : 'good');
      };
      input.addEventListener('input', update);
      update();
    });
  }
  bindCounters();

  // ---------- Slug from title (new items) ----------
  const slugInput = $('[data-slug]');
  const titleInput = $('[data-key="title"] .in');
  if (slugInput && titleInput) {
    let touched = !!slugInput.value;
    slugInput.addEventListener('input', () => (touched = true));
    titleInput.addEventListener('input', () => {
      if (touched) return;
      slugInput.value = titleInput.value
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
    });
  }

  // ---------- Photo uploads ----------
  $$('[data-upload]').forEach((input) => {
    input.addEventListener('change', async () => {
      const field = input.closest('[data-type="images"]');
      const status = field.querySelector('[data-upload-status]');
      const col = location.pathname.split('/')[3];
      const slug = $('[data-slug]')?.value || location.pathname.split('/')[4] || 'photo';
      for (const file of input.files) {
        status.textContent = `Uploading ${file.name}…`;
        const body = new FormData();
        body.append('file', file);
        body.append('col', col);
        body.append('slug', slug);
        try {
          const res = await fetch('/admin/upload', { method: 'POST', body });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');
          const node = field.querySelector(':scope > template').content.cloneNode(true);
          node.querySelector('[data-src]').value = data.src;
          node.querySelector('[data-preview]').src = data.url;
          field.querySelector(':scope > .items').append(node);
          status.textContent = 'Uploaded — add a description, then Save.';
        } catch (err) {
          status.textContent = err.message;
        }
      }
      input.value = '';
    });
  });

  // ---------- Publishing ----------
  const bar = $('[data-publish-bar]');
  const text = $('[data-publish-text]');
  const btn = $('[data-publish-btn]');
  const LABEL = { building: 'Building the website…', releasing: 'Switching the live site to the new version…', auditing: 'Running the SEO check…' };
  async function poll() {
    try {
      const s = await (await fetch('/admin/publish/status', { headers: { Accept: 'application/json' } })).json();
      if (s.running) {
        bar.className = 'publish-bar is-active';
        text.textContent = LABEL[s.status] || 'Publishing…';
        btn.disabled = true;
        btn.textContent = 'Publishing…';
        setTimeout(poll, 1500);
        return;
      }
      btn.disabled = false;
      btn.textContent = 'Publish changes';
      if (s.status === 'success') {
        bar.className = 'publish-bar is-ok';
        text.textContent = '✓ Published — the live website is up to date.';
      } else if (s.status === 'failed') {
        bar.className = 'publish-bar is-bad';
        text.innerHTML = '';
        text.append(`✕ ${s.error} `);
        const a = document.createElement('a');
        a.href = '/admin/publish';
        a.textContent = 'View log';
        text.append(a);
      }
    } catch {
      setTimeout(poll, 4000);
    }
  }
  $('[data-publish-form]')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    await fetch('/admin/publish', { method: 'POST', headers: { Accept: 'application/json' } });
    poll();
  });
  if (btn?.disabled) poll();
})();
