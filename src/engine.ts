// محرك رسم الستيكمان والمشاهد (Canvas)
export const W = 960;
export const H = 540;
export const GROUND = 430;
export const HIP = GROUND - 46;
export const FONT = 'Cairo, Tahoma, Arial, sans-serif';

export const COLORS = {
  blue: '#3b82f6',
  red: '#ef4444',
  yellow: '#facc15',
  black: '#14141f',
  gold: '#fbbf24',
};

const { sin, cos, PI, abs, max } = Math;
export { PI, sin, cos, abs };

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const ease = (k: number) => {
  k = clamp(k);
  return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
};
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** تحريك بين مفاتيح زمنية */
export function kf(t: number, keys: [number, number][], linear = false) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t < keys[i + 1][0]) {
      const k = prog(t, keys[i][0], keys[i + 1][0]);
      return lerp(keys[i][1], keys[i + 1][1], linear ? k : ease(k));
    }
  }
  return keys[keys.length - 1][1];
}
export const moving = (t: number, keys: [number, number][], linear = true) =>
  abs(kf(t + 0.06, keys, linear) - kf(t - 0.06, keys, linear)) > 0.4;
export const heading = (t: number, keys: [number, number][], linear = true): 1 | -1 =>
  kf(t + 0.1, keys, linear) >= kf(t - 0.1, keys, linear) ? 1 : -1;

function hex(c: string) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(a: string, b: string, k: number) {
  const x = hex(a);
  const y = hex(b);
  k = clamp(k);
  return `rgb(${Math.round(lerp(x[0], y[0], k))},${Math.round(lerp(x[1], y[1], k))},${Math.round(lerp(x[2], y[2], k))})`;
}

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------------------------- الأوضاع (Poses) ---------------------------- */
export type Pair = [number, number];
export interface Pose {
  lean: number;
  head?: number;
  dy?: number;
  aF: Pair;
  aB: Pair;
  lF: Pair;
  lB: Pair;
}
const mp = (a: Pair, b: Pair, k: number): Pair => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
export function mixPose(a: Pose, b: Pose, k: number): Pose {
  return {
    lean: lerp(a.lean, b.lean, k),
    head: lerp(a.head ?? 0, b.head ?? 0, k),
    dy: lerp(a.dy ?? 0, b.dy ?? 0, k),
    aF: mp(a.aF, b.aF, k),
    aB: mp(a.aB, b.aB, k),
    lF: mp(a.lF, b.lF, k),
    lB: mp(a.lB, b.lB, k),
  };
}

