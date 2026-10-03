/**
 * Content seeding for git-based deployment.
 *
 * On the server, live content lives outside git (./live/content, mounted into the container)
 * so `git pull` never clashes with edits made in the admin. The Docker image carries the
 * repository's content as a seed (SEED_DIR). On every start, files from the seed that have
 * NEVER been seeded before are copied in:
 *   - first start: the live folder is filled with the repository's content
 *   - later: pages newly added to the repository appear, while admin edits are never
 *     overwritten and pages deleted in the admin are not brought back.
 * The list of seeded files is kept in <content>/.seeded.json.
 */
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';

export async function seedContent(seedDir, targetDir) {
  if (!seedDir || !existsSync(seedDir)) return { added: [] };
  await mkdir(targetDir, { recursive: true });
  const manifestPath = join(targetDir, '.seeded.json');
  const seeded = new Set(JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '[]')));
  const added = [];

  async function walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const src = join(dir, e.name);
      if (e.isDirectory()) {
        await walk(src);
        continue;
      }
      const rel = relative(seedDir, src);
      if (rel === '.seeded.json' || seeded.has(rel)) continue;
      const dest = join(targetDir, rel);
      if (!existsSync(dest)) {
        await mkdir(dirname(dest), { recursive: true });
        await copyFile(src, dest);
        added.push(rel);
      }
      seeded.add(rel);
    }
  }
  await walk(seedDir);
  await writeFile(manifestPath, JSON.stringify([...seeded].sort(), null, 2) + '\n');
  return { added };
}
