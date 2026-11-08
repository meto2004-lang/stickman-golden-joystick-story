// رسم إطار كامل من القصة (يُستخدم في المشغّل وفي تصدير الفيديو)
import {
  H, W, FONT, PI, sin, clamp, ease, prog, stars, sky, glow, rr, text, staff,
} from './engine';
import type { Scene } from './engine';

/** مدة بطاقة البداية (ثانية) */
export const INTRO = 4;
/** مدة بطاقة النهاية (ثانية) */
export const OUTRO = 4;
/** مدة الفاصل بين الأجزاء (ثانية) */
export const INTERLUDE = 3.5;

/** جزء واحد داخل الخط الزمني للفيديو */
export interface TimelinePart {
  label: string;
  title?: string;
  scenes: Scene[];
}

export const totalRun = (scenes: Scene[]) => scenes.reduce((a, s) => a + s.duration, 0);
export const partsRun = (parts: TimelinePart[]) => parts.reduce((a, p) => a + totalRun(p.scenes), 0);

/** المدة الكاملة للفيديو المُصدَّر (مقدمة + الأجزاء + فواصل + نهاية) */
export const timelineDuration = (parts: TimelinePart[]) =>
  INTRO + partsRun(parts) + INTERLUDE * Math.max(0, parts.length - 1) + OUTRO;

export interface FrameOpts {
  /** حرق الترجمة/السرد داخل الصورة (مطلوب لملف الفيديو) */
  subtitles?: boolean;
  /** سطر تحت العنوان في بطاقة البداية */
  introSub?: string;
  /** سطر كبير في بطاقة النهاية */
  outroSub?: string;
  /** سطر صغير في بطاقة النهاية */
  outroNote?: string;
}

/** إيجاد المشهد والزمن المحلي عند لحظة معيّنة من الفيديو */
export function sceneAt(parts: TimelinePart[], time: number) {
  let t = time - INTRO;
  for (let pi = 0; pi < parts.length; pi++) {
    const { scenes } = parts[pi];
    const d = totalRun(scenes);
    if (t < d) {
      let local = Math.max(0, t);
      let index = 0;
      while (index < scenes.length - 1 && local >= scenes[index].duration) {
        local -= scenes[index].duration;
        index += 1;
      }
      return { partIndex: pi, index, t: local, scene: scenes[index] };
    }
    t -= d;
    if (pi < parts.length - 1) t -= INTERLUDE;
  }
  const li = parts.length - 1;
  const index = parts[li].scenes.length - 1;
  return { partIndex: li, index, t: parts[li].scenes[index].duration, scene: parts[li].scenes[index] };
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
export function drawIntro(ctx: CanvasRenderingContext2D, t: number, subtitle = 'قصة ستيكمان متحركة · ٧ مشاهد') {
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
    text(ctx, subtitle, W / 2, H / 2 + 118, 27, '#e9d5ff', '700');
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

/** فاصل بين جزأين */
export function drawIntertitle(ctx: CanvasRenderingContext2D, part: TimelinePart, t: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();

  sky(ctx, '#05030f', '#2a1246');
  stars(ctx, t + 10, 0.8, 70);
  glow(ctx, W / 2, H / 2, 280, '#7c3aed', 0.3 * ease(prog(t, 0, 1)));
  glow(ctx, W / 2, H / 2, 120, '#f59e0b', 0.22 * ease(prog(t, 0.6, 1.8)));

  // خطوط ضوئية قطرية
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#a78bfa';
  for (let i = 0; i < 10; i++) {
    const x = (i / 10) * W + ((t * 40) % 120) - 60;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 34, 0);
    ctx.lineTo(x + 10, H);
    ctx.lineTo(x - 24, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const a = ease(prog(t, 0.2, 1.1));
  const b = ease(prog(t, 0.8, 1.7));
  if (a > 0) {
    ctx.globalAlpha = a;
    text(ctx, part.label, W / 2, H / 2 - 40, 60, '#fde047', '900');
    ctx.globalAlpha = 1;
  }
  if (b > 0) {
    ctx.globalAlpha = b;
    text(ctx, part.title ?? '', W / 2, H / 2 + 26, 30, '#e9d5ff', '700');
    ctx.globalAlpha = 1;
  }

  const fade = Math.max(1 - prog(t, 0, 0.45), prog(t, INTERLUDE - 0.6, INTERLUDE));
  if (fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/** بطاقة النهاية */
export function drawOutro(
  ctx: CanvasRenderingContext2D,
  t: number,
  sub = 'الجزء الثاني قريبًا…',
  note = 'أعجبك الفيديو؟ اشترك في القناة وشغّل التنبيهات 🔔',
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();

  sky(ctx, '#05030f', '#1b0f36');
  stars(ctx, t * 0.7, 0.85, 90);
  glow(ctx, W / 2, H / 2 + 10, 340, '#f59e0b', 0.28 * ease(prog(t, 0, 1)));
  glow(ctx, W / 2, H / 2 + 10, 150, '#fde047', 0.18 * ease(prog(t, 0.4, 1.4)));

  // الشخصيات
  const chars: string[] = ['#3b82f6', '#ef4444', '#facc15', '#a78bfa'];
  const ca = ease(prog(t, 0.3, 1.3));
  ctx.globalAlpha = ca;
  chars.forEach((c, i) => {
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
    text(ctx, sub, W / 2, H / 2 + 5, 32, '#ffffff', '700');
    ctx.globalAlpha = 1;
  }
  if (a3 > 0) {
    ctx.globalAlpha = a3;
    text(ctx, note, W / 2, H / 2 + 80, 23, '#d8b4fe', '700');
    ctx.globalAlpha = 1;
  }

  const fade = Math.max(1 - prog(t, 0, 0.5), prog(t, OUTRO - 0.6, OUTRO));
  if (fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/** رسم أي لحظة من الفيديو الكامل (مقدمة / مشاهد / فواصل / نهاية) */
export function renderTimeline(
  ctx: CanvasRenderingContext2D,
  parts: TimelinePart[],
  time: number,
  opts: FrameOpts = {},
) {
  if (parts.length === 0) return;
  if (time < INTRO) {
    drawIntro(ctx, time, opts.introSub);
    return;
  }

  let t = time - INTRO;
  for (let pi = 0; pi < parts.length; pi++) {
    const part = parts[pi];
    const d = totalRun(part.scenes);
    if (t < d) {
      let local = Math.max(0, t);
      let index = 0;
      while (index < part.scenes.length - 1 && local >= part.scenes[index].duration) {
        local -= part.scenes[index].duration;
        index += 1;
      }
      const isLast = pi === parts.length - 1 && index === part.scenes.length - 1;
      drawSceneFrame(ctx, part.scenes[index], local, isLast, opts);
      return;
    }
    t -= d;
    if (pi < parts.length - 1) {
      if (t < INTERLUDE) {
        drawIntertitle(ctx, parts[pi + 1], t);
        return;
      }
      t -= INTERLUDE;
    }
  }

  drawOutro(ctx, clamp(time - INTRO - partsRun(parts) - INTERLUDE * (parts.length - 1), 0, OUTRO), opts.outroSub, opts.outroNote);
}
