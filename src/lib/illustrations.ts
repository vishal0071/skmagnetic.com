/**
 * Isometric product illustrations, generated as inline SVG at build time.
 * These stand in for product photography until real photos are supplied —
 * add images to a product's `images` field and they replace the illustration.
 */

type Pt = [number, number];
type V3 = [number, number, number];
interface Mat {
  top: string;
  side: string;
  dark: string;
}

const MATS = {
  nickel: { top: '#f1f4f7', side: '#c6ced6', dark: '#8e9aa6' },
  ferrite: { top: '#767c85', side: '#555b63', dark: '#353a40' },
  steel: { top: '#f6f8fa', side: '#d2d9e0', dark: '#9ba7b3' },
  darksteel: { top: '#8a949e', side: '#5f6872', dark: '#3d454e' },
  red: { top: '#e5584c', side: '#c62a1f', dark: '#8f1c14' },
  rubber: { top: '#3b4249', side: '#262c32', dark: '#15191d' },
  copper: { top: '#efb07c', side: '#c97a43', dark: '#8a4a20' },
  cabinet: { top: '#f3f5f8', side: '#dfe5eb', dark: '#b4bfca' },
} satisfies Record<string, Mat>;

const COS = Math.cos(Math.PI / 6);
const iso = ([x, y, z]: V3): Pt => [(x - y) * COS, (x + y) * 0.5 - z];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const f = (n: number) => (Math.round(n * 10) / 10).toString();
const pts = (p: Pt[]) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');

