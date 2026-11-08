import {
  COLORS, GROUND, HIP, H, W, PI, sin, cos,
  Scene, clamp, lerp, ease, prog, rnd, kf, moving, mix,
  drawStick, pose, mixPose, sky, glow, text, say, dust, staff, pillar, torch,
} from './engine';

const B = COLORS.blue, Y = COLORS.yellow, K = COLORS.black;

/* ============================ المشهد 4: المعبد الغامض ============================ */
const BX: [number, number][] = [
  [0, 80], [3.4, 560], [3.9, 640], [4.5, 640], [5.0, 760], [5.4, 760], [5.9, 880], [8.5, 880], [10.6, 1250], [14.6, 1250], [18.0, 1960],
];
const YX: [number, number][] = [[0, -20], [3.4, 470], [8.8, 470], [12.2, 1290], [14.8, 1290], [18, 1840]];
const PLATES = [640, 760, 880];
const PLATE_T = [3.9, 5.0, 5.9];
const HOPS: [number, number][] = [[3.4, 3.9], [4.5, 5.0], [5.4, 5.9]];

function door(
  ctx: CanvasRenderingContext2D, cx: number, w: number, h: number, lift: number, gold: boolean, t: number,
) {
  const top = GROUND - h;
  // الفتحة
  const g = ctx.createLinearGradient(0, top, 0, GROUND);
  g.addColorStop(0, '#05030a');
  g.addColorStop(1, lift > 0.5 ? '#2a1a05' : '#05030a');
  ctx.fillStyle = g;
  ctx.fillRect(cx - w / 2, top, w, h);
  if (lift > 0.1) glow(ctx, cx, GROUND - 60, 160, '#b45309', clamp(lift) * 0.5);
  // اللوح
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - w / 2, top, w, h);
  ctx.clip();
  const py = top - lift * (h - 6);
  ctx.fillStyle = '#6a6285';
  ctx.fillRect(cx - w / 2, py, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = 3;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, py + (h / 5) * i);
    ctx.lineTo(cx + w / 2, py + (h / 5) * i);
    ctx.stroke();
  }
  ctx.fillStyle = gold ? '#fbbf24' : '#a8a0c8';
  ctx.beginPath();
  ctx.arc(cx, py + h * 0.4, w * 0.2, 0, PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b1530';
  ctx.beginPath();
  ctx.arc(cx, py + h * 0.4, w * 0.1 + sin(t * 3) * 1.5, 0, PI * 2);
  ctx.fill();
  ctx.restore();
  // الإطار
  ctx.fillStyle = '#4a4468';
  ctx.fillRect(cx - w / 2 - 22, top - 26, 22, h + 26);
  ctx.fillRect(cx + w / 2, top - 26, 22, h + 26);
  ctx.fillRect(cx - w / 2 - 30, top - 38, w + 60, 24);
  if (gold) {
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - w / 2 - 30, top - 18, w + 60, 4);
  }
}

