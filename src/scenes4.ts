// الجزء الثاني — المشاهد ٨ و٩: الشرارة الأخيرة · أرشيف الأسلاف
import {
  COLORS, GROUND, HIP, H, W, PI, clamp, ease, glow, lerp, mix, prog, rnd, rr, say, sin, stars, text,
  drawStick, pose, mixPose, dust,
} from './engine';
import type { Scene } from './engine';
import { crystal, sealRune, archiveBg, bigTitle } from './part2art';

const B = COLORS.blue, R = COLORS.red, Y = COLORS.yellow, K = COLORS.black;

/** أنقاض معبد ليلية */
function darkRuins(ctx: CanvasRenderingContext2D, t: number, zoom = 1) {
  ctx.save();
  ctx.translate(W / 2, GROUND);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2, -GROUND);

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b0618');
  g.addColorStop(0.6, '#1c1338');
  g.addColorStop(1, '#2a1d45');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  stars(ctx, t * 0.5, 0.5, 40);

  // هيكل المعبد المنهار في الخلفية
  ctx.fillStyle = '#170f2b';
  ctx.beginPath();
  ctx.moveTo(120, GROUND);
  ctx.lineTo(120, 200);
  ctx.lineTo(200, 120);
  ctx.lineTo(330, 150);
  ctx.lineTo(360, 250);
  ctx.lineTo(420, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1f1638';
  ctx.beginPath();
  ctx.moveTo(600, GROUND);
  ctx.lineTo(620, 210);
  ctx.lineTo(700, 170);
  ctx.lineTo(820, 205);
  ctx.lineTo(860, GROUND);
  ctx.closePath();
  ctx.fill();

  // أعمدة مائلة
  ctx.fillStyle = '#302450';
  [{ x: 60, a: -0.42, h: 170 }, { x: 900, a: 0.5, h: 150 }, { x: 300, a: 0.2, h: 90 }].forEach((p) => {
    ctx.save();
    ctx.translate(p.x, GROUND);
    ctx.rotate(p.a);
    ctx.fillRect(-20, -p.h, 40, p.h);
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    ctx.fillRect(-20, -p.h, 10, p.h);
    ctx.fillStyle = '#302450';
    ctx.restore();
  });

  // أرضية
  ctx.fillStyle = '#1a1230';
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = 'rgba(167,139,250,.12)';
  ctx.fillRect(0, GROUND, W, 5);

  // حجارة متكسرة
  for (let i = 0; i < 12; i++) {
    const x = rnd(i) * W;
    const s = 10 + rnd(i + 3) * 22;
    ctx.fillStyle = '#2b2148';
    ctx.beginPath();
    ctx.moveTo(x - s, GROUND);
    ctx.lineTo(x - s * 0.3, GROUND - s);
    ctx.lineTo(x + s * 0.8, GROUND - s * 0.6);
    ctx.lineTo(x + s, GROUND);
    ctx.closePath();
    ctx.fill();
  }

  // ضباب
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = 'rgba(124,58,237,.06)';
    ctx.beginPath();
    ctx.ellipse(((t * 12 + i * 230) % 1300) - 150, GROUND - 16 + (i % 2) * 26, 190, 26, 0, 0, PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/* ============================ المشهد 8: الشرارة الأخيرة ============================ */
const scene8: Scene = {
  id: 8,
  title: 'الشرارة الأخيرة',
  desc: 'الأسود يكشف سرّ الشظية',
  icon: '💠',
  duration: 20,
  lines: [
    { at: 0, text: 'في العتمة... بين الأنقاض المتناثرة، ما زال ذلك الضوء الصغير يلمع. ✨' },
    { at: 3.2, text: 'الشظية ترتفع في الهواء... كأنها تنبض بالحياة.' },
    { at: 6.4, text: 'ثم يظهر الأسود من الظل: «هذه ليست شظية يا أزرق... إنها مفتاح».' },
    { at: 10.4, text: 'الأزرق يمدّ يده ويلتقط المفتاح... فيشعر بطاقة غريبة تسري في جسده.' },
    { at: 14.4, text: 'وفجأة... يظهر ختمٌ عملاق في سماء المعبد!' },
    { at: 17.2, text: '«الختم انكسر... والحارس يستيقظ» قال الأسود. «الوقت ينفد».' },
  ],
  draw(ctx, t) {
    const zoom = 1 + 0.45 * ease(prog(t, 0, 6)) - 0.45 * ease(prog(t, 15, 20));
    darkRuins(ctx, t, zoom);

    const fragX = 480;
    const fragY = GROUND - 18 - ease(prog(t, 2.6, 6)) * 150 - sin(t * 1.6) * 6;
    const lit = clamp(prog(t, 0, 1.2));

    // هالة الشظية
    glow(ctx, fragX, fragY, 150 * lit * (0.9 + 0.15 * sin(t * 4)), '#f59e0b', 0.75 * lit);

    // الظل الأسود يظهر
    const blackIn = ease(prog(t, 5.8, 7.6));
    if (blackIn > 0) {
      ctx.globalAlpha = blackIn;
      drawStick(ctx, {
        x: 660,
        y: HIP,
        color: K,
        dir: -1,
        pose: t > 8 ? mixPose(pose.idle(t * 0.8), { ...pose.idle(t), head: 0.16 }, 0.4) : pose.stand(t * 0.7),
        alpha: blackIn,
        glow: 'rgba(192,132,252,.95)',
      });
      glow(ctx, 660, HIP - 40, 90, '#7c3aed', 0.5 * blackIn);
      ctx.globalAlpha = 1;
    }
    if (t > 5.8 && t < 8.2) dust(ctx, 660, GROUND, t, 5.8, 10, 70);

    // الأزرق يدخل ثم يمد يده
    let bx = 240;
    let bp = pose.walk(t);
    let dir: 1 | -1 = 1;
    let rot = 0;
    if (t > 11.4) {
      bx = 545;
      dir = -1;
      bp = mixPose(pose.idle(t), pose.reachUp(t), ease(prog(t, 11.6, 12.8)));
      if (t > 13.2) bp = mixPose(pose.reachUp(t), pose.idle(t), ease(prog(t, 14.6, 15.6)));
    } else if (t > 9.2) {
      bx = kfPos(t);
      bp = pose.walk(t * 0.9);
    }
    const bOut = drawStick(ctx, {
      x: bx,
      y: HIP,
      color: B,
      dir,
      pose: bp,
      rot,
      glow: 'rgba(59,130,246,.5)',
    });
    // الشظية بين يديه بعد الالتقاط
    if (t > 12.6) {
      const u = ease(prog(t, 12.6, 14.2));
      crystal(ctx, lerp(fragX, bOut.hand.x, u), lerp(fragY, bOut.hand.y - 6, u), lerp(1.1, 0.85, u), '#fbbf24', t, 1);
      if (u < 1) glow(ctx, lerp(fragX, bOut.hand.x, u), lerp(fragY, bOut.hand.y - 6, u), 90, '#fde047', 0.6);
    } else {
      crystal(ctx, fragX, fragY, 1.1, '#fbbf24', t, lit);
    }

    // الختم في السماء
    const sky = ease(prog(t, 14.2, 17));
    if (sky > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      sealRune(ctx, W / 2, 150 - 10 * sin(t * 1.2), 118 * sky, t * 0.35, 0.55 * sky, '#c4b5fd');
      sealRune(ctx, W / 2, 150 - 10 * sin(t * 1.2), 74 * sky, -t * 0.5, 0.45 * sky, '#f0abfc');
      ctx.restore();
      // أشعة هابطة
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.16 * sky;
      ctx.fillStyle = '#a78bfa';
      for (let i = 0; i < 7; i++) {
        const x = 200 + i * 95;
        ctx.beginPath();
        ctx.moveTo(x, 240);
        ctx.lineTo(x + 26, 240);
        ctx.lineTo(x + 70, GROUND);
        ctx.lineTo(x + 10, GROUND);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    say(ctx, t, 6.6, 10.2, 660, HIP - 118, 'هذه ليست شظية... إنها مفتاحُ الختم!', '#7c3aed', 18);
    say(ctx, t, 10.6, 13.4, 545, HIP - 126, 'مفتاح؟ لأي شيء؟', B, 18);
    say(ctx, t, 17.0, 19.6, 660, HIP - 118, 'الختم انكسر... والحارس يستيقظ.', '#7c3aed', 17);

    // وميض عند الالتقاط
    if (t > 12.4 && t < 13.8) {
      const u = (t - 12.4) / 1.4;
      glow(ctx, bOut.hand.x, bOut.hand.y, 200 * (1 - u) + 30, '#fff7ed', (1 - u) * 0.9);
    }
    void [mix, rr, text];
  },
};

/** مشي الأزرق من موضعه إلى الشظية */
function kfPos(t: number) {
  const u = clamp((t - 9.2) / 2.2);
  return 240 + (545 - 240) * ease(u);
}

/* ============================ المشهد 9: أرشيف الأسلاف ============================ */
function muralOverlay(ctx: CanvasRenderingContext2D, t: number) {
  const a = ease(prog(t, 8.4, 9.4)) * (1 - prog(t, 15.2, 16));
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2, H / 2 + (1 - a) * 30);
  ctx.scale(0.86 + 0.14 * a, 0.86 + 0.14 * a);
  ctx.translate(-W / 2, -H / 2);

  // لوحة حجرية
  ctx.fillStyle = '#2c234c';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 40;
  rr(ctx, 120, 40, 720, 460, 18);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 4;
  ctx.stroke();

  sealRune(ctx, 480, 190, 96, t * 0.2, 0.9);
  // العصا في المنتصف
  ctx.save();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.shadowColor = '#fde047';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(480, 300);
  ctx.lineTo(480, 150);
  ctx.stroke();
  ctx.restore();

  // رمز العالم المقلوب
  ctx.strokeStyle = 'rgba(196,181,253,.75)';
  ctx.lineWidth = 3;
  [220, 740].forEach((x) => {
    ctx.strokeRect(x - 42, 290, 84, 60);
    for (let i = 0; i < 3; i++) ctx.strokeRect(x - 34 + i * 24, 250, 16, 40);
  });

  text(ctx, 'العصا مفتاح... والختم قفل', 480, 338, 29, '#fde047', '900');
  text(ctx, 'ومن يكسر القفل... يفتح الطريق للحارس', 480, 386, 21, '#e9d5ff', '700');
  text(ctx, '⬛', 480, 430, 26, '#fff', '700');
  ctx.restore();
}

const scene9: Scene = {
  id: 9,
  title: 'أرشيف الأسلاف',
  desc: 'سرّ الختم على الجدران',
  icon: '🏛️',
  duration: 24,
  lines: [
    { at: 0, text: 'يقود الأسود الأزرق والأصفر إلى أرشيف الأسلاف... قاعة تحفظ أسرار العالم.' },
    { at: 4.6, text: 'على اللوحة الحجرية نقوشٌ قديمة: العصا ليست قوة... بل مفتاح.' },
    { at: 8.4, text: '«الختم يفصل عالمنا عن العالم المقلوب... ومن يكسر القفل يفتح الطريق».' },
    { at: 12.4, text: 'هناك... في الأسفل، يرقد كيانٌ جائع اسمه: الحارس الفارغ. ⬛' },
    { at: 16.4, text: 'الأصفر يرتجف: «وماذا يريد هذا الحارس؟»' },
    { at: 18.4, text: '«أن يعود إلى عالمنا... وأحمر هو مفتاحه» — قال الأسود بحزن.' },
    { at: 21.2, text: 'وحينها... يلمع زوج من العيون الحمراء في العتمة! 👀' },
  ],
  draw(ctx, t) {
    archiveBg(ctx, t);

    // شخصيات داخل القاعة
    let bx = 120, yx = 190, kx = 270;
    let walking = t < 5.2;
    if (walking) {
      const u = clamp((t - 0.4) / 4.4);
      bx = lerp(90, 330, ease(u));
      yx = bx - 95;
      kx = bx - 190;
    } else {
      bx = 330;
      yx = 235;
      kx = 140;
    }
    const bPose = walking ? pose.walk(t * 0.9) : t > 16.4 ? pose.stand(t) : pose.idle(t);
    const yPose = walking ? pose.walk(t * 0.9 + 0.4) : t > 16.0 && t < 18.4 ? pose.flail(t) : pose.idle(t + 1);
    const kPose = walking ? pose.walk(t * 0.85 + 0.8) : t > 12.4 ? pose.think(t) : pose.stand(t * 0.7);

    drawStick(ctx, { x: kx, y: HIP, color: K, dir: 1, pose: kPose, glow: 'rgba(192,132,252,.9)' });
    drawStick(ctx, { x: yx, y: HIP, color: Y, dir: 1, pose: yPose, glow: 'rgba(250,204,21,.4)' });
    drawStick(ctx, { x: bx, y: HIP, color: B, dir: 1, pose: bPose, glow: 'rgba(59,130,246,.5)' });

    // الأحمر في العتمة (يظهر في النهاية فقط)
    const ra = ease(prog(t, 20.6, 22.2));
    if (ra > 0) {
      ctx.save();
      ctx.globalAlpha = ra;
      const rOut = drawStick(ctx, { x: 860, y: HIP, color: R, dir: -1, pose: pose.crouch(), glow: 'rgba(239,68,68,.55)' });
      glow(ctx, rOut.head.x, rOut.head.y, 70, '#ef4444', 0.5 * ra);
      // عيون حمراء فقط في العتمة
      ctx.fillStyle = `rgba(255,90,90,${0.7 + 0.3 * sin(t * 8)})`;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 16;
      [-7, 4].forEach((d) => {
        ctx.beginPath();
        ctx.arc(rOut.head.x + d, rOut.head.y - 2, 2.8, 0, PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // وميض مشعل خفيف
    ctx.fillStyle = `rgba(251,146,60,${0.05 + 0.03 * sin(t * 9)})`;
    ctx.fillRect(0, 0, W, H);

    say(ctx, t, 1.2, 4.4, 330, HIP - 110, 'ما هذا المكان؟', B, 18);
    say(ctx, t, 4.6, 8.2, 150, HIP - 118, 'أرشيف الأسلاف... يحفظ الحقيقة.', '#7c3aed', 17);
    say(ctx, t, 12.6, 15.8, 150, HIP - 118, 'الحارس الفارغ... كيان لا يشبع.', '#7c3aed', 17);
    say(ctx, t, 16.6, 18.2, 235, HIP - 110, 'وماذا يريد؟!', '#a16207', 17);
    say(ctx, t, 18.4, 20.8, 150, HIP - 118, 'أن يعود... وأحمر هو مفتاحه.', '#7c3aed', 16);
    say(ctx, t, 21.4, 23.4, 330, HIP - 110, 'أحمر؟! كان يراقبنا!', B, 17);

    muralOverlay(ctx, t);
    bigTitle(ctx, 'الأرشيف', 'حيث تُحفظ أسرار الختم', prog(t, 0.4, 1.4) * (1 - prog(t, 3.2, 4)), '#c4b5fd');
    void [mix, text];
  },
};

export const scenesD: Scene[] = [scene8, scene9];
