// أدوات رسم خاصة بالجزء الثاني: «الختم القديم»
import {
  COLORS, GROUND, H, W, PI, clamp, cos, ease, glow, lerp, mix, pillar, rnd, rr, sin, stars, text, torch,
} from './engine';

const PURPLE = '#a78bfa';
const VOID = '#1b1030';

/** ختم دائري منقوش */
export function sealRune(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  alpha = 1,
  color = PURPLE,
) {
  if (alpha <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, r * 0.045);
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, PI * 2);
  ctx.stroke();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * PI * 2;
    const long = i % 4 === 0;
    ctx.beginPath();
    ctx.moveTo(cos(a) * r * 0.62, sin(a) * r * 0.62);
    ctx.lineTo(cos(a) * r * (long ? 0.95 : 0.78), sin(a) * r * (long ? 0.95 : 0.78));
    ctx.stroke();
  }
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = -PI / 2 + (i / 3) * PI * 2;
    const px = cos(a) * r * 0.62;
    const py = sin(a) * r * 0.62;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  // قلب الختم
  ctx.fillStyle = color;
  ctx.globalAlpha = clamp(alpha) * 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.14, 0, PI * 2);
  ctx.fill();
  ctx.restore();
}

/** بلورة/شظية مضيئة */
export function crystal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string,
  t = 0,
  alpha = 1,
) {
  if (alpha <= 0 || s <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  glow(ctx, x, y, 70 * s, color, 0.55);
  ctx.translate(x, y + sin(t * 2 + x * 0.01) * 3 * s);
  ctx.rotate(sin(t * 1.3 + x * 0.02) * 0.12);
  ctx.scale(s, s);
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(11, -6);
  ctx.lineTo(6, 16);
  ctx.lineTo(-6, 16);
  ctx.lineTo(-11, -6);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(5, -6);
  ctx.lineTo(0, 12);
  ctx.lineTo(-4, -6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** صدع/شق في الفراغ */
export function rift(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  len: number,
  open: number,
  t: number,
  vertical = true,
) {
  const k = clamp(open);
  if (k <= 0) return;
  const segs = 14;
  const pts: [number, number][] = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs - 0.5;
    const wob = (rnd(i * 3 + 1) - 0.5) * 26 + sin(t * 3 + i) * 5;
    pts.push(vertical ? [wob * k, u * len * k] : [u * len * k, wob * k]);
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = 'lighter';
  const draw = (w: number, color: string, a: number) => {
    ctx.strokeStyle = color;
    ctx.globalAlpha = a;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
  };
  draw(34 * k, '#4c1d95', 0.55);
  draw(18 * k, PURPLE, 0.85);
  draw(7 * k, '#f5f3ff', 1);
  // شرارات حول الصدع
  for (let i = 0; i < 16; i++) {
    const u = (t * 0.4 + rnd(i)) % 1;
    const p = pts[Math.floor(rnd(i + 7) * segs)];
    ctx.globalAlpha = (1 - u) * 0.8 * k;
    ctx.fillStyle = i % 2 ? '#f5f3ff' : PURPLE;
    const off = (rnd(i + 3) - 0.5) * 60 * k;
    ctx.fillRect(p[0] + (vertical ? off : 0), p[1] + (vertical ? 0 : off) - u * 40, 3, 3);
  }
  ctx.restore();
}

/** ذراع/خيط ظلام متمايل */
export function tendril(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  ang: number,
  width: number,
  t: number,
  color = VOID,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const segs = 18;
  let px = x;
  let py = y;
  for (let i = 1; i <= segs; i++) {
    const u = i / segs;
    const a = ang + sin(t * 2.2 + u * 3.4) * 0.5 * u;
    const nx = px + cos(a) * (len / segs);
    const ny = py + sin(a) * (len / segs);
    ctx.lineWidth = width * (1 - u * 0.8);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    px = nx;
    py = ny;
  }
  // طرف مضيء
  glow(ctx, px, py, width * 3, '#7c3aed', 0.5 * alpha);
  ctx.restore();
}

/** الحارس الفارغ: كيان ظلّي ضخم */
export function warden(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  t: number,
  alpha = 1,
  hit = 0,
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // هالة
  glow(ctx, 0, 10, 220, '#4c1d95', 0.55);
  glow(ctx, 0, 10, 90, '#7c3aed', 0.4);

  // أذيال الظل
  for (let i = 0; i < 7; i++) {
    const a = PI * 0.15 + (i / 6) * PI * 0.7;
    tendril(ctx, 0, 40, 190 + (i % 3) * 40, a + sin(t * 0.7 + i) * 0.15, 26, t + i, '#2e1065', 0.85);
  }

  // العباءة
  const sway = sin(t * 1.6) * 6;
  ctx.fillStyle = mix('#120a24', '#2e1065', 0.45 + 0.2 * sin(t * 2));
  ctx.beginPath();
  ctx.moveTo(-58, 60);
  ctx.quadraticCurveTo(-96, 150 + sway, -74, 210);
  ctx.quadraticCurveTo(0, 240, 74, 210);
  ctx.quadraticCurveTo(96, 150 - sway, 58, 60);
  ctx.quadraticCurveTo(0, 20, -58, 60);
  ctx.closePath();
  ctx.fill();

  // الجسم والكتفان
  ctx.fillStyle = '#1a0b33';
  ctx.beginPath();
  ctx.ellipse(0, 40, 84, 92, 0, 0, PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-58, 4, 30, 42, -0.2, 0, PI * 2);
  ctx.ellipse(58, 4, 30, 42, 0.2, 0, PI * 2);
  ctx.fill();

  // الرأس (خوذة فارغة)
  ctx.fillStyle = '#0b0618';
  ctx.beginPath();
  ctx.ellipse(0, -52, 40, 46, 0, 0, PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(167,139,250,.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -52, 40, 46, 0, 0, PI * 2);
  ctx.stroke();

  // العينان
  const eyeA = 0.75 + 0.25 * sin(t * 5);
  ctx.shadowColor = '#f0abfc';
  ctx.shadowBlur = 22;
  ctx.fillStyle = `rgba(240,171,252,${eyeA})`;
  [-14, 14].forEach((dx) => {
    ctx.beginPath();
    ctx.ellipse(dx, -58, 8, 5, dx > 0 ? 0.18 : -0.18, 0, PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // شقوق على الخوذة
  ctx.strokeStyle = 'rgba(240,171,252,.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-18, -92);
  ctx.lineTo(-6, -72);
  ctx.lineTo(-13, -50);
  ctx.stroke();

  // ذراعان
  [-1, 1].forEach((s) => {
    ctx.strokeStyle = '#1a0b33';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s * 66, 16);
    ctx.quadraticCurveTo(s * (112 + sin(t * 2) * 8), 96, s * (92 + sin(t * 2.4) * 12), 176);
    ctx.stroke();
  });

  if (hit > 0) {
    ctx.globalAlpha = clamp(alpha) * hit;
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.ellipse(0, -20, 70, 110, 0, 0, PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** خلفية الأرشيف: قاعة حجرية بنقوش */
export function archiveBg(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = '#151129';
  ctx.fillRect(0, 0, W, H);
  // جدار خلفي
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#241b45');
  g.addColorStop(1, '#0f0a20');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, GROUND);
  // حجارة الجدار
  ctx.strokeStyle = 'rgba(255,255,255,.045)';
  ctx.lineWidth = 2;
  for (let r = 0; r < 8; r++) {
    const y = r * 54 + 10;
    for (let c = -1; c < 12; c++) {
      const x = c * 92 + (r % 2) * 46;
      ctx.strokeRect(x, y, 92, 54);
    }
  }
  // أعمدة
  pillar(ctx, 120, 40, GROUND, 54, '#3b3160');
  pillar(ctx, 840, 40, GROUND, 54, '#3b3160');
  pillar(ctx, 300, 90, GROUND - 30, 40, '#332a55');
  pillar(ctx, 660, 90, GROUND - 30, 40, '#332a55');
  // لوحة النقوش
  ctx.fillStyle = '#2a2148';
  rr(ctx, 380, 70, 200, 250, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(167,139,250,.45)';
  ctx.lineWidth = 3;
  ctx.stroke();
  sealRune(ctx, 480, 160, 52, t * 0.25, 0.75);
  ctx.strokeStyle = 'rgba(167,139,250,.3)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(404, 220 + i * 18);
    ctx.lineTo(404 + 60 + rnd(i) * 90, 220 + i * 18);
    ctx.stroke();
  }
  // أرضية
  ctx.fillStyle = '#1c1634';
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = 'rgba(167,139,250,.12)';
  ctx.fillRect(0, GROUND, W, 6);
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 20 + i * 22);
    ctx.lineTo(W, GROUND + 20 + i * 22);
    ctx.stroke();
  }
  // مشاعل
  torch(ctx, 120, GROUND - 190, t);
  torch(ctx, 840, GROUND - 190, t + 1);
}

/** العالم المقلوب: مدينة معلّقة رأسًا على عقب */
export function invertedWorld(ctx: CanvasRenderingContext2D, t: number, depth = 1) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2a1a4e');
  g.addColorStop(0.55, '#150c2b');
  g.addColorStop(1, '#3b1d5a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  stars(ctx, t * 0.6, 0.7, 70);

  // قمر مقلوب أسفل الشاشة
  glow(ctx, 760, 500, 200, '#c4b5fd', 0.4);
  ctx.fillStyle = '#ddd6fe';
  ctx.beginPath();
  ctx.arc(760, 500, 42, 0, PI * 2);
  ctx.fill();

  // مباني معلّقة من الأعلى
  const towers = [
    { x: 70, w: 70, h: 220, c: '#1b1236' },
    { x: 190, w: 46, h: 300, c: '#221641' },
    { x: 300, w: 92, h: 170, c: '#170f2e' },
    { x: 470, w: 58, h: 260, c: '#221641' },
    { x: 600, w: 74, h: 200, c: '#1b1236' },
    { x: 730, w: 52, h: 320, c: '#170f2e' },
    { x: 850, w: 86, h: 190, c: '#221641' },
  ];
  towers.forEach((b, i) => {
    const bob = sin(t * 0.9 + i) * 4 * depth;
    ctx.fillStyle = b.c;
    ctx.fillRect(b.x, -10 + bob, b.w, b.h);
    // نوافذ مضيئة
    for (let r = 0; r < Math.floor(b.h / 40); r++) {
      for (let c = 0; c < 2; c++) {
        if (rnd(i * 10 + r * 3 + c) < 0.45) continue;
        ctx.fillStyle = `rgba(253,224,71,${0.25 + 0.35 * rnd(i + r + c)})`;
        ctx.fillRect(b.x + 12 + c * (b.w - 34), 14 + r * 40 + bob, 12, 16);
      }
    }
    // سطح مائل في الأسفل
    ctx.fillStyle = 'rgba(167,139,250,.25)';
    ctx.fillRect(b.x - 6, b.h - 12 + bob, b.w + 12, 8);
  });

  // صخور طائرة
  for (let i = 0; i < 9; i++) {
    const x = ((i * 137 + t * 9) % (W + 160)) - 80;
    const y = 120 + rnd(i) * 300 + sin(t * 1.2 + i) * 12;
    const s = 12 + rnd(i + 5) * 26;
    ctx.fillStyle = '#2a1d4d';
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.lineTo(x - s * 0.4, y - s * 0.7);
    ctx.lineTo(x + s * 0.6, y - s * 0.5);
    ctx.lineTo(x + s, y + s * 0.2);
    ctx.lineTo(x, y + s * 0.6);
    ctx.closePath();
    ctx.fill();
    glow(ctx, x, y, s * 2.2, '#7c3aed', 0.18);
  }

  // ضباب بنفسجي
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = 'rgba(124,58,237,.07)';
    ctx.beginPath();
    ctx.ellipse(((t * 18 + i * 240) % 1300) - 150, 260 + (i % 3) * 90, 200, 42, 0, 0, PI * 2);
    ctx.fill();
  }
}

/** منصة صخرية عائمة (أرضية مشاهد العالم المقلوب) */
export function floatingPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#241a44';
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(w * 0.34, 40);
  ctx.lineTo(-w * 0.3, 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3b2d68';
  ctx.fillRect(-w / 2, -8, w, 10);
  ctx.fillStyle = 'rgba(167,139,250,.35)';
  ctx.fillRect(-w / 2, -10, w, 3);
  glow(ctx, 0, 10, w * 0.55, '#7c3aed', 0.22);
  // بلورات صغيرة
  for (let i = 0; i < 5; i++) {
    const cx = -w / 2 + 20 + i * (w / 5);
    ctx.globalAlpha = 0.5 + 0.3 * sin(t * 2 + i);
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.moveTo(cx, 2);
    ctx.lineTo(cx + 4, -10 - (i % 2) * 6);
    ctx.lineTo(cx + 8, 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/** مرج الفجر للنهاية */
export function dawnField(ctx: CanvasRenderingContext2D, t: number, k = 1) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix('#171236', '#4c1d95', 0.45 * k));
  g.addColorStop(0.4, mix('#2a1a4e', '#a855f7', 0.5 * k));
  g.addColorStop(0.72, mix('#4c1d95', '#f59e0b', 0.75 * k));
  g.addColorStop(1, mix('#1b1030', '#fde68a', 0.9 * k));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  stars(ctx, t, 0.4 * (1 - k));

  // شمس صاعدة
  const sy = lerp(430, 232, ease(k));
  glow(ctx, 480, sy, 150, '#fbbf24', 0.55);
  glow(ctx, 480, sy, 70, '#fde68a', 0.6);
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(480, sy, 40, 0, PI * 2);
  ctx.fill();

  // تلال
  ctx.fillStyle = mix('#4c1d95', '#f59e0b', 0.55);
  ctx.beginPath();
  ctx.moveTo(0, 470);
  for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 380 - 40 * sin(x * 0.006 + 1));
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();

  // أرض مرج
  ctx.fillStyle = mix('#1f2937', '#65a30d', 0.6 + 0.4 * k);
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = mix('#111827', '#84cc16', 0.6);
  ctx.fillRect(0, GROUND, W, 9);
  for (let i = 0; i < 34; i++) {
    const fx = rnd(i + 1) * W;
    const fy = GROUND + 18 + rnd(i + 2) * 76;
    ctx.strokeStyle = 'rgba(190,242,100,.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx - 3, fy - 9);
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + 3, fy - 9);
    ctx.stroke();
    if (i % 6 === 0) {
      ctx.fillStyle = ['#f472b6', '#fde047', '#ffffff'][i % 3];
      ctx.beginPath();
      ctx.arc(fx + 6, fy - 12, 3.5, 0, PI * 2);
      ctx.fill();
    }
  }
  // جزيئات ضوء
  for (let i = 0; i < 20; i++) {
    const u = (t * 0.25 + rnd(i)) % 1;
    ctx.fillStyle = `rgba(255,247,200,${(1 - u) * 0.7 * k})`;
    ctx.fillRect(120 + rnd(i + 4) * 720, 380 - u * 300, 3, 3);
  }
}

/** بطاقة عنوان كبيرة داخل المشهد (مثل «الحقيقة») */
export function bigTitle(ctx: CanvasRenderingContext2D, s: string, sub: string, alpha: number, color = '#fde047') {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillRect(0, 150, W, 160);
  text(ctx, s, W / 2, 205, 54, color, '900');
  text(ctx, sub, W / 2, 262, 24, '#e9d5ff', '700');
  ctx.restore();
}

export const PART2_COLORS = { PURPLE, VOID, GOLD: COLORS.gold };