function hull(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
    lower.push(pt);
  }
  const upper: Pt[] = [];
  for (const pt of p.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
    upper.push(pt);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

class Scene {
  parts: string[] = [];
  defs: string[] = [];
  all: Pt[] = [];
  ground: Pt[] = [];
  private g = 0;
  private id: string;
  constructor(id: string) {
    this.id = id;
  }

  private grad(x1: number, y1: number, x2: number, y2: number, m: Mat) {
    const gid = `${this.id}g${this.g++}`;
    this.defs.push(
      `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">` +
        `<stop offset="0" stop-color="${m.side}"/><stop offset=".28" stop-color="${m.top}"/>` +
        `<stop offset=".62" stop-color="${m.side}"/><stop offset="1" stop-color="${m.dark}"/></linearGradient>`,
    );
    return `url(#${gid})`;
  }

  private track(points: Pt[], ground = false) {
    this.all.push(...points);
    if (ground) this.ground.push(...points);
  }

  poly(points: Pt[], fill: string, stroke = 'rgba(11,20,29,.16)') {
    this.track(points);
    this.parts.push(`<polygon points="${pts(points)}" fill="${fill}" stroke="${stroke}" stroke-width="1" stroke-linejoin="round"/>`);
  }

  line(a: V3, b: V3, stroke: string, width = 1.5) {
    const [p, q] = [iso(a), iso(b)];
    this.parts.push(`<line x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(q[0])}" y2="${f(q[1])}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`);
  }

  /** Axis-aligned box. Visible faces: top, +x (right), +y (left). */
  box([x, y, z]: V3, [w, d, h]: V3, m: Mat) {
    const P = (a: number, b: number, c: number) => iso([a, b, c]);
    const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    const right = [P(x + w, y + d, z), P(x + w, y, z), P(x + w, y, z + h), P(x + w, y + d, z + h)];
    const top = [P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y, z + h), P(x, y, z + h)];
    if (z === 0) this.track([P(x, y, 0), P(x + w, y, 0), P(x + w, y + d, 0), P(x, y + d, 0)], true);
    this.poly(left, m.side);
    this.poly(right, m.dark);
    this.poly(top, m.top);
    // crisp highlight on the front top edge
    this.parts.push(`<polyline points="${pts([top[0], top[1], top[2]])}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>`);
  }

  circle3(c: V3, u: V3, v: V3, r: number, n = 48): Pt[] {
    const out: Pt[] = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      out.push(iso(add(c, add(mul(u, r * Math.cos(t)), mul(v, r * Math.sin(t))))));
    }
    return out;
  }

  /** Cylinder along an axis ('x' | 'z'). Draws body + the end cap facing the viewer. */
  cylinder(base: V3, axis: 'x' | 'z', len: number, r: number, m: Mat, capFill?: string) {
    const ax: V3 = axis === 'z' ? [0, 0, 1] : [1, 0, 0];
    const [u, v]: [V3, V3] = axis === 'z' ? [[1, 0, 0], [0, 1, 0]] : [[0, 1, 0], [0, 0, 1]];
    const end = add(base, mul(ax, len));
    const c0 = this.circle3(base, u, v, r);
    const c1 = this.circle3(end, u, v, r);
    const h = hull([...c0, ...c1]);
    this.track(h, axis === 'z' && base[2] === 0);
    if (axis === 'z' && base[2] === 0) this.track(c0, true);
    // gradient perpendicular to the on-screen axis
    const a0 = iso(base);
    const a1 = iso(end);
    let px = -(a1[1] - a0[1]);
    let py = a1[0] - a0[0];
    const L = Math.hypot(px, py) || 1;
    px /= L;
    py /= L;
    if (px > 0 || (px === 0 && py > 0)) {
      px = -px;
      py = -py;
    }
    const mid: Pt = [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2];
    const R = r * 1.25;
    const fill = this.grad(mid[0] + px * R, mid[1] + py * R, mid[0] - px * R, mid[1] - py * R, m);
    this.poly(h, fill);
    this.poly(c1, capFill ?? m.top);
    return { end, cap: c1 };
  }

  /** Flat ellipse lying on a horizontal plane (z) — for faces on top of cylinders. */
  disc(c: V3, r: number, fill: string, stroke = 'rgba(11,20,29,.18)') {
    const p = this.circle3(c, [1, 0, 0], [0, 1, 0], r);
    this.parts.push(`<polygon points="${pts(p)}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`);
  }

  /** Vertical ring with a through hole, looking into the bore. */
  ring(c: V3, r: number, ri: number, h: number, m: Mat) {
    this.cylinder(c, 'z', h, r, m);
    const top: V3 = [c[0], c[1], c[2] + h];
    const hole = this.circle3(top, [1, 0, 0], [0, 1, 0], ri);
    const floor = this.circle3(c, [1, 0, 0], [0, 1, 0], ri);
    const cid = `${this.id}c${this.g++}`;
    this.defs.push(`<clipPath id="${cid}"><polygon points="${pts(hole)}"/></clipPath>`);
    const toPath = (p: Pt[]) => `M${p.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;
    const [hx0] = [Math.min(...hole.map((p) => p[0]))];
    const hx1 = Math.max(...hole.map((p) => p[0]));
    const gid = `${this.id}g${this.g++}`;
    this.defs.push(
      `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${f(hx0)}" y1="0" x2="${f(hx1)}" y2="0"><stop offset="0" stop-color="${m.dark}"/><stop offset=".55" stop-color="${m.side}"/><stop offset="1" stop-color="${m.top}"/></linearGradient>`,
    );
    this.parts.push(
      `<g clip-path="url(#${cid})"><path d="${toPath(hole)}${toPath(floor)}" fill-rule="evenodd" fill="url(#${gid})"/></g>`,
      `<polygon points="${pts(hole)}" fill="none" stroke="rgba(11,20,29,.22)" stroke-width="1"/>`,
    );
  }

  /** Rectangle on the visible +y (front-left) face of a box at depth y. */
  faceRect(y: number, x0: number, z0: number, x1: number, z1: number, fill: string, stroke = 'rgba(11,20,29,.25)') {
    const p = [iso([x0, y, z0]), iso([x1, y, z0]), iso([x1, y, z1]), iso([x0, y, z1])];
    this.parts.push(`<polygon points="${pts(p)}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`);
  }

  /** Circle drawn on the +y face (vertical plane) — knobs, buttons, lamps. */
  faceDot(c: V3, r: number, fill: string) {
    const p = this.circle3(c, [1, 0, 0], [0, 0, 1], r, 28);
    this.parts.push(`<polygon points="${pts(p)}" fill="${fill}" stroke="rgba(11,20,29,.3)" stroke-width="1"/>`);
  }

  /** Annulus sector lying on a horizontal plane — pole segments. */
  sector(c: V3, r0: number, r1: number, a0: number, a1: number, fill: string) {
    const steps = 10;
    const out: Pt[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = a0 + ((a1 - a0) * i) / steps;
      out.push(iso([c[0] + r1 * Math.cos(t), c[1] + r1 * Math.sin(t), c[2]]));
    }
    for (let i = steps; i >= 0; i--) {
      const t = a0 + ((a1 - a0) * i) / steps;
      out.push(iso([c[0] + r0 * Math.cos(t), c[1] + r0 * Math.sin(t), c[2]]));
    }
    this.parts.push(`<polygon points="${pts(out)}" fill="${fill}" stroke="rgba(11,20,29,.2)" stroke-width=".8"/>`);
  }

  /** Free polyline in 3D (cables). */
  path3(points: V3[], stroke: string, width: number) {
    const p = points.map(iso);
    this.track(p);
    this.parts.push(`<polyline points="${pts(p)}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  /** Tube drawn as a thick stroked loop — used for lifting eyes. */
  loop(c: V3, u: V3, v: V3, r: number, color: string, width: number) {
    const p = this.circle3(c, u, v, r, 40);
    this.track(p);
    this.parts.push(
      `<polygon points="${pts(p)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round"/>`,
      `<polygon points="${pts(p)}" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="${width * 0.22}" transform="translate(-1 -1.5)"/>`,
    );
  }

  render(viewW = 400, viewH = 300, pad = 44, field = false) {
    const xs = this.all.map((p) => p[0]);
    const ys = this.all.map((p) => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const w = maxX - minX;
    const h = maxY - minY;
    const s = Math.min((viewW - pad * 2) / w, (viewH - pad * 2) / h);
    const tx = (viewW - w * s) / 2 - minX * s;
    const ty = (viewH - h * s) / 2 - minY * s;

    const g = this.ground.length ? this.ground : this.all;
    const gx = g.map((p) => p[0]);
    const gy = g.map((p) => p[1]);
    const gcx = (Math.min(...gx) + Math.max(...gx)) / 2;
    const gcy = (Math.min(...gy) + Math.max(...gy)) / 2;
    const grx = (Math.max(...gx) - Math.min(...gx)) * 0.58;
    const gry = (Math.max(...gy) - Math.min(...gy)) * 0.62;

    const sid = `${this.id}sh`;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const fieldLines = field
      ? [0.62, 0.78, 0.96]
          .map(
            (k, i) =>
              `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(w * k)}" ry="${f(h * k * 0.7)}" fill="none" stroke="${i === 1 ? 'rgba(198,42,31,.16)' : 'rgba(27,79,143,.14)'}" stroke-width="${f(1.2 / s)}" stroke-dasharray="${f(3 / s)} ${f(7 / s)}"/>`,
          )
          .join('')
      : '';

    return (
      `<defs><radialGradient id="${sid}"><stop offset="0" stop-color="#0b141d" stop-opacity=".22"/><stop offset="1" stop-color="#0b141d" stop-opacity="0"/></radialGradient>${this.defs.join('')}</defs>` +
      `<g transform="translate(${f(tx)} ${f(ty)}) scale(${s.toFixed(4)})">` +
      fieldLines +
      `<ellipse cx="${f(gcx)}" cy="${f(gcy + 6)}" rx="${f(grx)}" ry="${f(gry)}" fill="url(#${sid})"/>` +
      this.parts.join('') +
      `</g>`
    );
  }
}