export const pose = {
  idle: (t: number): Pose => ({
    lean: 0.03 + sin(t * 2) * 0.02,
    dy: sin(t * 2) * 0.8,
    aF: [0.25 + sin(t * 2) * 0.05, 0.5],
    aB: [-0.2, 0.4],
    lF: [0.14, -0.05],
    lB: [-0.14, -0.05],
  }),
  walk: (t: number, sp = 1): Pose => {
    const p = t * 7 * sp;
    return {
      lean: 0.08,
      dy: -abs(sin(p)) * 2,
      aF: [-sin(p) * 0.7, 0.5],
      aB: [sin(p) * 0.7, 0.4],
      lF: [sin(p) * 0.6, -max(0, cos(p)) * 0.9],
      lB: [-sin(p) * 0.6, -max(0, -cos(p)) * 0.9],
    };
  },
  run: (t: number, sp = 1): Pose => {
    const p = t * 11 * sp;
    return {
      lean: 0.3,
      dy: -abs(sin(p)) * 4,
      aF: [-sin(p) * 1.1, 1.4],
      aB: [sin(p) * 1.1, 1.4],
      lF: [sin(p) * 1.0, -max(0, cos(p)) * 1.7 - 0.2],
      lB: [-sin(p) * 1.0, -max(0, -cos(p)) * 1.7 - 0.2],
    };
  },
  jump: (u: number): Pose => {
    const e = sin(clamp(u) * PI);
    return {
      lean: 0.1,
      aF: [lerp(0.5, 2.6, e), 0.2],
      aB: [lerp(-0.4, 2.3, e), 0.3],
      lF: [lerp(0.2, 0.9, e), lerp(-0.2, -1.3, e)],
      lB: [lerp(-0.2, 0.2, e), lerp(-0.2, -1.5, e)],
    };
  },
  punch: (u: number): Pose => {
    const e = sin(clamp(u) * PI);
    return {
      lean: 0.12 + e * 0.18,
      aF: [lerp(0.6, 1.57, e), lerp(1.8, 0, e)],
      aB: [0.4, 1.9],
      lF: [0.55, -0.2],
      lB: [-0.5, -0.3],
    };
  },
  kick: (u: number): Pose => {
    const e = sin(clamp(u) * PI);
    return {
      lean: -0.15 * e,
      aF: [1.2, 0.4],
      aB: [-1.0, 0.5],
      lF: [lerp(0.2, 1.45, e), lerp(-1.3, 0, e)],
      lB: [-0.15, 0],
    };
  },
  hurt: (t: number): Pose => ({
    lean: -0.35,
    head: -0.3,
    aF: [-0.6 + sin(t * 20) * 0.1, 0.4],
    aB: [-0.9, 0.5],
    lF: [0.3, -0.1],
    lB: [-0.4, -0.1],
  }),
  cheer: (t: number): Pose => ({
    lean: 0,
    dy: -abs(sin(t * 6)) * 5,
    aF: [2.7 + sin(t * 9) * 0.3, 0.2],
    aB: [2.5 - sin(t * 9) * 0.3, 0.2],
    lF: [0.2, 0],
    lB: [-0.2, 0],
  }),
  wave: (t: number): Pose => ({
    lean: 0.02,
    dy: sin(t * 2) * 0.8,
    aF: [2.5 + sin(t * 8) * 0.35, 0.4],
    aB: [-0.2, 0.4],
    lF: [0.14, -0.05],
    lB: [-0.14, -0.05],
  }),
  cast: (t = 0): Pose => ({
    lean: 0.12,
    dy: sin(t * 30) * 0.8,
    aF: [1.57, 0],
    aB: [1.5, 0],
    lF: [0.5, -0.1],
    lB: [-0.5, -0.25],
  }),
  flail: (t: number): Pose => ({
    lean: sin(t * 7) * 0.3,
    aF: [2 + sin(t * 17) * 1, sin(t * 13) * 0.5],
    aB: [2 + cos(t * 15) * 1, cos(t * 11) * 0.5],
    lF: [sin(t * 14) * 0.9, -0.5],
    lB: [cos(t * 12) * 0.9, -0.5],
  }),
  crouch: (): Pose => ({
    lean: 0.55,
    dy: 16,
    aF: [0.9, 0.3],
    aB: [0.7, 0.3],
    lF: [1.0, -1.8],
    lB: [0.3, -1.6],
  }),
  reachUp: (t: number): Pose => ({
    lean: 0.02,
    dy: sin(t * 2),
    aF: [2.85, 0.1],
    aB: [-0.2, 0.4],
    lF: [0.14, -0.05],
    lB: [-0.14, -0.05],
  }),
  push: (t: number): Pose => ({
    lean: 0.38,
    dy: 2,
    aF: [1.5, 0],
    aB: [1.4, 0],
    lF: [0.75 + sin(t * 8) * 0.15, -0.3],
    lB: [-0.6 - sin(t * 8) * 0.15, -0.1],
  }),
  hang: (t = 0): Pose => ({
    lean: 0,
    aF: [3.05, 0],
    aB: [3.0, 0],
    lF: [0.1 + sin(t * 3) * 0.05, 0],
    lB: [-0.05, 0],
  }),
  think: (t: number): Pose => ({
    lean: 0.05,
    head: 0.1,
    dy: sin(t * 2) * 0.6,
    aF: [2.3, 2.2],
    aB: [-0.2, 0.4],
    lF: [0.14, -0.05],
    lB: [-0.14, -0.05],
  }),
  stand: (t: number): Pose => ({
    lean: 0,
    dy: sin(t * 2) * 0.6,
    aF: [0.12, 0.2],
    aB: [-0.12, 0.2],
    lF: [0.1, 0],
    lB: [-0.1, 0],
  }),
};

