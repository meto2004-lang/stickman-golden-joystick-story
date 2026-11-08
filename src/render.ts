// رسم إطار كامل من القصة (يُستخدم في المشغّل وفي تصدير الفيديو)
import {
  H, W, FONT, PI, sin, clamp, ease, prog, stars, sky, glow, rr, text, staff,
} from './engine';
import type { Scene } from './engine';

/** مدة بطاقة البداية (ثانية) */
export const INTRO = 4;
/** مدة بطاقة النهاية (ثانية) */
export const OUTRO = 4;

export const totalRun = (scenes: Scene[]) => scenes.reduce((a, s) => a + s.duration, 0);
/** المدة الكاملة للفيديو المُصدَّر (مقدمة + المشاهد + نهاية) */
export const videoDuration = (scenes: Scene[]) => INTRO + totalRun(scenes) + OUTRO;

export interface FrameOpts {
  /** حرق الترجمة/السرد داخل الصورة (مطلوب لملف الفيديو) */
  subtitles?: boolean;
}

/** إيجاد المشهد والزمن المحلي عند لحظة معيّنة من الفيديو */
export function sceneAt(scenes: Scene[], time: number) {
  let t = time - INTRO;
  for (let i = 0; i < scenes.length; i++) {
    const d = scenes[i].duration;
    if (t < d) return { index: i, t: Math.max(0, t), scene: scenes[i] };
    t -= d;
  }
  const i = scenes.length - 1;
  return { index: i, t: scenes[i].duration, scene: scenes[i] };
}

/** آخر سطر سرد ظهر قبل اللحظة t */
export function lineAt(scene: Scene, t: number) {
  let found: { at: number; text: string } | null = null;
  for (const l of scene.lines) if (l.at <= t) found = l;
  return found;
}

/** سطر ترجمة مقسّم على عدة أسطر حسب العرض المتاح */
function wrap(ctx: CanvasRenderingContext2D, s: string, maxW: number, font: string) {
  ctx.save();
  ctx.font = font;
  const words = s.split(/\s+/);
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (cur && ctx.measureText(test).width > maxW) {
      out.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) out.push(cur);
  ctx.restore();
  return out;
}

/** ترجمة السرد مرسومة على الصورة نفسها */
export function drawSubtitle(ctx: CanvasRenderingContext2D, s: string, alpha = 1) {
  if (!s || alpha <= 0) return;
  const size = 25;
  const font = `700 ${size}px ${FONT}`;
  const maxW = W - 160;
  const lines = wrap(ctx, s, maxW, font);
  const lh = size + 11;

  ctx.save();
  ctx.direction = 'rtl';
  ctx.font = font;
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const boxW = Math.min(W - 40, textW + 52);
  const boxH = lines.length * lh + 22;
  const x = (W - boxW) / 2;
  const y = H - boxH - 24;

  ctx.globalAlpha = clamp(alpha);
  ctx.fillStyle = 'rgba(4,2,16,.72)';
  rr(ctx, x, y, boxW, boxH, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.16)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, y + 11 + lh * (i + 0.5)));
  ctx.restore();
}

/**
 * رسم مشهد واحد + بطاقة عنوانه + تلاشي الدخول/الخروج.
 * يتوقّع أن يكون تحويل الإحداثيات مضبوطًا مسبقًا (960×540 منطقيًا).
 */
export function drawSceneFrame(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  t: number,
  isLast: boolean,
  opts: FrameOpts = {},
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  scene.draw(ctx, t);

  // بطاقة عنوان المشهد
  const ca = Math.min(prog(t, 0.3, 0.8), 1 - prog(t, 2.3, 2.9));
  if (ca > 0) {
    ctx.fillStyle = `rgba(0,0,0,${0.55 * ca})`;
    ctx.fillRect(0, H / 2 - 80, W, 150);
    ctx.globalAlpha = ca;
    text(ctx, `المشهد ${scene.id}`, W / 2, H / 2 - 35, 26, '#fde047', '700');
    text(ctx, scene.title, W / 2, H / 2 + 15, 54, '#ffffff', '900');
    ctx.globalAlpha = 1;
  }

  // تلاشي الدخول والخروج
  const fa = Math.max(1 - prog(t, 0, 0.5), prog(t, scene.duration - 0.5, scene.duration));
  if (fa > 0 && !(isLast && t > scene.duration - 0.5)) {
    ctx.fillStyle = `rgba(0,0,0,${fa})`;
    ctx.fillRect(0, 0, W, H);
  }

  // الترجمة
  if (opts.subtitles) {
    const line = lineAt(scene, t);
    if (line) drawSubtitle(ctx, line.text, clamp((t - line.at) / 0.28));
  }

  ctx.restore();
}

