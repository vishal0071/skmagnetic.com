/**
 * Post-build SEO & link audit. Run after `npm run build`:  npm run check:site
 *  - every internal link / asset points to a file that exists in dist/
 *  - every page has exactly one <h1>, a <title>, a meta description and a canonical
 *  - titles and meta descriptions are unique across pages
 *  - every <img> has an alt attribute
 */
import { auditSite } from './lib/audit.mjs';

const report = await auditSite(new URL('../dist/', import.meta.url).pathname);
console.log(`Checked ${report.pageCount} pages (${report.indexableCount} indexable) and ${report.linkCount} internal URLs.`);
if (report.warnings.length) console.log(`\n${report.warnings.length} warning(s):\n- ` + report.warnings.join('\n- '));
if (report.problems.length) {
  console.log(`\n${report.problems.length} problem(s):\n- ` + report.problems.join('\n- '));
  process.exit(1);
}
console.log('\nNo problems found.');
