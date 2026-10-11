/**
 * Generates the brand kit (public/brand), favicons, app icons, logo.png,
 * the header/footer emblem (src/assets/brand/emblem.png), the admin emblem and
 * the default social share image (public/og/og-default.png) from the emblem
 * artwork in scripts/brand-source/sk-emblem.png. Run: npm run assets
 */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { renderIllustration } from '../src/lib/illustrations.ts';
import { colors, emblem, fonts, lockupSvg, text } from './brand.mjs';

const pub = new URL('../public/', import.meta.url);
const file = (rel) => new URL(rel, pub).pathname;
await mkdir(new URL('og/', pub), { recursive: true });
await mkdir(new URL('brand/', pub), { recursive: true });
await mkdir(new URL('../src/assets/brand/', import.meta.url), { recursive: true });

const em = await emblem();
const mark = { uri: `data:image/png;base64,${em.png.toString('base64')}`, width: em.width, height: em.height };
const markImg = (x, y, h) => `<image x="${x}" y="${y}" width="${Math.round((mark.width / mark.height) * h)}" height="${h}" href="${mark.uri}"/>`;

// --- Brand kit -------------------------------------------------------------
await writeFile(file('brand/sk-enterprises-emblem.png'), em.png);
const dark = lockupSvg({ mark, variant: 'dark' });
const light = lockupSvg({ mark, variant: 'light' });
const big = (svg, w, h, scale) => svg.replace(`width="${w}" height="${h}"`, `width="${w * scale}" height="${h * scale}"`);
await sharp(Buffer.from(big(dark.svg, dark.width, dark.height, 4))).png().toFile(file('brand/sk-enterprises-logo.png'));
await sharp(Buffer.from(big(light.svg, light.width, light.height, 4)))
  .flatten({ background: colors.ink })
  .png()
  .toFile(file('brand/sk-enterprises-logo-on-dark.png'));

// Emblem for the site header/footer (Astro resizes it) and the admin panel
await sharp(em.png).resize({ width: 480 }).png().toFile(new URL('../src/assets/brand/emblem.png', import.meta.url).pathname);
await sharp(em.png).resize({ height: 68 }).png().toFile(new URL('../admin/public/emblem.png', import.meta.url).pathname);

// --- Favicons & icons ----------------------------------------------------------
// Square icons: the emblem on a navy square, so the oval merges into the background
const iconSvg = ({ rounded = true } = {}) => {
  const s = Math.round(mark.width * 0.94);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}"><rect width="${s}" height="${s}" rx="${rounded ? Math.round(s * 0.2) : 0}" fill="${colors.navy}"/><image x="${Math.round((s - mark.width) / 2)}" y="${Math.round((s - mark.height) / 2)}" width="${mark.width}" height="${mark.height}" href="${mark.uri}"/></svg>`;
};
const png = (svg, size, out) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(file(out));
await png(iconSvg(), 32, 'favicon-32x32.png');
await png(iconSvg(), 96, 'favicon-96x96.png');
await png(iconSvg({ rounded: false }), 180, 'apple-touch-icon.png');
await png(iconSvg(), 192, 'icon-192.png');
await png(iconSvg(), 512, 'icon-512.png');
await png(iconSvg({ rounded: false }), 1024, 'brand/sk-enterprises-icon-1024.png');
// Organisation logo for search engines (schema.org): the full emblem on a transparent square
const ls = Math.round(mark.width * 1.08);
await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ls} ${ls}" width="${ls}" height="${ls}">${markImg(Math.round((ls - mark.width) / 2), Math.round((ls - mark.height) / 2), mark.height)}</svg>`, 512, 'logo.png');

// --- Social share image (1200×630) ----------------------------------------------
const grid =
  Array.from({ length: 31 }, (_, i) => `<path d="M${i * 40} 0V630" stroke="rgba(255,255,255,.035)"/>`).join('') +
  Array.from({ length: 16 }, (_, i) => `<path d="M0 ${i * 40}H1200" stroke="rgba(255,255,255,.035)"/>`).join('');
const field = [160, 240, 320, 400, 480]
  .map(
    (r, i) =>
      `<ellipse cx="930" cy="330" rx="${r * 1.3}" ry="${r}" fill="none" stroke="${i % 2 ? 'rgba(255,107,94,.16)' : 'rgba(143,163,184,.14)'}" stroke-width="1.5" ${i % 2 ? 'stroke-dasharray="3 10"' : ''}/>`,
  )
  .join('');
const h1a = text(fonts.xb, 'Industrial Magnetizers &', 72, 296, 48, '#ffffff', -0.4);
const h1b = text(fonts.xb, 'Magnetic Instruments', 72, 354, 48, '#ffffff', -0.4);
const sub = text(fonts.sb, 'Magnetizers · Coils · Fixtures — Manufacturer', 72, 412, 23, '#a9b6c3');
const foot = text(fonts.sb, 'Manufactured in Maharashtra, India  ·  skmagnetic.com', 72, 552, 24, '#dbe3ea');
const ogMarkH = 92;
const SK = text(fonts.xb, 'SK', 72 + Math.round((mark.width / mark.height) * ogMarkH) + 20, 128, 40, colors.redLight);
const MAG = text(fonts.bd, 'ENTERPRISES', 72 + Math.round((mark.width / mark.height) * ogMarkH) + 20 + SK.width + 10, 128, 40, '#ffffff', 1.2);

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><radialGradient id="glow" cx="78%" cy="52%" r="45%"><stop offset="0" stop-color="#c62a1f" stop-opacity=".35"/><stop offset="1" stop-color="#c62a1f" stop-opacity="0"/></radialGradient></defs>
  <rect width="1200" height="630" fill="${colors.ink}"/>${grid}
  <rect width="1200" height="630" fill="url(#glow)"/>${field}
  <g transform="translate(756 160) scale(1.0)"><rect width="400" height="300" rx="20" fill="#f5f7f9"/>${renderIllustration('magnetizer')}</g>
  ${markImg(72, 114 - ogMarkH / 2, ogMarkH)}
  ${SK.svg}${MAG.svg}
  ${h1a.svg}${h1b.svg}${sub.svg}
  <rect x="72" y="500" width="48" height="4" fill="${colors.red}"/>
  ${foot.svg}
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(file('og/og-default.png'));
console.log('Brand kit, icons and social image generated.');
