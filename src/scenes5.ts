// الجزء الثاني — المشاهد ١٠ و١١ و١٢: الصدع · العالم المقلوب · الحقيقة
import {
  COLORS, GROUND, HIP, H, W, PI, clamp, cos, ease, glow, lerp, mix, prog, rnd, say, sin, text,
  drawStick, pose, mixPose, impact, dust, torch,
} from './engine';
import type { Scene } from './engine';
import { archiveBg, crystal, floatingPlatform, invertedWorld, rift, sealRune, bigTitle } from './part2art';

const B = COLORS.blue, R = COLORS.red, Y = COLORS.yellow, K = COLORS.black;

function beam(
  ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w: number, color: string, t: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = w * 2.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = w * (1 + 0.12 * sin(t * 40));
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = w * 0.4;
  ctx.stroke();
  ctx.restore();
}

/* ============================ المشهد 10: الصدع ============================ */
const scene10: Scene = {
  id: 10,
  title: 'الصدع',
  desc: 'الأحمر يفتح البوابة',
  icon: '⚡',
  duration: 22,
  lines: [
    { at: 0, text: 'وفجأة... يقتحم الأحمر القاعة مسرعًا!' },
    { at: 2.8, text: 'ضربة قوية تُسقط الأزرق أرضًا... ويخطف الأحمر المفتاح!' },
    { at: 6.2, text: '«القوة لي... أخيرًا!» يصرخ الأحمر ويضرب المفتاح في أرض القاعة.' },
    { at: 8.8, text: 'تشتعل النقوش... ويتفتّح صدعٌ في الهواء نفسه! 🌌' },
    { at: 12.2, text: 'ريح هائلة تجذب الجميع نحو الصدع... لا مفر!' },
    { at: 16.6, text: 'الأصدقاء يتشبثون بكل ما يجدونه... لكن الريح أقوى.' },
    { at: 19.2, text: 'ثم... يبتلع الظلام الجميع. ⬛' },
  ],
  draw(ctx, t) {
    archiveBg(ctx, t);

    const pull = ease(prog(t, 13, 18));
    const sway = sin(t * 3) * pull * 10;

    // الأحمر يندفع
    let rx = 940;
    let rPose = pose.run(t);
    let rDir: 1 | -1 = -1;
    let rRot = 0;
    if (t > 2.6) {
      rx = 620;
      rPose = t < 3.4 ? pose.punch(ease(prog(t, 2.6, 3.4))) : pose.idle(t);
      if (t > 6.4 && t < 7.9) rPose = pose.crouch();
      if (t >= 7.9) rPose = mixPose(pose.crouch(), { ...pose.push(t), lean: 0.9 }, 0.7);
      if (t > 9.4) rPose = pose.cheer(t);
      if (t > 13) {
        rRot = lerp(0, -0.5, pull);
      }
    } else {
      rx = lerp(960, 620, ease(clamp(t / 2.6)));
      rPose = pose.run(t);
    }

    // الأزرق
    let bx = 330;
    let bPose: typeof rPose = pose.idle(t);
    let bRot = 0;
    if (t > 2.6 && t < 5.2) bPose = pose.hurt(t);
    else if (t > 5.2 && t < 7) bPose = mixPose(pose.hurt(t), pose.idle(t), ease(prog(t, 5.2, 7)));
    else if (t > 7 && t < 10) bPose = pose.flail(t);
    else if (t > 10) bPose = mixture(t);
    if (t > 13) bRot = lerp(0, 0.6, pull);
    if (t > 10) bx = lerp(330, 300, prog(t, 10, 13));

    // الأصفر والأسود
    const yPose = t > 9 ? pose.flail(t + 0.5) : pose.idle(t + 1);
    const kPose = t > 9 ? { ...pose.cast(t), lean: 0.05 } : pose.stand(t * 0.8);
    const yRot = t > 13 ? -0.4 * pull : 0;
    const kRot = t > 13 ? 0.35 * pull : 0;

    // الصدع في الهواء
    const open = ease(prog(t, 8.6, 12.5));
    if (open > 0) {
      ctx.save();
      glow(ctx, 480, 200, 260 * open, '#4c1d95', 0.7);
      rift(ctx, 480, 200, 470, open, t, true);
      ctx.restore();
      // شفط: خطوط سرعة
      ctx.save();
      ctx.strokeStyle = 'rgba(196,181,253,.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * PI * 2 + t * 0.6;
        const r0 = 60 + rnd(i) * 120;
        const r1 = r0 + 70 * open;
        ctx.beginPath();
        ctx.moveTo(480 + cos(a) * r1, 200 + sin(a) * r1 * 0.8);
        ctx.lineTo(480 + cos(a) * r0, 200 + sin(a) * r0 * 0.8);
        ctx.stroke();
      }
      ctx.restore();
    }

    // الأرض تتشقق عند الضربة
    if (t > 7.9) {
      const uv = prog(t, 7.9, 9.4);
      ctx.save();
      ctx.strokeStyle = `rgba(167,139,250,${0.9 * (1 - uv * 0.4)})`;
      ctx.lineWidth = 3 + 3 * (1 - uv);
      ctx.shadowColor = '#a78bfa';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(480, GROUND);
      for (let i = 0; i < 6; i++) {
        const x = 480 + (i - 2.5) * 34 * uv;
        ctx.lineTo(x, GROUND - 8 - (i % 2) * 12);
      }
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(480, GROUND - 2);
      ctx.scale(1, 0.34);
      sealRune(ctx, 0, 0, 90 * uv, t * 0.8, 0.85, '#c4b5fd');
      ctx.restore();
    }

    const lift = pull * 90;
    drawStick(ctx, {
      x: 120, y: HIP - lift * 1.15 + sway, color: K, dir: 1, pose: kPose, rot: kRot,
      glow: 'rgba(192,132,252,.95)',
    });
    drawStick(ctx, {
      x: 205, y: HIP - lift * 1.05 - sway, color: Y, dir: 1, pose: yPose, rot: yRot,
      glow: 'rgba(250,204,21,.4)',
    });
    const bOut = drawStick(ctx, {
      x: bx, y: HIP - lift * 1.2, color: B, dir: 1, pose: bPose, rot: bRot,
      glow: 'rgba(59,130,246,.5)',
    });
    const rOut = drawStick(ctx, {
      x: rx, y: HIP - lift * 1.1, color: R, dir: rDir, pose: rPose, rot: rRot,
      glow: 'rgba(239,68,68,.6)',
    });

    // المفتاح: مع الأزرق ثم يخطفه الأحمر ثم يُغرس في الأرض
    if (t < 3.2) crystal(ctx, bOut.hand.x, bOut.hand.y - 8, 0.7, '#fbbf24', t);
    else if (t < 6.2) {
      const u = ease(prog(t, 3.2, 4.2));
      crystal(ctx, lerp(bOut.hand.x, rOut.hand.x, u), lerp(bOut.hand.y - 8, rOut.hand.y - 6, u), 0.7, '#fbbf24', t);
    } else if (t < 7.9) {
      const u = ease(prog(t, 6.2, 7.8));
      crystal(ctx, rOut.hand.x, lerp(rOut.hand.y - 6, GROUND - 10, u), 0.7, '#fbbf24', t);
    }
    if (t > 7.9 && t < 9.6) dust(ctx, 480, GROUND, t, 7.9, 12, 110);

    impact(ctx, rOut.hand.x, bOut.head.y, t, 2.9, 1.5);
    impact(ctx, 480, GROUND - 6, t, 7.9, 2);

    say(ctx, t, 2.8, 5.6, 620, HIP - 80, 'أعطني المفتاح أيها الأحمق!', R, 17);
    say(ctx, t, 6.2, 8.8, 620, HIP - 80, 'القوة لي... أخيرًا!', R, 18);
    say(ctx, t, 9.0, 12, 300, HIP - 90, 'ماذا فعلت؟! أغلقته الآن!', B, 17);
    say(ctx, t, 13.4, 17.4, 120, HIP - 130, 'لا تقاوموا... الصدع أقوى!', '#7c3aed', 17);
    void [mix, torch, bigTitle];
  },
};

