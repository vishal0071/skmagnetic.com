/**
 * SK Enterprises brand kit.
 * The emblem: a navy oval with a red "S", a white "K" and a yellow lightning bolt
 * (the charging pulse) between them. The artwork is scripts/brand-source/sk-emblem.png;
 * emblem() cuts it out of its white background so it works on any colour.
 * Wordmark letters are outlined from Archivo so files render identically everywhere.
 */
import { readFileSync } from 'node:fs';
import opentype from 'opentype.js';
import sharp from 'sharp';

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
  navy: '#012d5d',
  red: '#c62a1f',
  redLight: '#ff5a4e',
  muted: '#546474',
};

const EMBLEM_SOURCE = new URL('./brand-source/sk-emblem.png', import.meta.url).pathname;

/**
 * The emblem as a transparent PNG trimmed to the oval → { png, width, height }.
 * Background = near-white pixels connected to the image edge, so the white K inside
 * the oval stays opaque. The oval's anti-aliased rim is un-blended from white.
 */
export async function emblem() {
  const { data, info } = await sharp(EMBLEM_SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const N = W * H;

  const bg = new Uint8Array(N);
  const isWhite = (i) => Math.min(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) >= 235;
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || !isWhite(i)) continue;
    bg[i] = 1;
    const x = i % W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (i >= W) stack.push(i - W);
    if (i < N - W) stack.push(i + W);
  }
  const nearBg = (i) => {
    const x = i % W;
    const y = (i - x) / W;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < W && yy >= 0 && yy < H && bg[yy * W + xx]) return true;
      }
    return false;
  };

  const navy = [1, 45, 93];
  const out = Buffer.alloc(N * 4);
  let [x0, y0, x1, y1] = [W, H, 0, 0];
  for (let i = 0; i < N; i++) {
    let rgb = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
    let a = 1;
    if (bg[i]) a = 0;
    else if (nearBg(i)) {
      a = Math.min(1, Math.max(0, (765 - rgb[0] - rgb[1] - rgb[2]) / (765 - navy[0] - navy[1] - navy[2])));
      rgb = rgb.map((c) => Math.min(255, Math.max(0, Math.round((c - (1 - a) * 255) / (a || 1)))));
    }
    out.set([...rgb, Math.round(a * 255)], i * 4);
    if (a > 0) {
      const x = i % W;
      const y = (i - x) / W;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  const width = x1 - x0 + 1;
  const height = y1 - y0 + 1;
  const png = await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width, height })
    .png()
    .toBuffer();
  return { png, width, height };
}

/**
 * Horizontal lockup: emblem + SK ENTERPRISES + descriptor. variant 'light' for dark backgrounds.
 * `mark` is { uri, width, height } for the emblem PNG (a data: URI).
 */
export function lockupSvg({ mark, variant = 'dark', tagline = 'MAGNETIZER MANUFACTURER' }) {
  const onDark = variant === 'light';
  const mh = 64;
  const mw = Math.round((mark.width / mark.height) * mh);
  const tx = 4 + mw + 16;
  const SK = text(fonts.xb, 'SK', tx, 46, 40, onDark ? colors.redLight : colors.red);
  const M = text(fonts.bd, 'ENTERPRISES', tx + SK.width + 10, 46, 40, onDark ? '#ffffff' : colors.ink, 1.2);
  const tag = text(fonts.sb, tagline, tx + 2, 70, 12.5, onDark ? '#9fb0c0' : colors.muted, 1.9);
  const w = Math.ceil(tx + SK.width + 10 + M.width + 8);
  return {
    width: w,
    height: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 80" width="${w}" height="80"><image x="4" y="8" width="${mw}" height="${mh}" href="${mark.uri}"/>${SK.svg}${M.svg}${tag.svg}</svg>`,
  };
}
