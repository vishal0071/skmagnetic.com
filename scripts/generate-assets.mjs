/**
 * Generates the brand kit (public/brand), favicons, app icons, logo.png,
 * the inline header mark (src/assets/brand/mark.svg) and the default social
 * share image (public/og/og-default.png). Run: npm run assets
 */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { renderIllustration } from '../src/lib/illustrations.ts';
import { colors, fonts, lockupSvg, markInner, markSvg, text } from './brand.mjs';

const pub = new URL('../public/', import.meta.url);
const file = (rel) => new URL(rel, pub).pathname;
await mkdir(new URL('og/', pub), { recursive: true });
await mkdir(new URL('brand/', pub), { recursive: true });
await mkdir(new URL('../src/assets/brand/', import.meta.url), { recursive: true });

// --- Brand kit -------------------------------------------------------------
const dark = lockupSvg({ variant: 'dark' });
const light = lockupSvg({ variant: 'light' });
await writeFile(file('brand/sk-enterprises-logo.svg'), dark.svg);
await writeFile(file('brand/sk-enterprises-logo-white.svg'), light.svg);
await writeFile(file('brand/sk-enterprises-mark.svg'), markSvg());
const big = (svg, w, h, scale) => svg.replace(`width="${w}" height="${h}"`, `width="${w * scale}" height="${h * scale}"`);
await sharp(Buffer.from(big(dark.svg, dark.width, dark.height, 4))).png().toFile(file('brand/sk-enterprises-logo.png'));
await sharp(Buffer.from(big(light.svg, light.width, light.height, 4)))
  .flatten({ background: colors.ink })
  .png()
  .toFile(file('brand/sk-enterprises-logo-on-dark.png'));
await sharp(Buffer.from(markSvg())).resize(1024, 1024).png().toFile(file('brand/sk-enterprises-mark-1024.png'));

// Inline mark for the site header (no background → header supplies it)
await writeFile(new URL('../src/assets/brand/mark.svg', import.meta.url), markSvg());

// --- Favicons & icons ----------------------------------------------------------
await writeFile(file('favicon.svg'), markSvg());
const png = (svg, size, out) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(file(out));
await png(markSvg(), 96, 'favicon-96x96.png');
await png(markSvg({ rounded: false }), 180, 'apple-touch-icon.png');
await png(markSvg(), 192, 'icon-192.png');
await png(markSvg(), 512, 'icon-512.png');
await png(markSvg(), 512, 'logo.png');

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
const brand = text(fonts.xb, 'SK', 0, 0, 40, colors.redLight);
const h1a = text(fonts.xb, 'Industrial Magnetizers &', 72, 296, 48, '#ffffff', -0.4);
const h1b = text(fonts.xb, 'Magnet Charging Machines', 72, 354, 48, '#ffffff', -0.4);
const sub = text(fonts.sb, 'Magnetizers · Coils · Fixtures — Manufacturer', 72, 412, 23, '#a9b6c3');
const foot = text(fonts.sb, 'Manufactured in Maharashtra, India  ·  skmagnetic.com', 72, 552, 24, '#dbe3ea');
const SK = text(fonts.xb, 'SK', 168, 128, 40, colors.redLight);
const MAG = text(fonts.bd, 'ENTERPRISES', 168 + SK.width + 10, 128, 40, '#ffffff', 1.2);
void brand;

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><radialGradient id="glow" cx="78%" cy="52%" r="45%"><stop offset="0" stop-color="#c62a1f" stop-opacity=".35"/><stop offset="1" stop-color="#c62a1f" stop-opacity="0"/></radialGradient></defs>
  <rect width="1200" height="630" fill="${colors.ink}"/>${grid}
  <rect width="1200" height="630" fill="url(#glow)"/>${field}
  <g transform="translate(756 160) scale(1.0)"><rect width="400" height="300" rx="20" fill="#f5f7f9"/>${renderIllustration('magnetizer')}</g>
  <g transform="translate(72 74) scale(1.25)"><rect x="-1" y="-1" width="66" height="66" rx="15" fill="#1d2c3a"/>${markInner()}</g>
  ${SK.svg}${MAG.svg}
  ${h1a.svg}${h1b.svg}${sub.svg}
  <rect x="72" y="500" width="48" height="4" fill="${colors.red}"/>
  ${foot.svg}
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(file('og/og-default.png'));
console.log('Brand kit, icons and social image generated.');
