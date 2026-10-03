/** Admin service configuration — all from environment variables (see .env.example). */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const env = process.env;
export const PROJECT_DIR = resolve(env.PROJECT_DIR || process.cwd());
export const CONTENT_DIR = resolve(PROJECT_DIR, 'src/content');
export const MEDIA_DIR = resolve(CONTENT_DIR, 'media');
export const DATA_DIR = resolve(env.DATA_DIR || resolve(PROJECT_DIR, 'data'));
/** Published site: <SITE_ROOT>/current → releases/<id> (served by nginx in production) */
export const SITE_ROOT = resolve(env.SITE_ROOT || resolve(PROJECT_DIR, '.site'));
export const PORT = Number(env.PORT || 8787);
export const ADMIN_USER = env.ADMIN_USER || 'admin';
export const ADMIN_PASSWORD = env.ADMIN_PASSWORD || '';
export const ADMIN_SECRET = env.ADMIN_SECRET || '';
/** Local preview: also serve the published site at / (production uses nginx) */
export const SERVE_SITE = env.SERVE_SITE === '1';
/** e.g. https://skmagnetic.com — used for links in notification emails */
export const PUBLIC_ORIGIN = (env.PUBLIC_ORIGIN || '').replace(/\/$/, '');
export const SMTP = {
  host: env.SMTP_HOST || '',
  port: Number(env.SMTP_PORT || 587),
  secure: env.SMTP_SECURE === '1',
  user: env.SMTP_USER || '',
  pass: env.SMTP_PASS || '',
  from: env.SMTP_FROM || env.SMTP_USER || '',
};
export const NOTIFY_EMAIL = env.NOTIFY_EMAIL || '';
/** Build automatically when the service starts (keeps the live site in sync after a code deploy) */
export const BUILD_ON_START = env.BUILD_ON_START !== '0';
export const KEEP_RELEASES = Number(env.KEEP_RELEASES || 5);

export function assertConfig() {
  const errors = [];
  if (ADMIN_PASSWORD.length < 10) errors.push('ADMIN_PASSWORD must be set (at least 10 characters).');
  if (ADMIN_SECRET.length < 32) errors.push('ADMIN_SECRET must be set (at least 32 random characters — e.g. `openssl rand -hex 32`).');
  if (!existsSync(CONTENT_DIR)) errors.push(`Content folder not found: ${CONTENT_DIR} (set PROJECT_DIR).`);
  if (errors.length) {
    console.error('Admin service cannot start:\n- ' + errors.join('\n- '));
    process.exit(1);
  }
}