/** بطاقة البداية */
export function drawIntro(ctx: CanvasRenderingContext2D, t: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();

  sky(ctx, '#05030f', '#241141');
  stars(ctx, t, 0.9, 80);
  glow(ctx, W / 2, H / 2 - 20, 300 + sin(t * 1.6) * 30, '#f59e0b', 0.35 * ease(prog(t, 0, 1.2)));

  // العصا الذهبية
  const up = ease(prog(t, 0.15, 1.3));
  ctx.globalAlpha = up;
  staff(ctx, W / 2, H / 2 + 190 - 30 * up, 0.42 + sin(t * 1.1) * 0.05, 130, 0.9, t);
  ctx.globalAlpha = 1;

  const a1 = ease(prog(t, 0.35, 1.25));
  const a2 = ease(prog(t, 1.0, 1.9));
  const a3 = ease(prog(t, 1.6, 2.5));

  if (a1 > 0) {
    ctx.globalAlpha = a1;
    const sc = 0.9 + 0.1 * a1;
    ctx.save();
    ctx.translate(W / 2, H / 2 + 45);
    ctx.scale(sc, sc);
    ctx.translate(-W / 2, -(H / 2 + 45));
    text(ctx, 'عصا التحكم الذهبية', W / 2, H / 2 + 45, 64, '#fde047', '900');
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  if (a2 > 0) {
    ctx.globalAlpha = a2;
    text(ctx, 'قصة ستيكمان متحركة · ٧ مشاهد', W / 2, H / 2 + 118, 27, '#e9d5ff', '700');
    ctx.globalAlpha = 1;
  }
  if (a3 > 0) {
    ctx.globalAlpha = a3 * (0.6 + 0.4 * sin(t * 3));
    text(ctx, '🎮', W / 2, H / 2 + 175, 34, '#fff', '700');
    ctx.globalAlpha = 1;
  }

  const fade = Math.max(1 - prog(t, 0, 0.6), prog(t, INTRO - 0.7, INTRO));
  if (fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/** بطاقة النهاية */
export function drawOutro(ctx: CanvasRenderingContext2D, t: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();

  sky(ctx, '#05030f', '#1b0f36');
  stars(ctx, t * 0.7, 0.85, 90);
  glow(ctx, W / 2, H / 2 + 10, 340, '#f59e0b', 0.28 * ease(prog(t, 0, 1)));
  glow(ctx, W / 2, H / 2 + 10, 150, '#fde047', 0.18 * ease(prog(t, 0.4, 1.4)));

  // الشخصيات
  const chars: [string, string][] = [
    ['#3b82f6', '🟦'],
    ['#ef4444', '🟥'],
    ['#facc15', '🟨'],
    ['#a78bfa', '⚫'],
  ];
  const ca = ease(prog(t, 0.3, 1.3));
  ctx.globalAlpha = ca;
  chars.forEach(([c], i) => {
    const x = W / 2 + (i - 1.5) * 96;
    const y = H / 2 + 176 + sin(t * 2 + i) * 4;
    ctx.save();
    ctx.fillStyle = c;
    ctx.shadowColor = c;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = c;
    ctx.globalAlpha = ca * 0.85;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x, y + 42);
    ctx.moveTo(x, y + 20);
    ctx.lineTo(x - 13, y + 32);
    ctx.moveTo(x, y + 20);
    ctx.lineTo(x + 13, y + 30);
    ctx.moveTo(x, y + 42);
    ctx.lineTo(x - 11, y + 62);
    ctx.moveTo(x, y + 42);
    ctx.lineTo(x + 11, y + 62);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = ca;
  });
  ctx.globalAlpha = 1;

  const a1 = ease(prog(t, 0.2, 1.1));
  const a2 = ease(prog(t, 0.9, 1.8));
  const a3 = ease(prog(t, 1.6, 2.5));

  if (a1 > 0) {
    ctx.globalAlpha = a1;
    text(ctx, 'النهاية', W / 2, H / 2 - 70, 72, '#fde047', '900');
    ctx.globalAlpha = 1;
  }
  if (a2 > 0) {
    ctx.globalAlpha = a2;
    text(ctx, 'الجزء الثاني قريبًا…', W / 2, H / 2 + 5, 34, '#ffffff', '700');
    ctx.globalAlpha = 1;
  }
  if (a3 > 0) {
    ctx.globalAlpha = a3;
    text(ctx, 'أعجبك الفيديو؟ اشترك في القناة وشغّل التنبيهات 🔔', W / 2, H / 2 + 80, 23, '#d8b4fe', '700');
    ctx.globalAlpha = 1;
  }

  const fade = Math.max(1 - prog(t, 0, 0.5), prog(t, OUTRO - 0.6, OUTRO));
  if (fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/** رسم أي لحظة من الفيديو الكامل (مقدمة / مشاهد / نهاية) */
export function renderTimeline(
  ctx: CanvasRenderingContext2D,
  scenes: Scene[],
  time: number,
  opts: FrameOpts = {},
) {
  const total = totalRun(scenes);
  if (time < INTRO) {
    drawIntro(ctx, time);
    return;
  }
  if (time >= INTRO + total) {
    drawOutro(ctx, clamp(time - INTRO - total, 0, OUTRO));
    return;
  }
  const { index, t, scene } = sceneAt(scenes, time);
  drawSceneFrame(ctx, scene, t, index === scenes.length - 1, opts);
}