/** 2D (oblique) horseshoe — the classic alnico shape. */
function horseshoe(id: string, viewW = 400, viewH = 300) {
  const cx = 200;
  const cy = 118;
  const R = 92;
  const r = 44;
  const L = 96;
  const shape = (dx: number, dy: number) =>
    `M${cx - R + dx} ${cy + dy}A${R} ${R} 0 0 1 ${cx + R + dx} ${cy + dy}L${cx + R + dx} ${cy + L + dy}L${cx + r + dx} ${cy + L + dy}L${cx + r + dx} ${cy + dy}A${r} ${r} 0 0 0 ${cx - r + dx} ${cy + dy}L${cx - r + dx} ${cy + L + dy}L${cx - R + dx} ${cy + L + dy}Z`;
  const depth = Array.from({ length: 14 }, (_, i) => 14 - i)
    .map((i) => `<path d="${shape(i * 1.1, -i * 0.8)}" fill="#8f1c14"/>`)
    .join('');
  const tip = (x: number) =>
    `<rect x="${x}" y="${cy + L - 30}" width="${R - r}" height="30" fill="url(#${id}t)"/>` +
    `<rect x="${x}" y="${cy + L - 30}" width="${R - r}" height="2" fill="rgba(11,20,29,.25)"/>`;
  return (
    `<defs><linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ea6a5f"/><stop offset=".45" stop-color="#c62a1f"/><stop offset="1" stop-color="#a32118"/></linearGradient>` +
    `<linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c6ced6"/><stop offset=".35" stop-color="#f6f8fa"/><stop offset="1" stop-color="#9ba7b3"/></linearGradient>` +
    `<radialGradient id="${id}sh"><stop offset="0" stop-color="#0b141d" stop-opacity=".2"/><stop offset="1" stop-color="#0b141d" stop-opacity="0"/></radialGradient></defs>` +
    `<g transform="translate(0 -6)">` +

    `<ellipse cx="${cx + 8}" cy="${cy + L + 8}" rx="${R * 1.25}" ry="16" fill="url(#${id}sh)"/>` +
    depth +
    `<path d="${shape(0, 0)}" fill="url(#${id}r)" stroke="rgba(11,20,29,.2)"/>` +
    tip(cx - R) +
    tip(cx + r) +
    `<text x="${cx - (R + r) / 2}" y="${cy + L - 10}" text-anchor="middle" font-family="ui-sans-serif,system-ui" font-size="15" font-weight="700" fill="#0b141d">N</text>` +
    `<text x="${cx + (R + r) / 2}" y="${cy + L - 10}" text-anchor="middle" font-family="ui-sans-serif,system-ui" font-size="15" font-weight="700" fill="#0b141d">S</text>` +
    `<path d="M${cx - R + 10} ${cy - 8}A${R - 10} ${R - 10} 0 0 1 ${cx - 20} ${cy - R + 12}" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="4" stroke-linecap="round"/>` +
    `</g>`
  );
}

