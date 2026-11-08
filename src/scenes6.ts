// الجزء الثاني — المشهدان ١٣ و١٤: الحارس الفارغ · الختم من جديد
import {
  COLORS, GROUND, HIP, H, W, PI, clamp, cos, ease, glow, lerp, mix, prog, rnd, say, sin, text,
  drawStick, pose, mixPose, impact, dust, stars,
} from './engine';
import type { Scene } from './engine';
import { crystal, dawnField, floatingPlatform, invertedWorld, rift, sealRune, warden } from './part2art';

const B = COLORS.blue, R = COLORS.red, Y = COLORS.yellow, K = COLORS.black;

function beam(
  ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w: number, color: string, t: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = w * 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = w * (1 + 0.14 * sin(t * 45));
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1, w * 0.35);
  ctx.stroke();
  ctx.restore();
}

/* ============================ المشهد 13: الحارس الفارغ ============================ */
const scene13: Scene = {
  id: 13,
  title: 'الحارس الفارغ',
  desc: 'المعركة النهائية ضد الظل',
  icon: '⬛',
  duration: 30,
  lines: [
    { at: 0, text: 'ينهض الظل من أعماق العالم المقلوب... الحارس الفارغ! ⬛' },
    { at: 3.4, text: 'أذيال الظلام تنقضّ على الأبطال!' },
    { at: 6.2, text: 'الأصفر يصدّها برشاقة... والأسود يردّ بأشعة الختم.' },
    { at: 9.4, text: 'الأزرق والأحمر يهجمان معًا لأول مرة!' },
    { at: 13.6, text: 'لكن الحارس أسرع... يمسك بهم جميعًا!' },
    { at: 17.6, text: '«الألوان الأربعة معًا... هي مفتاح إغلاقه!» يصرخ الأسود.' },
    { at: 21.0, text: 'تجتمع القوى الأربع في شعاع واحد! ⚡' },
    { at: 25.4, text: 'الحارس الفارغ يتفتّت... والظلام يتراجع أخيرًا.' },
  ],
  draw(ctx, t) {
    // اهتزاز الشاشة أثناء القتال
    const shake = t > 9.4 && t < 27 ? (3 + 4 * prog(t, 20, 25)) * (1 - prog(t, 26, 27.4)) : 0;
    ctx.save();
    if (shake > 0) {
      ctx.translate(cos(t * 61) * shake, sin(t * 47) * shake);
    }

    invertedWorld(ctx, t * 0.8, 0.8);
    floatingPlatform(ctx, 480, GROUND + 40, 900, t);

    // الحارس
    const appear = ease(prog(t, 0, 3.2));
    const wScale = lerp(0.4, 1.25, appear);
    const wY = lerp(420, 250, appear);
    const hitFlash =
      (t > 9.6 && t < 10.2 ? 0.6 : 0) +
      (t > 12.4 && t < 12.9 ? 0.6 : 0) +
      (t > 21.6 ? 0.5 + 0.5 * sin(t * 30) : 0) * (1 - prog(t, 26.4, 28));
    const dying = prog(t, 25.6, 28.4);
    warden(ctx, 480, wY, wScale * (1 - dying * 0.25), t, appear * (1 - dying * 0.75), clamp(hitFlash));

    // أذيال تهاجم
    if (t > 3.4 && t < 9) {
      const u = prog(t, 3.4, 9);
      ctx.save();
      ctx.globalAlpha = 1 - u * 0.2;
      ctx.fillStyle = '#1b0f33';
      ctx.strokeStyle = '#2e1065';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(380, 300);
      ctx.quadraticCurveTo(300, 360 + sin(t * 6) * 20, 250, 400 - u * 40);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(600, 300);
      ctx.quadraticCurveTo(700, 340 + cos(t * 5) * 20, 740, 410 - u * 50);
      ctx.stroke();
      ctx.restore();
      impact(ctx, 250, 400, t, 5.4, 1.2);
      impact(ctx, 740, 410, t, 5.8, 1.2);
    }

    // الشخصيات
    const grabbed = ease(prog(t, 13.6, 16));
    const bY = HIP - grabbed * 120 + sin(t * 2) * 6 * grabbed;
    const rY = HIP - grabbed * 110 - sin(t * 2 + 1) * 6 * grabbed;

    let bx = 335;
    let bPose = t > 13.6 ? pose.flail(t) : t > 9.4 && t < 13.6 ? pose.run(t) : pose.idle(t);
    if (t > 9.4 && t < 12) bx = lerp(335, 425, ease(prog(t, 9.6, 12)));
    if (t > 12) bx = 425;
    if (t > 17.6) {
      bx = 360;
      bPose = poured(t, 0);
    }
    if (t > 12 && t < 13.6) bPose = pose.punch(prog(t, 12, 13.2));

    let rx = 690;
    let rPose = t > 13.6 ? pose.flail(t + 1) : t > 9.4 && t < 13.6 ? pose.run(t + 1) : pose.crouch();
    if (t > 9.4 && t < 12) rx = lerp(690, 610, ease(prog(t, 9.6, 12)));
    if (t > 12) rx = 610;
    if (t > 17.6) {
      rx = 640;
      rPose = poured(t, 1);
    }
    if (t > 12 && t < 13.6) rPose = pose.kick(prog(t, 12, 13.2));

    const yPose = t > 5.2 && t < 9 ? pose.flail(t * 1.4) : t > 17.6 ? poured(t, 2) : pose.stand(t);
    const kPose = t > 17.6 ? pose.cast(t) : t > 5.8 && t < 9 ? pose.cast(t) : pose.stand(t * 0.8);
    const yY = HIP - (t > 13.6 && t < 17.6 ? 40 * sin(t * 3) : 0);
    const kY = HIP - (t > 13.6 && t < 17.6 ? 30 * sin(t * 3 + 1) : 0);

    const kOut = drawStick(ctx, { x: 140, y: kY, color: K, dir: 1, pose: kPose, glow: 'rgba(192,132,252,.95)' });
    drawStick(ctx, { x: 215, y: yY, color: Y, dir: 1, pose: yPose, glow: 'rgba(250,204,21,.45)' });
    const bOut = drawStick(ctx, { x: bx, y: bY, color: B, dir: 1, pose: bPose, glow: 'rgba(59,130,246,.55)' });
    const rOut = drawStick(ctx, { x: rx, y: rY, color: R, dir: -1, pose: rPose, glow: 'rgba(239,68,68,.55)' });

    // أشعة الأسود على الأذيال
    const kBeam = ease(prog(t, 5.8, 6.4)) * (1 - prog(t, 8.4, 9));
    if (kBeam > 0) {
      ctx.save();
      ctx.globalAlpha = kBeam;
      beam(ctx, kOut.hand.x, kOut.hand.y - 10, 430, 310, 5, '#a78bfa', t);
      beam(ctx, kOut.handB.x, kOut.handB.y - 10, 520, 320, 4, '#c4b5fd', t + 1);
      ctx.restore();
    }

    impact(ctx, 380, 330, t, 9.9, 1.6);
    impact(ctx, 580, 340, t, 12.5, 1.6);

    // تجميع القوى الأربع في كرة طاقة واحدة
    const charge = ease(prog(t, 18.6, 21.6));
    if (charge > 0) {
      const tx = 480, ty = 335;
      const sources: [number, number, string][] = [
        [bOut.hand.x, bOut.hand.y, B],
        [rOut.hand.x, rOut.hand.y, R],
        [215, HIP - 40, Y],
        [120, HIP - 40, '#a78bfa'],
      ];
      sources.forEach(([x, y, c], i) => {
        beam(ctx, x, y - 10, tx, ty, 2.6 + i * 0.2, c, t + i);
        glow(ctx, x, y - 10, 34, c, 0.45 * charge);
      });

      // كرة الطاقة
      const orb = 16 + 46 * charge + sin(t * 9) * 4;
      const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, orb * 2.2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.35, 'rgba(233,213,255,.95)');
      g.addColorStop(0.7, 'rgba(167,139,250,.55)');
      g.addColorStop(1, 'rgba(124,58,237,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tx, ty, orb * 2.2, 0, PI * 2);
      ctx.fill();
      // حلقات حول الكرة
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const rp = orb * (1.1 + i * 0.5) + ((t * 60 + i * 30) % 40);
        ctx.globalAlpha = 0.5 - i * 0.12;
        ctx.beginPath();
        ctx.ellipse(tx, ty, rp, rp * 0.55, t * 0.6 + i, 0, PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // الانفجار النهائي
      const fire = ease(prog(t, 21.2, 22.4)) * (1 - 0.8 * ease(prog(t, 23.0, 25.0)));
      if (fire > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const blast = ctx.createRadialGradient(tx, ty, 0, tx, ty, 30 + 200 * fire);
        blast.addColorStop(0, 'rgba(255,255,255,.9)');
        blast.addColorStop(0.45, 'rgba(233,213,255,.6)');
        blast.addColorStop(1, 'rgba(124,58,237,0)');
        ctx.fillStyle = blast;
        ctx.beginPath();
        ctx.arc(tx, ty, 30 + 200 * fire, 0, PI * 2);
        ctx.fill();
        ctx.restore();
        for (let i = 0; i < 26; i++) {
          const u = ((t * 1.2 + rnd(i)) % 1) * fire;
          const a = rnd(i + 3) * PI * 2;
          ctx.fillStyle = `rgba(255,255,255,${(1 - u / Math.max(fire, 0.01)) * 0.9})`;
          ctx.fillRect(tx + cos(a) * u * 240, ty + sin(a) * u * 200, 4, 4);
        }
        glow(ctx, tx, ty, 260 * fire, '#a78bfa', 0.5);
      }
    }

    // تفتّت الحارس
    if (t > 25.6) {
      const u = prog(t, 25.6, 28.4);
      for (let i = 0; i < 40; i++) {
        const a = rnd(i) * PI * 2;
        const r = u * (120 + rnd(i + 5) * 260);
        ctx.fillStyle = `rgba(${i % 3 === 0 ? '240,171,252' : '124,58,237'},${(1 - u) * 0.9})`;
        ctx.fillRect(480 + cos(a) * r, 250 + sin(a) * r * 0.8, 4, 4);
      }
    }
    if (t > 27.6) {
      ctx.fillStyle = `rgba(255,255,255,${prog(t, 27.6, 29.4)})`;
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }

    say(ctx, t, 0.4, 3.2, 480, 120, 'أنا ما تبقّى من كل ختمٍ كُسر...', '#e9d5ff', 20);
    say(ctx, t, 7.0, 9.2, 190, HIP - 90, 'لن تمرّ!', '#a16207', 17);
    say(ctx, t, 11.0, 13.4, 380, HIP - 90, 'معًا يا أحمر!', B, 17);
    say(ctx, t, 17.8, 21, 140, HIP - 90, 'الألوان الأربعة... مفتاح إغلاقه!', '#7c3aed', 17);

    ctx.restore();
    void [mix, dust, stars];
  },
};

/** وضعية «بث القوة» */
function poured(t: number, i: number) {
  return mixPose(pose.cast(t + i), { ...pose.cheer(t + i), dy: 0 }, 0.35);
}

/* ============================ المشهد 14: الختم من جديد ============================ */
const scene14: Scene = {
  id: 14,
  title: 'الختم من جديد',
  desc: 'فجر جديد... ووعد',
  icon: '🌅',
  duration: 26,
  lines: [
    { at: 0, text: 'ينهار العالم المقلوب... ويعود الجميع إلى عالمهم.' },
    { at: 3.4, text: 'شمس الفجر تشرق على المرج... كأنها المرة الأولى.' },
    { at: 6.6, text: 'الأحمر ينظر إلى الأرض: «كنتُ سبب كل هذا... سامحوني».' },
    { at: 10.6, text: 'الأزرق يضع يده على كتفه: «الأهم أننا أصلحناه معًا».' },
    { at: 14.0, text: 'الأسود يغرس المفتاح في الأرض... ويُغلق الختم للأبد.' },
    { at: 17.8, text: '«سأبقى هنا حارسًا... هذه مهمتي الأخيرة» قال مبتسمًا.' },
    { at: 21.2, text: 'جسمه يتحول إلى نقشٍ مضيء يحرس المرج إلى الأبد. ✨' },
    { at: 23.4, text: 'وتُحفظ الأسطورة في الختم... إلى الأبد. 🔱' },
  ],
  draw(ctx, t) {
    if (t < 4.6) {
      // انهيار العالم المقلوب
      const collapse = ease(prog(t, 0.4, 4.6));
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(collapse * 0.25);
      ctx.scale(1 + collapse * 0.3, 1 + collapse * 0.3);
      ctx.translate(-W / 2, -H / 2);
      invertedWorld(ctx, t, 1 - collapse * 0.6);
      rift(ctx, 300 + collapse * 200, 200, 500, 1 - collapse * 0.7, t, true);
      rift(ctx, 700 - collapse * 250, 260, 420, 1 - collapse * 0.6, t + 1, true);
      // تطاير الحطام
      for (let i = 0; i < 30; i++) {
        const u = (t * 0.7 + rnd(i)) % 1;
        ctx.fillStyle = `rgba(196,181,253,${(1 - u) * 0.8})`;
        ctx.fillRect(rnd(i + 2) * W, 340 - u * 340, 4, 4);
      }
      ctx.restore();
      ctx.fillStyle = `rgba(255,252,238,${prog(t, 3.2, 4.6)})`;
      ctx.fillRect(0, 0, W, H);
    } else {
      // المرج عند الفجر
      const k = ease(prog(t, 4.6, 7.6));
      dawnField(ctx, t, k);

      const arm = ease(prog(t, 10.6, 11.8));
      const kneel = ease(prog(t, 13.4, 15));
      const fade = prog(t, 20.6, 23);

      // الأزرق
      const bOut = drawStick(ctx, {
        x: 320, y: HIP, color: B, dir: 1,
        pose: t > 10.6 ? { ...pose.idle(t), aF: [lerp(0.25, 1.1, arm), 0.3] } : pose.wave(t),
        glow: 'rgba(59,130,246,.5)',
      });
      // الأحمر
      drawStick(ctx, {
        x: 455, y: HIP, color: R, dir: 1,
        pose: t > 6.6 && t < 10.6 ? pose.think(t) : t > 10.6 ? pose.idle(t) : pose.wave(t + 0.5),
        glow: 'rgba(239,68,68,.4)',
      });
      // الأصفر
      drawStick(ctx, {
        x: 690, y: HIP, color: Y, dir: -1,
        pose: t > 12 ? pose.wave(t) : pose.cheer(t * 0.7),
        glow: 'rgba(250,204,21,.45)',
      });
      // الأسود
      const blackPose = t < 14 ? pose.wave(t * 0.8) : mixPose(pose.idle(t), pose.hang(0), kneel);
      const blackAlpha = 1 - fade;
      if (blackAlpha > 0.02) {
        const kOut = drawStick(ctx, {
          x: 575, y: HIP, color: K, dir: -1, pose: blackPose, alpha: blackAlpha,
          glow: 'rgba(192,132,252,.95)',
        });
        if (t < 14) crystal(ctx, kOut.hand.x, kOut.hand.y - 10, 0.6, '#fbbf24', t, blackAlpha);
      }

      // المفتاح يُغرس ويصبح ختمًا
      if (t > 14 && t < 22.4) {
        const drop = ease(prog(t, 14, 15.6));
        crystal(ctx, 540, lerp(HIP - 40, GROUND - 8, drop), 0.7, '#fbbf24', t, 1 - prog(t, 21.6, 22.6));
      }
      if (t > 15.6) {
        const g = ease(prog(t, 15.6, 18));
        ctx.save();
        ctx.translate(545, GROUND - 2);
        ctx.scale(1, 0.32);
        sealRune(ctx, 0, 0, 70 + 120 * g, t * 0.25, 0.35 + 0.45 * g, '#c4b5fd');
        ctx.restore();
        glow(ctx, 545, GROUND - 6, 160 * g, '#7c3aed', 0.3 * g);
        // جزيئات تصعد
        for (let i = 0; i < 18; i++) {
          const u = (t * 0.35 + rnd(i)) % 1;
          ctx.fillStyle = `rgba(253,224,71,${(1 - u) * 0.8 * g})`;
          ctx.fillRect(540 + (rnd(i + 6) - 0.5) * 120, GROUND - u * 220 * g, 3, 3);
        }
      }
      // يد الأزرق على كتف الأحمر
      if (t > 11.4) {
        ctx.save();
        ctx.strokeStyle = B;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bOut.hand.x, bOut.hand.y);
        ctx.lineTo(455, HIP - 44);
        ctx.stroke();
        ctx.restore();
      }

      say(ctx, t, 6.8, 10.2, 455, HIP - 120, 'سامحوني... كنتُ سبب كل هذا.', R, 17);
      say(ctx, t, 10.8, 13.6, 320, HIP - 120, 'الأهم أننا أصلحناه معًا.', B, 17);
      say(ctx, t, 14.2, 17.4, 575, HIP - 120, 'سأبقى هنا حارسًا... هذه مهمتي.', '#7c3aed', 16);
      say(ctx, t, 18.0, 20.8, 690, HIP - 120, 'لن ننساك أبدًا!', '#a16207', 17);

      // بطاقة النهاية
      const endA = prog(t, 23.0, 24.2);
      if (endA > 0) {
        ctx.fillStyle = `rgba(0,0,0,${0.55 * endA})`;
        ctx.fillRect(0, 140, W, 170);
        ctx.globalAlpha = endA;
        text(ctx, 'النهاية... حتى الآن 🔱', W / 2, 200, 50, '#fde047', '900');
        text(ctx, 'شكرًا لمتابعة «عصا التحكم الذهبية»', W / 2, 258, 24, '#fef3c7', '700');
        ctx.globalAlpha = 1;
      }
      const outA = prog(t, 24.6, 26);
      if (outA > 0) {
        ctx.fillStyle = `rgba(0,0,0,${outA})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
    void [mix, dust, stars];
  },
};

export const scenesF: Scene[] = [scene13, scene14];