const scene4: Scene = {
  id: 4,
  title: 'المعبد الغامض',
  desc: 'ألغاز وأبواب عملاقة والعصا الذهبية',
  icon: '🏛️',
  duration: 24,
  lines: [
    { at: 0, text: 'أخيراً... معبد العصا الذهبية! الأزرق والأصفر يدخلان بحذر 🕯️' },
    { at: 3.2, text: 'أول لغز: ألواح الرموز... لا بد من الضغط عليها بالترتيب الصحيح!' },
    { at: 6.2, text: 'الرموز تضيء... والباب العملاق الأول يرتفع ببطء!' },
    { at: 10.8, text: 'اللغز الثاني: رافعة سرية! الأصفر يتولى المهمة.' },
    { at: 13.4, text: 'الباب الذهبي الضخم ينفتح بهدير مخيف...' },
    { at: 16.2, text: 'وهناك... فوق منصة مضيئة... العصا الذهبية! ✨' },
    { at: 19.2, text: 'عندما يلمسها الأزرق... تهتز الأرض كلها!! 💥' },
  ],
  draw(ctx, t) {
    const bxw = kf(t, BX, true);
    const cam = clamp(bxw - 330, 0, 1120);
    const shakeA = t > 19.2 ? clamp((t - 19.2) * 12, 0, 12) : 0;
    ctx.save();
    if (shakeA > 0) ctx.translate((rnd(Math.floor(t * 40)) - 0.5) * shakeA, (rnd(Math.floor(t * 40) + 7) - 0.5) * shakeA);
    sky(ctx, '#17122a', '#2b2142');
    // الجدار الخلفي
    const wo = cam * 0.8;
    ctx.fillStyle = 'rgba(255,255,255,.04)';
    for (let r = 0; r < 8; r++) {
      for (let c = -1; c < 14; c++) {
        const x = c * 120 - (wo % 120) + (r % 2) * 60;
        ctx.fillRect(x, r * 56 + 20, 112, 50);
      }
    }
    // أعمدة وشعلات
    for (let i = 0; i < 12; i++) {
      const wx = i * 230 + 100;
      const sx = wx - cam;
      if (sx < -80 || sx > W + 80) continue;
      pillar(ctx, sx, 80, GROUND, 50, '#4d4670');
      torch(ctx, sx + 115, 230, t);
    }
    // رموز ذهبية على الجدار
    ctx.strokeStyle = 'rgba(251,191,36,.25)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const sx = i * 230 + 215 - cam;
      if (sx < -50 || sx > W + 50) continue;
      ctx.beginPath();
      ctx.arc(sx, 130, 14, 0, PI * 2);
      ctx.moveTo(sx - 20, 130);
      ctx.lineTo(sx + 20, 130);
      ctx.stroke();
    }
    // الأرض
    ctx.fillStyle = '#3a3358';
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#5a5280';
    ctx.fillRect(0, GROUND, W, 8);
    ctx.fillStyle = 'rgba(0,0,0,.2)';
    for (let i = 0; i < 20; i++) ctx.fillRect(i * 100 - (cam % 100), GROUND + 8, 2, H - GROUND);

    // الأبواب
    const lift1 = ease(prog(t, 6.5, 8.5));
    const lift2 = ease(prog(t, 13.3, 15.8));
    door(ctx, 1000 - cam, 150, 330, lift1, false, t);
    door(ctx, 1500 - cam, 210, 370, lift2, true, t);
    if (t > 6.5 && t < 8.5) dust(ctx, 1000 - cam, GROUND, t, 6.6, 8, 90);
    if (t > 13.3 && t < 15.8) dust(ctx, 1500 - cam, GROUND, t, 13.4, 10, 130);

    // رموز اللغز فوق الباب 1
    PLATE_T.forEach((pt, i) => {
      const lit = t > pt;
      const sx = 940 + i * 60 - cam;
      ctx.save();
      ctx.translate(sx, 100);
      if (lit) glow(ctx, 0, 0, 50, ['#3b82f6', '#fbbf24', '#ef4444'][i], 0.8);
      ctx.fillStyle = lit ? ['#60a5fa', '#fde047', '#f87171'][i] : '#2a2540';
      ctx.strokeStyle = '#8b83b3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (i === 0) ctx.arc(0, 0, 18, 0, PI * 2);
      else if (i === 1) {
        ctx.rect(-16, -16, 32, 32);
      } else {
        ctx.moveTo(0, -20);
        ctx.lineTo(18, 14);
        ctx.lineTo(-18, 14);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
    // ألواح الضغط
    PLATES.forEach((px, i) => {
      const lit = t > PLATE_T[i];
      const sx = px - cam;
      ctx.fillStyle = lit ? ['#3b82f6', '#fbbf24', '#ef4444'][i] : '#2a2540';
      if (lit) glow(ctx, sx, GROUND, 70, ['#3b82f6', '#fbbf24', '#ef4444'][i], 0.7);
      ctx.fillRect(sx - 38, GROUND - (lit ? 3 : 9), 76, lit ? 3 : 9);
      ctx.strokeStyle = '#8b83b3';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 38, GROUND - (lit ? 3 : 9), 76, lit ? 3 : 9);
    });

    // الرافعة
    const lvx = 1335 - cam;
    ctx.fillStyle = '#2a2540';
    ctx.fillRect(lvx - 22, GROUND - 70, 44, 70);
    ctx.fillStyle = '#4a4468';
    ctx.fillRect(lvx - 22, GROUND - 14, 44, 14);
    const la = lerp(-0.8, 0.8, ease(prog(t, 12.6, 13.4)));
    ctx.save();
    ctx.translate(lvx, GROUND - 40);
    ctx.rotate(la);
    ctx.strokeStyle = '#d6b87a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -44);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -46, 8, 0, PI * 2);
    ctx.fill();
    ctx.restore();

    // المنصة والعصا
    const px = 1985 - cam;
    const lightA = prog(t, 15.5, 17);
    if (lightA > 0 || cam > 700) {
      // شعاع
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const bg = ctx.createLinearGradient(0, 0, 0, GROUND);
      bg.addColorStop(0, 'rgba(0,0,0,0)');
      bg.addColorStop(1, `rgba(251,191,36,${0.35 + 0.1 * sin(t * 4)})`);
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(px - 30, 0);
      ctx.lineTo(px + 30, 0);
      ctx.lineTo(px + 110, GROUND);
      ctx.lineTo(px - 110, GROUND);
      ctx.fill();
      ctx.restore();
    }
    // دائرة سحرية على الأرض
    ctx.save();
    ctx.strokeStyle = `rgba(251,191,36,${0.6 + 0.3 * sin(t * 3)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(px, GROUND + 4, 130, 16, 0, 0, PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(px, GROUND + 4, 90 + sin(t * 2) * 6, 11, 0, 0, PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#6a6285';
    ctx.fillRect(px - 36, GROUND - 64, 72, 64);
    ctx.fillStyle = '#8b83b3';
    ctx.fillRect(px - 44, GROUND - 74, 88, 12);
    const grabbed = t >= 19.1;

    // الأصفر
    const yx = kf(t, YX, true);
    let yp = moving(t, YX) ? pose.walk(t) : pose.idle(t + 2);
    if (t > 12.2 && t < 12.6) yp = pose.reachUp(t);
    if (t >= 12.3 && t < 13.5) {
      yp = { ...pose.idle(t), lean: 0.3, aF: [1.5, 0.2], aB: [1.2, 0.3], lF: [0.5, -0.1], lB: [-0.4, -0.1] };
      if (t > 12.6) yp = { ...yp, lean: -0.1 + 0.4 * (1 - ease(prog(t, 12.6, 13.4))), aF: [lerp(1.8, 0.9, ease(prog(t, 12.6, 13.4))), 0.1] };
    }
    if (t > 19.4) yp = pose.hurt(t);
    drawStick(ctx, { x: yx, y: HIP, color: Y, pose: yp, glow: 'rgba(250,204,21,.4)' });

    // الأزرق
    let by = HIP;
    let bp = moving(t, BX) ? pose.walk(t) : pose.idle(t);
    HOPS.forEach(([a, b]) => {
      if (t >= a && t < b) {
        const u = (t - a) / (b - a);
        by = HIP - sin(PI * u) * 50;
        bp = pose.jump(u);
      }
    });
    if (t >= 18.0 && t < 18.6) bp = pose.idle(t);
    if (t >= 18.6 && t < 19.1) {
      const u = (t - 18.6) / 0.5;
      by = HIP - sin(PI * u * 0.5) * 55;
      bp = mixPose(pose.idle(t), pose.reachUp(t), ease(u));
    } else if (grabbed) {
      by = HIP - 55 * clamp(1 - prog(t, 19.1, 19.6));
      bp = pose.reachUp(t * 4);
    }
    const bo = drawStick(ctx, { x: bxw - cam, y: by, color: B, pose: bp, glow: 'rgba(59,130,246,.5)' });
    if (!grabbed) {
      const float = sin(t * 2.5) * 6;
      staff(ctx, px, GROUND - 150 + float, 0, 80, 1, t);
    } else {
      staff(ctx, bo.hand.x, bo.hand.y + 8, 0, 80, 1.3, t);
    }

    // ركام ساقط
    if (t > 19.2) {
      for (let i = 0; i < 16; i++) {
        const ty = (((t - 19.2) * (320 + rnd(i) * 200) + rnd(i + 9) * 500) % 620) - 40;
        const tx = rnd(i + 20) * W;
        ctx.fillStyle = '#6a6285';
        ctx.fillRect(tx, ty, 8 + rnd(i + 2) * 14, 8 + rnd(i + 3) * 10);
      }
      // موجة الصدمة
      const s = prog(t, 19.1, 20.6);
      if (s > 0 && s < 1) {
        ctx.strokeStyle = `rgba(253,224,71,${1 - s})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(bo.hand.x, GROUND, s * 700, s * 70, 0, 0, PI * 2);
        ctx.stroke();
      }
    }
    // وميض
    const fl = t >= 19.1 ? 1 - prog(t, 19.1, 19.9) : 0;
    if (fl > 0) {
      ctx.fillStyle = `rgba(255,240,180,${fl * 0.85})`;
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }
    ctx.restore();

    // حوار
    const sxB = bxw - cam;
    say(ctx, t, 0.6, 2.6, sxB, HIP - 70, 'يا للروعة... المعبد حقيقي!', B);
    say(ctx, t, 6.6, 8.2, sxB, HIP - 70, 'نجح اللغز!', B);
    say(ctx, t, 11.0, 12.4, 1140 - cam, HIP - 70, 'سأسحب الرافعة!', '#a16207');
    say(ctx, t, 16.6, 18.2, sxB, HIP - 70, 'إنها هناك... العصا الذهبية!', B);
    say(ctx, t, 19.6, 21.6, yx - cam, HIP - 70, 'الأرض تهتز!!', '#a16207');
    say(ctx, t, 20.0, 22.4, bxw - cam + 10, HIP - 150, 'ما هذه القوة؟!', B);
  },
};