let counter = 0;

export type IllustrationKind =
  | 'magnetizer'
  | 'coil'
  | 'fixture'
  | 'rotor'
  | 'speaker'
  | 'housing'
  | 'block'
  | 'disc'
  | 'ring'
  | 'arc'
  | 'horseshoe'
  | 'pot'
  | 'rod'
  | 'grill'
  | 'plate'
  | 'lifter'
  | 'cluster';

export function renderIllustration(kind: IllustrationKind): string {
  const id = `il${(counter++).toString(36)}`;
  if (kind === 'horseshoe') return horseshoe(id);
  const sc = new Scene(id);
  const M = MATS;

  switch (kind) {
    case 'magnetizer': {
      // Control cabinet
      sc.box([0, 0, 0], [110, 82, 150], M.cabinet);
      sc.faceRect(82, 12, 20, 98, 138, '#1b2733');
      sc.faceRect(82, 20, 104, 66, 128, '#2ec4a6', 'rgba(255,255,255,.35)');
      sc.faceRect(82, 20, 90, 90, 95, '#3a4a5a', 'none');
      sc.faceDot([34, 82, 64], 8, '#e5483c');
      sc.faceDot([62, 82, 64], 8, '#2fbf71');
      sc.faceDot([84, 82, 116], 7, '#ffb21f');
      sc.faceRect(82, 24, 32, 86, 39, '#3a4a5a', 'none');
      // Cable to the coil fixture
      sc.path3([[110, 44, 46], [124, 50, 28], [138, 58, 20]], '#1b2733', 5);
      // Coil fixture on its stand
      sc.box([128, 30, 0], [84, 84, 16], M.darksteel);
      sc.ring([170, 72, 16], 32, 14, 30, M.copper);
      break;
    }
    case 'coil':
      sc.box([0, 0, 0], [150, 150, 18], M.darksteel);
      sc.ring([75, 75, 18], 58, 28, 54, M.copper);
      sc.disc([75, 75, 72], 44, 'none', 'rgba(255,255,255,.35)');
      sc.cylinder([128, 120, 18], 'z', 26, 6, M.steel);
      sc.cylinder([120, 132, 18], 'z', 26, 6, M.steel);
      break;
    case 'fixture': {
      sc.box([0, 0, 0], [170, 170, 66], M.darksteel);
      const c: V3 = [85, 85, 66];
      sc.disc(c, 56, '#1b2733');
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        sc.sector(c, 30, 52, a + 0.08, a + Math.PI / 4 - 0.08, i % 2 ? '#c9d5e1' : '#e5483c');
      }
      sc.ring([85, 85, 66], 26, 12, 16, M.ferrite);
      sc.cylinder([20, 150, 66], 'z', 14, 7, M.copper);
      sc.cylinder([150, 20, 66], 'z', 14, 7, M.copper);
      break;
    }
    case 'rotor': {
      sc.cylinder([0, 0, 0], 'z', 30, 9, M.steel);
      sc.cylinder([0, 0, 30], 'z', 74, 54, M.darksteel);
      const top: V3 = [0, 0, 104];
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        sc.sector(top, 36, 54, a + 0.05, a + Math.PI / 4 - 0.05, i % 2 ? '#c9d5e1' : '#e5483c');
      }
      sc.disc(top, 36, M.steel.side);
      sc.cylinder([0, 0, 104], 'z', 52, 9, M.steel);
      break;
    }
    case 'speaker':
      sc.cylinder([0, 0, 0], 'z', 10, 72, M.steel);
      sc.ring([0, 0, 10], 70, 34, 30, M.ferrite);
      sc.ring([0, 0, 40], 66, 30, 10, M.steel);
      sc.cylinder([0, 0, 10], 'z', 44, 22, M.steel);
      break;
    case 'housing': {
      sc.ring([0, 0, 0], 64, 54, 104, M.steel);
      const top: V3 = [0, 0, 104];
      sc.sector(top, 44, 54, Math.PI * 0.15, Math.PI * 0.85, '#4d5259');
      sc.sector(top, 44, 54, Math.PI * 1.15, Math.PI * 1.85, '#4d5259');
      break;
    }
    case 'block':
      sc.box([0, 0, 0], [170, 104, 50], M.nickel);
      sc.box([30, 150, 0], [86, 52, 26], M.nickel);
      break;
    case 'disc':
      sc.cylinder([0, 0, 0], 'z', 24, 66, M.nickel);
      sc.disc([0, 0, 24], 52, 'none', 'rgba(255,255,255,.55)');
      sc.cylinder([140, 70, 0], 'z', 18, 36, M.nickel);
      break;
    case 'ring':
    case 'arc':
      sc.ring([0, 0, 0], 74, 34, 30, M.ferrite);
      sc.ring([150, 62, 0], 38, 16, 20, M.ferrite);
      break;
    case 'pot': {
      sc.cylinder([0, 0, 0], 'z', 36, 78, M.steel);
      sc.disc([0, 0, 36], 58, M.rubber.side);
      sc.disc([0, 0, 36], 50, M.nickel.top);
      sc.disc([0, 0, 36], 16, M.darksteel.side);
      sc.disc([0, 0, 36], 9, M.rubber.dark);
      sc.cylinder([150, 80, 0], 'z', 24, 42, M.steel);
      sc.disc([150, 80, 24], 31, M.rubber.side);
      sc.disc([150, 80, 24], 26, M.nickel.top);
      sc.cylinder([150, 80, 24], 'z', 22, 8, M.darksteel);
      break;
    }
    case 'rod':
      sc.cylinder([0, -90, 0], 'x', 250, 20, M.steel);
      sc.cylinder([250, -90, 0], 'x', 16, 7, M.darksteel);
      sc.cylinder([0, 0, 0], 'x', 280, 24, M.steel);
      sc.cylinder([280, 0, 0], 'x', 18, 8, M.darksteel);
      break;
    case 'grill': {
      const W = 220;
      const t = 18;
      const h = 30;
      sc.box([0, 0, 0], [W, t, h], M.steel);
      sc.box([0, t, 0], [t, W - 2 * t, h], M.steel);
      for (let k = 1; k <= 5; k++) {
        const y = t + (k * (W - 2 * t)) / 6;
        sc.cylinder([t, y, h / 2], 'x', W - 2 * t, 10, M.steel);
      }
      sc.box([W - t, t, 0], [t, W - 2 * t, h], M.steel);
      sc.box([0, W - t, 0], [W, t, h], M.steel);
      break;
    }
    case 'plate': {
      sc.box([-26, 14, 0], [292, 96, 7], M.darksteel);
      sc.box([0, 0, 7], [240, 124, 26], M.steel);
      for (const x of [60, 120, 180]) sc.line([x, 0, 33], [x, 124, 33], 'rgba(11,20,29,.22)', 1.4);
      for (const [x, y] of [
        [-13, 36],
        [-13, 88],
        [253, 36],
        [253, 88],
      ])
        sc.disc([x, y, 7], 5, M.rubber.side);
      break;
    }
    case 'lifter': {
      sc.box([0, 0, 0], [170, 96, 18], M.darksteel);
      sc.box([6, 6, 18], [158, 84, 78], M.red);
      sc.box([64, 34, 96], [42, 28, 12], M.darksteel);
      sc.loop([85, 48, 136], [1, 0, 0], [0, 0, 1], 26, '#aab4be', 9);
      sc.cylinder([164, 48, 62], 'x', 54, 6, M.steel);
      sc.cylinder([218, 48, 62], 'x', 26, 11, M.rubber);
      break;
    }
    case 'cluster':
    default:
      sc.box([0, 0, 0], [130, 80, 42], M.nickel);
      sc.ring([30, 190, 0], 56, 24, 24, M.ferrite);
      sc.cylinder([190, 120, 0], 'z', 18, 40, M.nickel);
      break;
  }
  return sc.render();
}
