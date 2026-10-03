/**
 * SK Enterprises brand kit.
 * The mark: "S" and "K" as the two poles of a magnet, a charging pulse (bolt)
 * between them and field lines around — magnetizing / magnet charging machines.
 * Letters are outlined from Archivo ExtraBold so files render identically everywhere.
 */
import { readFileSync } from 'node:fs';
import opentype from 'opentype.js';

const load = (w) => {
  const b = readFileSync(new URL(`../node_modules/@expo-google-fonts/archivo/${w}/Archivo_${w}.ttf`, import.meta.url));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
export const fonts = { xb: load('800ExtraBold'), bd: load('700Bold'), sb: load('600SemiBold') };

const n = (v) => Number(v.toFixed(2)).toString();
const pathData = (p) =>
  p.commands
    .map((c) =>
      c.type === 'Z'
        ? 'Z'
        : c.type === 'Q'
          ? `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
          : c.type === 'C'
            ? `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
            : `${c.type}${n(c.x)} ${n(c.y)}`,
    )
    .join('');

/** Outlined text → { svg, width } */
export function text(font, str, x, y, size, fill, tracking = 0) {
  let d = '';
  let cx = x;
  for (const ch of str) {
    const g = font.charToGlyph(ch);
    d += pathData(g.getPath(cx, y, size));
    cx += (g.advanceWidth / font.unitsPerEm) * size + tracking;
  }
  return { svg: `<path fill="${fill}" d="${d}"/>`, width: cx - x - tracking };
}

export const colors = {
  ink: '#0b141d',
  red: '#c62a1f',
  redLight: '#ff5a4e',
  steel: '#d6e0ea',
  field: '#8fa3b8',
  bolt: '#ffb21f',
  muted: '#546474',
};

/** The mark on a 64×64 grid (no outer <svg>). */
export function markInner({ bg = colors.ink, rounded = true } = {}) {
  const size = 31;
  const S = text(fonts.xb, 'S', 0, 0, size, '#000');
  const K = text(fonts.xb, 'K', 0, 0, size, '#000');
  const gap = 12;
  const x0 = (64 - (S.width + gap + K.width)) / 2;
  const base = 43;
  const s = text(fonts.xb, 'S', x0, base, size, colors.redLight);
  const k = text(fonts.xb, 'K', x0 + S.width + gap, base, size, colors.steel);
  const bx = x0 + S.width + gap / 2;
  return (
    (bg ? `<rect width="64" height="64" rx="${rounded ? 14 : 0}" fill="${bg}"/>` : '') +
    `<path d="M${n(x0 + 2)} 15.5Q32 3.5 ${n(64 - x0 - 2)} 15.5" fill="none" stroke="${colors.field}" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>` +
    `<path d="M${n(x0 + 2)} 48.5Q32 60.5 ${n(64 - x0 - 2)} 48.5" fill="none" stroke="${colors.field}" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>` +
    s.svg +
    k.svg +
    `<path d="M${n(bx + 2.8)} 16.5L${n(bx - 4.2)} 33H${n(bx + 0.2)}L${n(bx - 2)} 46.5L${n(bx + 5.4)} 29.5H${n(bx + 1.1)}L${n(bx + 4)} 16.5Z" fill="${colors.bolt}"/>`
  );
}

export const markSvg = (opts) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${markInner(opts)}</svg>`;

/** Horizontal lockup: mark + SK ENTERPRISES + descriptor. variant 'light' for dark backgrounds. */
export function lockupSvg({ variant = 'dark', tagline = 'MAGNETIZER MANUFACTURER' } = {}) {
  const onDark = variant === 'light';
  const SK = text(fonts.xb, 'SK', 84, 46, 40, onDark ? colors.redLight : colors.red);
  const M = text(fonts.bd, 'ENTERPRISES', 84 + SK.width + 10, 46, 40, onDark ? '#ffffff' : colors.ink, 1.2);
  const tag = text(fonts.sb, tagline, 86, 70, 12.5, onDark ? '#9fb0c0' : colors.muted, 1.9);
  const w = Math.ceil(84 + SK.width + 10 + M.width + 8);
  return {
    width: w,
    height: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 80" width="${w}" height="80" role="img" aria-label="SK Enterprises — Magnetizer Manufacturer"><title>SK Enterprises</title><g transform="translate(4 8)">${markInner()}</g>${SK.svg}${M.svg}${tag.svg}</svg>`,
  };
}
