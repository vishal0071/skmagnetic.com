/**
 * Publishing: run `astro build`, copy dist/ into SITE_ROOT/releases/<id>, then switch the
 * SITE_ROOT/current symlink in one atomic rename. nginx serves SITE_ROOT/current, so
 * visitors never see a half-built site. Older releases are kept for one-click rollback.
 */
import { spawn } from 'node:child_process';
import { cp, mkdir, readdir, readFile, readlink, rename, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { DATA_DIR, KEEP_RELEASES, PROJECT_DIR, SITE_ROOT } from './config.mjs';
import { auditSite } from '../../scripts/lib/audit.mjs';

const require = createRequire(import.meta.url);
const RELEASES = join(SITE_ROOT, 'releases');
const CURRENT = join(SITE_ROOT, 'current');
const REPORT = join(DATA_DIR, 'seo-report.json');
const MAX_LOG = 200_000;

const state = { running: false, status: 'idle', startedAt: null, finishedAt: null, log: '', error: '', release: null, reason: '' };
export const publishState = () => ({ ...state });

function astroBin() {
  const pkg = require(resolve(PROJECT_DIR, 'node_modules/astro/package.json'));
  const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin.astro;
  return resolve(PROJECT_DIR, 'node_modules/astro', bin);
}

function run(cmd, args, opts) {
  return new Promise((resolvePromise) => {
    const child = spawn(cmd, args, { ...opts, stdio: ['ignore', 'pipe', 'pipe'] });
    const add = (chunk) => {
      state.log += chunk.toString().replace(/\x1b\[[0-9;]*m/g, '');
      if (state.log.length > MAX_LOG) state.log = state.log.slice(-MAX_LOG);
    };
    child.stdout.on('data', add);
    child.stderr.on('data', add);
    child.on('close', (code) => resolvePromise(code));
    child.on('error', (err) => {
      add(`\n${err.message}\n`);
      resolvePromise(1);
    });
  });
}

export async function currentRelease() {
  return (await readlink(CURRENT).catch(() => null))?.split('/').pop() || null;
}

export async function listReleases() {
  const names = (await readdir(RELEASES).catch(() => [])).filter((n) => /^\d{8}-\d{6}/.test(n)).sort().reverse();
  const current = await currentRelease();
  return names.map((id) => ({ id, current: id === current }));
}

async function activate(id) {
  const tmp = join(SITE_ROOT, `.current-${process.pid}`);
  await rm(tmp, { force: true });
  await symlink(join('releases', id), tmp);
  await rename(tmp, CURRENT); // atomic switch
}

async function prune() {
  const all = await listReleases();
  for (const r of all.slice(KEEP_RELEASES)) if (!r.current) await rm(join(RELEASES, r.id), { recursive: true, force: true });
}

const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);

/** Start a publish. Returns false if one is already running. */
export function publish(reason = 'manual') {
  if (state.running) return false;
  Object.assign(state, { running: true, status: 'building', startedAt: new Date().toISOString(), finishedAt: null, log: '', error: '', reason });
  (async () => {
    try {
      const code = await run(process.execPath, [astroBin(), 'build'], {
        cwd: PROJECT_DIR,
        env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', NODE_ENV: 'production' },
      });
      if (code !== 0) throw new Error('The website build failed — see the log below. The live site has not changed.');
      state.status = 'releasing';
      const id = stamp();
      await mkdir(RELEASES, { recursive: true });
      await cp(join(PROJECT_DIR, 'dist'), join(RELEASES, id), { recursive: true });
      await activate(id);
      await prune();
      state.release = id;
      state.status = 'auditing';
      const report = await auditSite(join(RELEASES, id));
      await mkdir(DATA_DIR, { recursive: true });
      await writeFile(REPORT, JSON.stringify({ release: id, ...report }, null, 2));
      state.status = 'success';
      state.log += `\n✓ Published release ${id}.\n`;
    } catch (err) {
      state.status = 'failed';
      state.error = err.message;
    } finally {
      state.running = false;
      state.finishedAt = new Date().toISOString();
      await writeFile(join(DATA_DIR, 'last-publish.json'), JSON.stringify(publishState(), null, 2)).catch(() => {});
    }
  })();
  return true;
}

export async function rollback(id) {
  if (!/^\d{8}-\d{6}$/.test(id)) throw new Error('Invalid release');
  await stat(join(RELEASES, id));
  await activate(id);
}

export async function seoReport() {
  return JSON.parse(await readFile(REPORT, 'utf8').catch(() => 'null'));
}

export async function lastPublish() {
  if (state.startedAt) return publishState();
  return JSON.parse(await readFile(join(DATA_DIR, 'last-publish.json'), 'utf8').catch(() => 'null'));
}