/* ============================ المشهد 5: ظهور الأسود ============================ */
const scene5: Scene = {
  id: 5,
  title: 'ظهور الأسود',
  desc: 'العصا ليست جائزة... إنها مفتاح',
  icon: '⚫',
  duration: 20,
  lines: [
    { at: 0, text: 'الأزرق يمسك العصا الذهبية... والمعبد كله يرتجف.' },
    { at: 2.4, text: 'فجأة... يظهر الستيكمان الأسود من بين الدخان! ⚫' },
    { at: 5.3, text: '«العصا ليست جائزة... إنها مفتاح لختم قديم.»' },
    { at: 9.2, text: 'الجدران تتحرك... والأعمدة تنهض من الأرض!' },
    { at: 11.4, text: 'يتحول المعبد إلى ساحة قتال ضخمة! ⚔️' },
    { at: 15.4, text: 'ومن بعيد... عينان حمراوان تلمعان في الظلام... 👀' },
  ],
  draw(ctx, t) {
    const g = ease(prog(t, 9, 13));
    const shake = t > 9 && t < 13.5 ? 4 : 1.2;
    ctx.save();
    ctx.translate((rnd(Math.floor(t * 40)) - 0.5) * shake, (rnd(Math.floor(t * 40) + 3) - 0.5) * shake);
    sky(ctx, mix('#2a2438', '#14081f', g), mix('#4a3f5e', '#4c0f6e', g));
    // جدار
    ctx.fillStyle = 'rgba(255,255,255,.04)';
    for (let r = 0; r < 8; r++) for (let c = -1; c < 9; c++) ctx.fillRect(c * 120 + (r % 2) * 60, r * 56 + 20, 112, 50);
    // أعمدة تنهض
    [90, 250, 710, 870].forEach((x, i) => {
      const h = 140 + lerp(0, 160, ease(prog(t, 9.5 + i * 0.3, 12.5 + i * 0.3)));
      pillar(ctx, x, GROUND - h, GROUND, 52, mix('#4d4670', '#3b2e63', g));
    });
    if (g < 0.8) {
      torch(ctx, 170, 230, t);
      torch(ctx, 790, 230, t);
    }
    // أرض
    ctx.fillStyle = mix('#3a3358', '#241638', g);
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = mix('#5a5280', '#6d28d9', g);
    ctx.fillRect(0, GROUND, W, 8);
    // شقوق
    if (g > 0) {
      ctx.strokeStyle = `rgba(192,132,252,${g})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        let x = 120 + i * 150, y = GROUND + 8;
        ctx.moveTo(x, y);
        for (let s = 0; s < 4; s++) {
          x += (rnd(i * 5 + s) - 0.5) * 50;
          y += 18;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // حلقة الساحة
      glow(ctx, 480, GROUND + 6, 330, '#7c3aed', 0.45 * g);
      ctx.strokeStyle = `rgba(216,180,254,${0.9 * g})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(480, GROUND + 8, 380, 30, 0, 0, PI * 2);
      ctx.stroke();
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * PI * 2 + t * 0.5;
        ctx.fillStyle = `rgba(216,180,254,${g})`;
        ctx.fillRect(480 + cos(a) * 340 - 3, GROUND + 8 + sin(a) * 26 - 3, 6, 6);
      }
    }
    // برق
    if (t > 11 && rnd(Math.floor(t * 4)) > 0.78) {
      ctx.fillStyle = 'rgba(216,180,254,.25)';
      ctx.fillRect(0, 0, W, H);
    }
    // الدخان الأسود
    const appear = prog(t, 2.4, 4.2);
    const bxk = kf(t, [[0, 770], [5.2, 770], [6.8, 650]], true);
    if (t > 1.4) {
      const sa = t < 4 ? prog(t, 1.4, 2.6) : 1 - prog(t, 4, 6);
      for (let i = 0; i < 26; i++) {
        const a = i * 0.9 + t * 3;
        const r = 20 + (i % 5) * 14 + sin(t * 2 + i) * 8;
        ctx.fillStyle = `rgba(${40 + (i % 3) * 20},10,${70 + (i % 4) * 25},${0.45 * sa})`;
        ctx.beginPath();
        ctx.arc(770 + cos(a) * r, HIP + 10 - (i % 7) * 12 + sin(a) * r * 0.4, 16 + (i % 4) * 6, 0, PI * 2);
        ctx.fill();
      }
    }
    // يظهر الأسود
    if (appear > 0) {
      const mv = t > 5.2 && t < 6.8;
      drawStick(ctx, {
        x: bxk, y: HIP, color: K, dir: -1, alpha: appear, scale: 0.7 + 0.3 * appear,
        pose: mv ? pose.walk(t, 0.6) : pose.idle(t * 0.8), glow: 'rgba(192,132,252,.9)',
      });
    }
    // الأصفر
    drawStick(ctx, {
      x: 330, y: HIP, color: Y, pose: t > 11 && t < 13.5 ? pose.hurt(t) : t > 2.6 ? { ...pose.idle(t), lean: -0.1 } : pose.idle(t),
      glow: 'rgba(250,204,21,.4)',
    });
    // الأزرق مع العصا
    const bo = drawStick(ctx, {
      x: 460, y: HIP, color: B, pose: t > 11 && t < 13.5 ? pose.hurt(t) : pose.idle(t + 1), glow: 'rgba(59,130,246,.5)',
    });
    staff(ctx, bo.hand.x + 2, bo.hand.y + 10, 0.05, 70, 1 + g * 0.6, t);
    // حوار
    say(ctx, t, 4.2, 5.3, 460, HIP - 70, 'من أنت؟!', B);
    say(ctx, t, 5.4, 9.2, bxk, HIP - 70, 'العصا ليست جائزة... إنها مفتاح لختم قديم.', '#7c3aed', 21);
    say(ctx, t, 9.4, 11.2, 460, HIP - 70, 'ختم؟! أي ختم؟!', B);
    say(ctx, t, 11.4, 13.4, 330, HIP - 70, 'المعبد يتحول!!', '#a16207');
    // عينان حمراوان
    const ea = prog(t, 14.6, 16.5);
    if (ea > 0) {
      const ex = 880, ey = 120;
      glow(ctx, ex, ey, 90 * ea, '#ef4444', 0.6 * ea);
      ctx.fillStyle = `rgba(255,60,60,${ea})`;
      ctx.beginPath();
      ctx.ellipse(ex - 16, ey, 12, 5 + 2 * sin(t * 3), -0.25, 0, PI * 2);
      ctx.ellipse(ex + 16, ey, 12, 5 + 2 * sin(t * 3), 0.25, 0, PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (t > 13.5 && t < 17.5) {
      const a = Math.min(prog(t, 13.5, 14.5), 1 - prog(t, 16.5, 17.5));
      ctx.globalAlpha = a;
      text(ctx, 'ساحة القتال الكبرى', W / 2, 60, 34, '#e9d5ff', '900');
      ctx.globalAlpha = 1;
    }
    void sin;
    void dust;
  },
};

export const scenesB: Scene[] = [scene4, scene5];