/* ------------------------------ رسم الستيكمان ------------------------------ */
export interface StickOpts {
  x: number;
  y: number;
  color: string;
  dir?: 1 | -1;
  scale?: number;
  pose: Pose;
  rot?: number;
  alpha?: number;
  glow?: string;
  angry?: boolean;
  darkEyes?: boolean;
}
export interface StickOut {
  hand: { x: number; y: number };
  handB: { x: number; y: number };
  head: { x: number; y: number };
  hip: { x: number; y: number };
  foot: { x: number; y: number };
}

export function drawStick(ctx: CanvasRenderingContext2D, o: StickOpts): StickOut {
  const { x, y, color, dir = 1, scale = 1, pose: ps, rot = 0, alpha = 1, glow, angry = false } = o;
  const TL = 40, UA = 19, LA = 19, UL = 25, LL = 25, HR = 12;
  const l = ps.lean;
  const neck: Pair = [sin(l) * TL, -cos(l) * TL];
  const sh: Pair = [neck[0] * 0.93, neck[1] * 0.93];
  const ha = l + (ps.head ?? 0);
  const head: Pair = [neck[0] + sin(ha) * HR, neck[1] - cos(ha) * HR];
  const limb = (from: Pair, p: Pair, l1: number, l2: number): [Pair, Pair] => {
    const m: Pair = [from[0] + sin(p[0]) * l1, from[1] + cos(p[0]) * l1];
    const e: Pair = [m[0] + sin(p[0] + p[1]) * l2, m[1] + cos(p[0] + p[1]) * l2];
    return [m, e];
  };
  const [aFm, aFe] = limb(sh, ps.aF, UA, LA);
  const [aBm, aBe] = limb(sh, ps.aB, UA, LA);
  const [lFm, lFe] = limb([0, 0], ps.lF, UL, LL);
  const [lBm, lBe] = limb([0, 0], ps.lB, UL, LL);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y + (ps.dy ?? 0) * scale);
  ctx.scale(dir * scale, scale);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 16;
  }
  const line = (pts: Pair[]) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  };
  ctx.globalAlpha = alpha * 0.72;
  line([sh, aBm, aBe]);
  line([[0, 0], lBm, lBe]);
  ctx.globalAlpha = alpha;
  line([[0, 0], neck]);
  line([[0, 0], lFm, lFe]);
  line([sh, aFm, aFe]);
  ctx.beginPath();
  ctx.arc(head[0], head[1], HR, 0, PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // العيون
  const ex = head[0] + cos(ha) * 5;
  const ey = head[1] - 2 - sin(ha) * 5;
  if (color === COLORS.black) {
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#f0abfc';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 3.6, 2.4, 0.2, 0, PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex, ey, 3.7, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(ex + 1.2, ey, 1.7, 0, PI * 2);
    ctx.fill();
  }
  if (angry) {
    ctx.strokeStyle = '#1f0000';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(ex - 5, ey - 6.5);
    ctx.lineTo(ex + 5, ey - 2.5);
    ctx.stroke();
  }
  ctx.restore();

  const tf = (p: Pair) => {
    const rx = p[0] * cos(rot) - p[1] * sin(rot);
    const ry = p[0] * sin(rot) + p[1] * cos(rot);
    return { x: x + dir * scale * rx, y: y + (ps.dy ?? 0) * scale + scale * ry };
  };
  return { hand: tf(aFe), handB: tf(aBe), head: tf(head), hip: tf([0, 0]), foot: tf(lFe) };
}

