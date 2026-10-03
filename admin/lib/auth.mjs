/**
 * Single-user admin authentication.
 *  - Password from ADMIN_PASSWORD, compared in constant time
 *  - Session = HMAC-signed, expiring cookie (HttpOnly, SameSite=Strict, Secure on HTTPS)
 *  - Login attempts rate-limited per IP
 *  - State-changing requests must come from the same origin (CSRF protection)
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { ADMIN_PASSWORD, ADMIN_SECRET, ADMIN_USER } from './config.mjs';

const COOKIE = 'sk_admin';
const SESSION_HOURS = 12;

const sign = (payload) => createHmac('sha256', ADMIN_SECRET).update(payload).digest('base64url');
const sha = (v) => createHash('sha256').update(String(v)).digest();
const same = (a, b) => timingSafeEqual(sha(a), sha(b));

export const isHttps = (c) =>
  (c.req.header('x-forwarded-proto') || new URL(c.req.url).protocol.replace(':', '')).split(',')[0].trim() === 'https';

export function clientIp(c) {
  const fwd = c.req.header('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return c.env?.incoming?.socket?.remoteAddress || 'unknown';
}

export function checkCredentials(user, password) {
  return same(user || '', ADMIN_USER) && same(password || '', ADMIN_PASSWORD);
}

export function startSession(c) {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  const payload = `${ADMIN_USER}.${exp}`;
  setCookie(c, COOKIE, `${payload}.${sign(payload)}`, {
    path: '/',
    httpOnly: true,
    secure: isHttps(c),
    sameSite: 'Strict',
    maxAge: SESSION_HOURS * 3600,
  });
}

export function endSession(c) {
  deleteCookie(c, COOKIE, { path: '/' });
}

export function hasSession(c) {
  const v = getCookie(c, COOKIE);
  if (!v) return false;
  const i = v.lastIndexOf('.');
  const payload = v.slice(0, i);
  const sig = v.slice(i + 1);
  const exp = Number(payload.split('.').pop());
  return !!sig && same(sig, sign(payload)) && Number.isFinite(exp) && exp > Date.now();
}

// ---- login rate limiting ----
const attempts = new Map();
const WINDOW = 15 * 60_000;
const MAX_FAILS = 8;
export function loginBlocked(ip) {
  const a = attempts.get(ip);
  return !!a && a.fails >= MAX_FAILS && Date.now() - a.first < WINDOW;
}
export function recordLoginFailure(ip) {
  const a = attempts.get(ip);
  if (!a || Date.now() - a.first > WINDOW) attempts.set(ip, { fails: 1, first: Date.now() });
  else a.fails++;
}
export const clearLoginFailures = (ip) => attempts.delete(ip);

/** Middleware: require a valid session for /admin (except login + assets). */
export function requireAuth() {
  return async (c, next) => {
    const path = new URL(c.req.url).pathname;
    if (path === '/admin/login' || path.startsWith('/admin/assets/')) return next();
    if (!hasSession(c)) {
      if (c.req.method === 'GET') return c.redirect(`/admin/login?next=${encodeURIComponent(path)}`);
      return c.json({ error: 'Not signed in' }, 401);
    }
    return next();
  };
}

/** Middleware: reject cross-site state-changing requests. */
export function sameOrigin() {
  return async (c, next) => {
    if (c.req.method === 'GET' || c.req.method === 'HEAD') return next();
    const origin = c.req.header('origin') || c.req.header('referer');
    const host = c.req.header('x-forwarded-host') || c.req.header('host');
    if (!origin || !host) return c.text('Forbidden', 403);
    try {
      if (new URL(origin).host !== host.split(',')[0].trim()) return c.text('Forbidden', 403);
    } catch {
      return c.text('Forbidden', 403);
    }
    return next();
  };
}
