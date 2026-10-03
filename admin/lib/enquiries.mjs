/**
 * Enquiries submitted through the website form. Stored as one JSON file each in
 * DATA_DIR/enquiries (attachments in a sub-folder), and emailed to NOTIFY_EMAIL when
 * SMTP is configured.
 */
import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import nodemailer from 'nodemailer';
import { DATA_DIR, NOTIFY_EMAIL, PUBLIC_ORIGIN, SMTP } from './config.mjs';

const DIR = join(DATA_DIR, 'enquiries');
const ID_RE = /^[0-9a-f-]{36}$/;
export const ALLOWED_EXT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.jpg', '.jpeg', '.png', '.webp'];
export const MAX_FILE = 5 * 1024 * 1024;
export const FIELDS = ['name', 'company', 'mobile', 'email', 'product', 'quantity', 'location', 'message', 'form_type', 'page_url'];
const LIMITS = { name: 80, company: 120, mobile: 18, email: 120, product: 120, quantity: 60, location: 80, message: 2000, form_type: 40, page_url: 300 };

const fileOf = (id) => {
  if (!ID_RE.test(id)) throw new Error('Invalid id');
  return join(DIR, `${id}.json`);
};

export async function createEnquiry(fields, file, meta) {
  await mkdir(DIR, { recursive: true });
  const id = randomUUID();
  const clean = {};
  for (const k of FIELDS) clean[k] = String(fields[k] ?? '').trim().slice(0, LIMITS[k]);
  let attachment = null;
  if (file && file.size > 0) {
    const ext = extname(file.name || '').toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) throw new Error('This file type is not accepted.');
    if (file.size > MAX_FILE) throw new Error('The attachment is larger than 5 MB.');
    const dir = join(DIR, id);
    await mkdir(dir, { recursive: true });
    const stored = `attachment${ext}`;
    await writeFile(join(dir, stored), Buffer.from(await file.arrayBuffer()));
    attachment = { name: String(file.name).slice(0, 120), stored, size: file.size, type: file.type || '' };
  }
  const record = { id, createdAt: new Date().toISOString(), status: 'new', ...clean, attachment, ip: meta.ip, userAgent: String(meta.userAgent || '').slice(0, 200) };
  await writeFile(fileOf(id), JSON.stringify(record, null, 2));
  notify(record).catch((err) => console.error('Enquiry email failed:', err.message));
  return record;
}

export async function listEnquiries() {
  const names = (await readdir(DIR).catch(() => [])).filter((n) => n.endsWith('.json'));
  const items = await Promise.all(names.map(async (n) => JSON.parse(await readFile(join(DIR, n), 'utf8'))));
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEnquiry(id) {
  return JSON.parse(await readFile(fileOf(id), 'utf8'));
}

export async function setStatus(id, status) {
  const e = await getEnquiry(id);
  e.status = ['new', 'in-progress', 'quoted', 'closed'].includes(status) ? status : e.status;
  await writeFile(fileOf(id), JSON.stringify(e, null, 2));
  return e;
}

export async function deleteEnquiry(id) {
  await rm(fileOf(id), { force: true });
  await rm(join(DIR, id), { recursive: true, force: true });
}

export const attachmentPath = (e) => (e.attachment ? join(DIR, e.id, e.attachment.stored) : null);

export function toCsv(items) {
  const cols = ['createdAt', 'status', ...FIELDS];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...items.map((e) => cols.map((c) => cell(e[c])).join(','))].join('\n');
}

let transport;
async function notify(e) {
  if (!SMTP.host || !NOTIFY_EMAIL) return;
  transport ||= nodemailer.createTransport({ host: SMTP.host, port: SMTP.port, secure: SMTP.secure, auth: SMTP.user ? { user: SMTP.user, pass: SMTP.pass } : undefined });
  const lines = FIELDS.filter((k) => e[k]).map((k) => `${k.replace('_', ' ')}: ${e[k]}`);
  await transport.sendMail({
    from: SMTP.from,
    to: NOTIFY_EMAIL,
    replyTo: e.email || undefined,
    subject: `New ${e.form_type || 'enquiry'} — ${e.name}${e.product ? ` — ${e.product}` : ''}`,
    text: `${lines.join('\n')}\n\n${e.attachment ? `Attachment: ${e.attachment.name}\n` : ''}${PUBLIC_ORIGIN ? `Open in admin: ${PUBLIC_ORIGIN}/admin/enquiries/${e.id}\n` : ''}`,
  });
}