/* ------------------------------ أدوات الخلفيات ------------------------------ */
export function sky(ctx: CanvasRenderingContext2D, top: string, bot: string) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function mountains(
  ctx: CanvasRenderingContext2D,
  off: number,
  base: number,
  amp: number,
  color: string,
  freq = 0.01,
  seed = 0,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W + 20; x += 16) {
    const u = (x + off) * freq + seed;
    const y = base - amp * (0.55 + 0.3 * sin(u) + 0.25 * sin(u * 2.3 + 1.7) + 0.15 * sin(u * 5.1));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(a);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, '#000000');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

export function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, a = 0.85) {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, 46 * s, 16 * s, 0, 0, PI * 2);
  ctx.ellipse(x - 26 * s, y + 4 * s, 28 * s, 12 * s, 0, 0, PI * 2);
  ctx.ellipse(x + 28 * s, y + 5 * s, 30 * s, 12 * s, 0, 0, PI * 2);
  ctx.ellipse(x + 4 * s, y - 10 * s, 26 * s, 14 * s, 0, 0, PI * 2);
  ctx.fill();
  ctx.restore();
}

export function stars(ctx: CanvasRenderingContext2D, t: number, a = 1, n = 60) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = `rgba(255,255,255,${a * (0.35 + 0.65 * abs(sin(t * 1.5 + i)))})`;
    ctx.fillRect(rnd(i) * W, rnd(i + 99) * 280, 2, 2);
  }
}

export function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size = 20,
  color = '#fff',
  weight = 'bold',
  align: CanvasTextAlign = 'center',
) {
  ctx.save();
  ctx.direction = 'rtl';
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
  ctx.restore();
}

/** فقاعة كلام */
export function bubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: string,
  border = '#111',
  opts: { size?: number; pop?: number } = {},
) {
  const size = opts.size ?? 19;
  const pop = opts.pop ?? 1;
  ctx.save();
  ctx.direction = 'rtl';
  ctx.font = `bold ${size}px ${FONT}`;
  const w = ctx.measureText(s).width + 30;
  const h = size + 22;
  let bx = x - w / 2;
  bx = clamp(bx, 8, W - w - 8);
  const by = y - h - 16;
  ctx.translate(x, y);
  ctx.scale(pop, pop);
  ctx.translate(-x, -y);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  rr(ctx, bx, by, w, h, 14);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(clamp(x - 10, bx + 12, bx + w - 30), by + h - 1);
  ctx.lineTo(x, y);
  ctx.lineTo(clamp(x + 10, bx + 24, bx + w - 12), by + h - 1);
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.fillRect(clamp(x - 9, bx + 12, bx + w - 30) + 1, by + h - 4, 16, 5);
  ctx.fillStyle = '#111';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, bx + w / 2, by + h / 2 + 1);
  ctx.restore();
}

/** عرض فقاعة في فترة زمنية */
export function say(
  ctx: CanvasRenderingContext2D,
  t: number,
  from: number,
  to: number,
  x: number,
  y: number,
  s: string,
  border = '#111',
  size = 19,
) {
  if (t < from || t > to) return;
  const pop = ease(prog(t, from, from + 0.2)) * (1 - prog(t, to - 0.15, to) * 0.3);
  bubble(ctx, x, y, s, border, { size, pop: Math.max(0.01, pop) });
}