/** وضعية الأزرق بعد فتح الصدع */
function mixture(t: number) {
  return t < 12 ? mixPose(pose.flail(t), pose.idle(t), ease(prog(t, 10, 12))) : pose.flail(t);
}

/* ============================ المشهد 11: العالم المقلوب ============================ */
const scene11: Scene = {
  id: 11,
  title: 'العالم المقلوب',
  desc: 'مدينة معلّقة بلا جاذبية',
  icon: '🌌',
  duration: 26,
  lines: [
    { at: 0, text: 'سقوط... سقوط لا ينتهي في فراغٍ بنفسجي. 🌌' },
    { at: 3.4, text: 'ثم يهبطون على منصة صخرية... في عالمٍ كل شيء فيه مقلوب!' },
    { at: 7.0, text: 'مدنٌ معلّقة من السماء، وقمرٌ يلمع في الأسفل... عالم مقلوب حقًا.' },
    { at: 11.2, text: 'الأصفر يشير إلى ثلاث بلورات تطفو في الأفق.' },
    { at: 14.2, text: '«ثلاث بلورات... بها يُعاد بناء الختم» — يشرح الأسود.' },
    { at: 18.2, text: 'الأزرق والأصفر والأسود يجذبون البلورات بكل قوتهم!' },
    { at: 23.0, text: 'تلمع البلورات على صدورهم... «الآن نواجهه» قال الأسود.' },
  ],
  draw(ctx, t) {
    const settle = ease(prog(t, 2.6, 6.2));
    ctx.save();
    // تدوير المشهد حتى يستقر بعد السقوط
    const roll = lerp(-0.55, 0, settle) + sin(t * 0.7) * 0.01;
    ctx.translate(W / 2, H / 2);
    ctx.rotate(roll);
    ctx.translate(-W / 2, -H / 2);

    invertedWorld(ctx, t, 1);
    floatingPlatform(ctx, 480, GROUND + 30, 760, t);

    // البلورات الثلاث
    const spots: [number, number][] = [[170, 150], [480, 108], [790, 158]];
    spots.forEach(([x, y], i) => {
      const fly = ease(prog(t, 17.8 + i * 0.5, 21 + i * 0.5));
      const tx = [300, 400, 250][i];
      const ty = 250;
      crystal(ctx, lerp(x, tx, fly), lerp(y, ty, fly) - sin(t * 1.4 + i) * 6 * (1 - fly), 0.6 + 0.5 * (1 - fly), ['#60a5fa', '#facc15', '#a78bfa'][i], t + i, 1);
    });

    // السقوط في البداية
    if (t < 4) {
      const fall = 1 - settle;
      const chars: [number, string, string][] = [
        [300, B, 'rgba(59,130,246,.5)'],
        [400, Y, 'rgba(250,204,21,.4)'],
        [230, K, 'rgba(192,132,252,.9)'],
      ];
      chars.forEach(([x, c, g], i) => {
        const y = lerp(-60 + i * 40, HIP, settle) - fall * 40;
        drawStick(ctx, {
          x: x as number, y: y as number, color: c as string, pose: pose.flail(t + i), rot: fall * (i % 2 ? 2.2 : -2.4),
          glow: g as string,
        });
      });
      // خطوط سرعة
      ctx.strokeStyle = `rgba(196,181,253,${0.4 * fall})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 18; i++) {
        const x = rnd(i) * W;
        const y = ((t * 900 + i * 90) % H);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 60);
        ctx.stroke();
      }
    } else {
      // بعد الهبوط
      let bx = 300, yx = 400, kx = 250;
      let bPose = pose.idle(t), yPose = pose.idle(t + 1), kPose = pose.stand(t * 0.8);
      if (t > 6.6 && t < 8) {
        bPose = pose.walk(t);
        yPose = pose.walk(t + 0.5);
        kPose = pose.walk(t + 0.9);
        bx = lerp(300, 330, prog(t, 6.6, 8));
        yx = lerp(400, 430, prog(t, 6.6, 8));
        kx = lerp(250, 280, prog(t, 6.6, 8));
      }
      if (t > 10.8 && t < 13) yPose = pose.wave(t);
      if (t > 17.6) {
        bPose = mixPose(pose.idle(t), pose.reachUp(t), ease(prog(t, 17.6, 19)));
        yPose = mixPose(pose.wave(t), pose.cheer(t), ease(prog(t, 18.2, 19.6)));
        kPose = pose.cast(t);
      }
      drawStick(ctx, { x: kx, y: HIP, color: K, dir: 1, pose: kPose, glow: 'rgba(192,132,252,.95)' });
      drawStick(ctx, { x: yx, y: HIP, color: Y, dir: -1, pose: yPose, glow: 'rgba(250,204,21,.45)' });
      const bOut = drawStick(ctx, { x: bx, y: HIP, color: B, dir: 1, pose: bPose, glow: 'rgba(59,130,246,.5)' });

      // البلورة الثالثة تصل إلى يد الأزرق
      const got = ease(prog(t, 22.4, 23.6));
      if (got > 0) {
        crystal(ctx, bOut.hand.x, bOut.hand.y - 10, 0.5, '#60a5fa', t, got);
        glow(ctx, (bOut.hip.x + bOut.head.x) / 2, (bOut.hip.y + bOut.head.y) / 2, 60 * got, '#60a5fa', 0.5 * got);
      }
    }
    ctx.restore();

    void [mix, text];
  },
};

/* ============================ المشهد 12: الحقيقة ============================ */
const scene12: Scene = {
  id: 12,
  title: 'الحقيقة',
  desc: 'سرّ الأسود وندم الأحمر',
  icon: '💜',
  duration: 24,
  lines: [
    { at: 0, text: 'على المنصة العائمة... يبدأ الأسود يحكي حكايته.' },
    { at: 3.6, text: '«أنا آخر حرّاس الختم... فشلتُ في حمايته منك يا أحمر».' },
    { at: 7.6, text: 'الأحمر يظهر من الحافة، مرعوبًا لأول مرة في حياته.' },
    { at: 11.0, text: '«الحارس الفارغ همس في أذنك... الطمع كان بابه إلى عالمنا».' },
    { at: 15.4, text: 'الأحمر يصمت... ثم يمدّ يده بالمفتاح: «خذوه... أنا آسف».' },
    { at: 18.6, text: 'تتجمع الألوان الأربعة... ويلمع الختم من جديد!' },
    { at: 21.6, text: 'لكن خلفهم... ينهض ظلٌّ هائل. الحارس الفارغ قد استيقظ. ⬛' },
  ],
  draw(ctx, t) {
    invertedWorld(ctx, t * 0.6, 0.6);
    floatingPlatform(ctx, 480, GROUND + 30, 780, t);

    // ظل الحارس ينهض في الخلفية
    const rise = ease(prog(t, 20.6, 24));
    if (rise > 0) {
      ctx.save();
      ctx.globalAlpha = 0.5 * rise;
      ctx.fillStyle = '#0d0620';
      ctx.beginPath();
      ctx.ellipse(480, 300 + (1 - rise) * 260, 150, 210 * rise + 60, 0, 0, PI * 2);
      ctx.fill();
      ctx.restore();
      [-22, 22].forEach((dx) => {
        glow(ctx, 480 + dx, 210 + (1 - rise) * 200, 30, '#f0abfc', 0.8 * rise);
      });
    }

    // الشخصيات
    const kx = 200, yx = 720, bx = 350, rx = 600;
    const kPose = t > 15.4 ? pose.think(t) : pose.stand(t * 0.8);
    const yPose = t > 15.4 ? pose.cheer(t * 0.6) : pose.idle(t + 1);
    const bPose = t > 15.4 && t < 18.4 ? pose.reachUp(t) : pose.idle(t);
    const rPose = t < 7.4 ? mixPose(pose.crouch(), pose.idle(t), ease(prog(t, 7.4, 9))) : t < 15.4 ? pose.hurt(t * 0.5) : mixPose(pose.hurt(t * 0.5), pose.idle(t), ease(prog(t, 15.4, 17)));

    drawStick(ctx, { x: kx, y: HIP, color: K, dir: 1, pose: kPose, glow: 'rgba(192,132,252,.95)' });
    drawStick(ctx, { x: yx, y: HIP, color: Y, dir: -1, pose: yPose, glow: 'rgba(250,204,21,.45)' });
    const bOut = drawStick(ctx, { x: bx, y: HIP, color: B, dir: 1, pose: bPose, glow: 'rgba(59,130,246,.5)' });
    const rOut = drawStick(ctx, { x: rx, y: HIP, color: R, dir: -1, pose: rPose, glow: 'rgba(239,68,68,.45)' });

    // المفتاح ينتقل من الأحمر إلى الأزرق
    if (t < 17.6) {
      crystal(ctx, rOut.hand.x + 10, rOut.hand.y - 6, 0.6, '#fbbf24', t);
    } else if (t < 19.4) {
      const u = ease(prog(t, 17.6, 19.2));
      crystal(ctx, lerp(rOut.hand.x, bOut.hand.x, u), lerp(rOut.hand.y - 6, bOut.hand.y - 10, u), 0.6, '#fbbf24', t);
    } else {
      crystal(ctx, bOut.hand.x, bOut.hand.y - 10, 0.6, '#fbbf24', t);
    }

    // الختم يتشكّل فوقهم بالألوان الأربعة
    const seal = ease(prog(t, 18.6, 22));
    if (seal > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      sealRune(ctx, 480, 140, 92 * seal, t * 0.4, 0.45 * seal, '#c4b5fd');
      ctx.restore();
      const colors = [B, R, Y, '#a78bfa'];
      colors.forEach((c, i) => {
        const fx = i === 0 ? bOut.hand.x : i === 1 ? rOut.hand.x : i === 2 ? yx : kx;
        const fy = i === 0 ? bOut.hand.y : i === 1 ? rOut.hand.y : HIP - 60;
        beam(ctx, fx, fy, 480 + cos((i / 4) * PI * 2) * 40, 140 + sin((i / 4) * PI * 2) * 40, 2.4, c, t + i);
      });
    }

    say(ctx, t, 3.8, 7.2, kx, HIP - 80, 'أنا آخر حرّاس الختم... وقد فشلت.', '#7c3aed', 16);
    say(ctx, t, 7.6, 10.8, rx, HIP - 80, 'أين... أين نحن؟!', R, 17);
    say(ctx, t, 11.2, 15.0, kx, HIP - 80, 'الطمع كان بابه... والحارس همس في أذنك.', '#7c3aed', 16);
    say(ctx, t, 15.6, 18.4, rx, HIP - 80, 'خذوه... أنا آسف حقًا.', R, 17);
    say(ctx, t, 18.8, 21.4, bx, HIP - 80, 'سنُغلقه معًا... جميعًا!', B, 17);

    bigTitle(ctx, 'الحقيقة', 'لكل قوةٍ ثمن... ولكل خطأ فرصة', prog(t, 0.3, 1.3) * (1 - prog(t, 3.4, 4.4)) * 0.95, '#c4b5fd');
    void [mix, dust, text];
  },
};

export const scenesE: Scene[] = [scene10, scene11, scene12];