/** تأثير ضربة */
export function impact(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, t0: number, size = 1) {
  const u = (t - t0) / 0.35;
  if (u < 0 || u > 1) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 1 - u;
  ctx.fillStyle = '#fde047';
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 3;
  const r = (14 + u * 30) * size;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const rad = i % 2 ? r * 0.5 : r;
    const a = (i / 16) * PI * 2;
    ctx.lineTo(cos(a) * rad, sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** غبار */
export function dust(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, t0: number, n = 8, spread = 60) {
  const u = (t - t0) / 1.2;
  if (u < 0 || u > 1) return;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const dir = i % 2 ? 1 : -1;
    const dx = dir * (10 + rnd(i) * spread) * u;
    const dyy = -rnd(i + 5) * 30 * u;
    ctx.fillStyle = `rgba(214,200,170,${0.7 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(x + dx, y + dyy, 5 + rnd(i + 9) * 9 * u + 3, 0, PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** العصا الذهبية */
export function staff(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, power = 1, t = 0) {
  ctx.save();
  glow(ctx, x + sin(ang) * len * 0.5, y - cos(ang) * len * 0.5, 80 * power + 20, '#f59e0b', 0.5 * power);
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.shadowColor = '#fde047';
  ctx.shadowBlur = 14 * power;
  ctx.beginPath();
  ctx.moveTo(0, len * 0.25);
  ctx.lineTo(0, -len);
  ctx.stroke();
  ctx.strokeStyle = '#fff7c2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1, len * 0.2);
  ctx.lineTo(1, -len * 0.95);
  ctx.stroke();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(0, -len - 6, 10 + sin(t * 5) * 1.2, 0, PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-2.5, -len - 9, 3.5, 0, PI * 2);
  ctx.fill();
  ctx.restore();
}

/** خريطة صغيرة */
export function miniMap(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.fillStyle = '#ecd9a4';
  ctx.strokeStyle = '#8a6a2f';
  ctx.lineWidth = 2;
  rr(ctx, -18, -12, 36, 24, 3);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#b45309';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-12, 6);
  ctx.quadraticCurveTo(-2, -8, 10, -3);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(7, -7);
  ctx.lineTo(13, -1);
  ctx.moveTo(13, -7);
  ctx.lineTo(7, -1);
  ctx.stroke();
  ctx.restore();
}

/** معبد صغير */
export function temple(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color = '#3b3550', lit = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (lit > 0) glow(ctx, 0, -70, 120, '#f59e0b', lit);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-90, 0);
  ctx.lineTo(-90, -12);
  ctx.lineTo(-80, -12);
  ctx.lineTo(-80, -90);
  ctx.lineTo(-100, -90);
  ctx.lineTo(0, -150);
  ctx.lineTo(100, -90);
  ctx.lineTo(80, -90);
  ctx.lineTo(80, -12);
  ctx.lineTo(90, -12);
  ctx.lineTo(90, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  for (let i = -2; i <= 2; i++) ctx.fillRect(i * 30 - 6, -88, 12, 76);
  ctx.fillStyle = lit > 0 ? '#fbbf24' : 'rgba(0,0,0,.4)';
  ctx.beginPath();
  ctx.arc(0, -120, 8, 0, PI * 2);
  ctx.fill();
  ctx.restore();
}

/** عمود حجري */
export function pillar(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number, w = 46, color = '#5b5478') {
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, top, w, bottom - top);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.fillRect(x - w / 2, top, w * 0.3, bottom - top);
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.fillRect(x + w * 0.2, top, w * 0.3, bottom - top);
  ctx.fillStyle = color;
  ctx.fillRect(x - w * 0.7, top - 12, w * 1.4, 14);
  ctx.fillRect(x - w * 0.65, bottom - 10, w * 1.3, 10);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.fillRect(x - w * 0.7, top - 2, w * 1.4, 4);
}

export function torch(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  glow(ctx, x, y - 14, 120, '#ea580c', 0.55 + 0.15 * sin(t * 12 + x));
  ctx.fillStyle = '#4b3621';
  ctx.fillRect(x - 3, y, 6, 28);
  const f = 1 + 0.2 * sin(t * 14 + x);
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.ellipse(x, y - 7, 8, 14 * f, 0, 0, PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.ellipse(x, y - 4, 4, 8 * f, 0, 0, PI * 2);
  ctx.fill();
}

export interface Line {
  at: number;
  text: string;
}
export interface Scene {
  id: number;
  title: string;
  desc: string;
  icon: string;
  duration: number;
  lines: Line[];
  draw: (ctx: CanvasRenderingContext2D, t: number) => void;
}
