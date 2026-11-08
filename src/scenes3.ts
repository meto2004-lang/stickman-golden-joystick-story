import {
  COLORS, GROUND, HIP, H, W, PI, sin, cos,
  Scene, clamp, lerp, ease, prog, rnd, kf, moving, heading, mix,
  drawStick, pose, mixPose, sky, glow, text, say, impact, dust, staff, pillar, torch,
} from './engine';

const B = COLORS.blue, R = COLORS.red, Y = COLORS.yellow, K = COLORS.black;

function beam(
  ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w: number, color: string, t: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = w * 2.4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = w * (1 + 0.1 * sin(t * 40));
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = w * 0.4;
  ctx.stroke();
  ctx.restore();
}

function arenaBg(ctx: CanvasRenderingContext2D, t: number, dark = 1) {
  sky(ctx, mix('#2a2438', '#14081f', dark), mix('#4a3f5e', '#4c0f6e', dark));
  ctx.fillStyle = 'rgba(255,255,255,.035)';
  for (let r = 0; r < 8; r++) for (let c = -1; c < 9; c++) ctx.fillRect(c * 120 + (r % 2) * 60, r * 56 + 20, 112, 50);
  ctx.fillStyle = '#241638';
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = '#6d28d9';
  ctx.fillRect(0, GROUND, W, 8);
  glow(ctx, 480, GROUND + 6, 340, '#7c3aed', 0.35);
  ctx.strokeStyle = 'rgba(216,180,254,.7)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(480, GROUND + 8, 380, 30, 0, 0, PI * 2);
  ctx.stroke();
  void t;
}

/* ============================ المشهد 6: المعركة النهائية ============================ */
const RS = 1.45;
const RHIP = GROUND - 46 * RS;
const BALL_T = [4, 4.9, 5.8, 6.7];
const PLAT: { x: number; top: number }[] = [
  { x: 420, top: 340 }, { x: 560, top: 295 }, { x: 700, top: 335 },
];

const scene6: Scene = {
  id: 6,
  title: 'المعركة النهائية',
  desc: 'ضربات طاقة وتعاون الأبطال',
  icon: '⚡',
  duration: 26,
  lines: [
    { at: 0, text: 'الأحمر يعود... أقوى بكثير بعد أن سرق جزءاً من قوة العصا! 🔥' },
    { at: 3.8, text: 'كرات طاقة مدمّرة تنهال على الأبطال! قفزات سريعة للنجاة!' },
    { at: 7.0, text: 'الأعمدة تنهار من حولهم... والمعبد يتفكك!' },
    { at: 8.4, text: 'الأزرق يقفز بين الأعمدة المنهارة نحو الأحمر!' },
    { at: 12.2, text: 'لكن الأحمر يصده بضربة قوية ويطرحه أرضاً!' },
    { at: 14.4, text: 'الأصفر يهرع لنجدة صديقه... ويظهر الأسود بجانبهما!' },
    { at: 16.2, text: 'الأزرق والأصفر والأسود... معاً لإيقاف الأحمر! 💪' },
    { at: 18.0, text: 'ثلاث طاقات تتحد في شعاع واحد... في مواجهة طاقة الأحمر!' },
    { at: 20.4, text: 'الشعاع المتحد يخترق طاقة الأحمر... ويُفقده قوته المسروقة! 💥' },
    { at: 22.6, text: 'الأحمر على ركبتيه... والقوة المسروقة تعود إلى العصا.' },
  ],
  draw(ctx, t) {
    const rumble =
      (t > 6.8 && t < 7.8 ? 5 : 0) + (t > 9.8 && t < 10.8 ? 5 : 0) + (t > 12 && t < 12.6 ? 6 : 0) +
      (t > 17.5 && t < 21.5 ? 3 + 3 * prog(t, 17.5, 21) : 0) + 1;
    ctx.save();
    ctx.translate((rnd(Math.floor(t * 40)) - 0.5) * rumble, (rnd(Math.floor(t * 40) + 5) - 0.5) * rumble);
    arenaBg(ctx, t, 1);
    if (rnd(Math.floor(t * 5)) > 0.85) {
      ctx.fillStyle = 'rgba(216,180,254,.18)';
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }
    // أعمدة تنهار
    [{ x: 90, t0: 6.9, s: -1 }, { x: 870, t0: 9.9, s: 1 }].forEach((p) => {
      const u = prog(t, p.t0, p.t0 + 1.2);
      ctx.save();
      ctx.translate(p.x, GROUND);
      ctx.rotate(p.s * ease(u) * 1.45);
      pillar(ctx, 0, -300, 0, 52, '#3b2e63');
      ctx.restore();
      if (u > 0.6) dust(ctx, p.x + p.s * 160, GROUND, t, p.t0 + 0.8, 12, 120);
      if (u >= 1) {
        ctx.fillStyle = '#3b2e63';
        for (let i = 0; i < 6; i++) ctx.fillRect(p.x + p.s * (60 + i * 38), GROUND - 14 - (i % 2) * 8, 34, 16 + (i % 2) * 8);
      } else if (u < 0.01) {
        // لا شيء
      }
    });
    // منصات الأعمدة
    PLAT.forEach((p, i) => {
      const fall = i === 2 ? prog(t, 12.4, 13.2) : i === 1 ? prog(t, 13.2, 13.8) : 0;
      ctx.save();
      ctx.translate(0, fall * fall * 200);
      ctx.globalAlpha = 1 - fall;
      pillar(ctx, p.x, p.top, GROUND, 54, '#4d4670');
      ctx.restore();
      if (fall > 0 && fall < 0.15) dust(ctx, p.x, GROUND, t, 12.4 + i, 8, 70);
    });
    // حطام يتساقط
    for (let i = 0; i < 12; i++) {
      const ty = (((t * (240 + rnd(i) * 160)) + rnd(i + 9) * 600) % 640) - 40;
      ctx.fillStyle = '#6a6285';
      ctx.fillRect(rnd(i + 20) * W, ty, 6 + rnd(i + 2) * 12, 6 + rnd(i + 3) * 8);
    }

    /* ---------- الأحمر ---------- */
    let rx = 790, ry = RHIP, rs = RS, rp = pose.idle(t), rrot = 0, rglow = 'rgba(239,68,68,.9)';
    let redAngry = true;
    if (t < 3) {
      rx = kf(t, [[0, 1130], [3, 790]], true);
      rp = pose.walk(t, 0.7);
    } else if (t < 3.8) {
      rp = pose.idle(t);
    } else if (t < 8.9) {
      rp = ((t - 3.8) % 0.9) < 0.35 ? pose.cast(t) : pose.idle(t);
      if (t > 7.6) rp = pose.idle(t);
    } else if (t < 12.0) {
      rp = { ...pose.idle(t * 2), aF: [0.6 + sin(t * 3) * 0.3, 1.4], aB: [-0.2, 0.9] };
    } else if (t < 12.8) {
      rp = pose.punch((t - 12.2) / 0.5);
      if (t < 12.2) rp = pose.idle(t);
    } else if (t < 20.2) {
      rx = 790;
      rp = pose.idle(t);
      if (t >= 13.2) rp = pose.reachUp(t);
      if (t >= 17.5) rp = pose.cast(t);
    } else if (t < 21.4) {
      const u = (t - 20.2) / 1.2;
      rx = lerp(790, 900, ease(u));
      ry = lerp(RHIP, GROUND - 46, ease(prog(t, 20.4, 21.4))) - sin(PI * u) * 90;
      rs = lerp(RS, 1, ease(prog(t, 20.4, 21.4)));
      rp = pose.flail(t);
      rrot = -PI * 2 * ease(u);
      rglow = 'rgba(239,68,68,.4)';
    } else {
      rx = 900;
      rs = 1;
      ry = GROUND - 46 + 12;
      rp = mixPose(pose.hurt(t), pose.crouch(), 0.9);
      rp = { ...rp, dy: 0 };
      rglow = 'rgba(239,68,68,.1)';
      redAngry = false;
    }
    const strong = t < 20.3;
    if (strong && t > 0.5) glow(ctx, rx, ry - 50 * rs, 190, '#dc2626', 0.5 + 0.15 * sin(t * 9));

    /* ---------- الأبطال ---------- */
    // الأزرق
    let bx = 330, by = HIP, bp = pose.idle(t), brot = 0, blueStaff = false;
    {
      let jump = 0;
      BALL_T.forEach((ts) => {
        const a = ts + 0.45, b = ts + 1.25;
        if (t > a && t < b) {
          const u = (t - a) / (b - a);
          jump = sin(PI * u) * 75;
          bp = pose.jump(u);
        }
      });
      by = HIP - jump;
      if (t < 3) {
        bx = kf(t, [[0, 120], [2.2, 330]], true);
        bp = t < 2.2 ? pose.walk(t) : pose.idle(t);
      }
      if (t >= 8.3 && t < 12.3) {
        const bk: [number, number][] = [[8.3, 330], [9.0, 420], [9.4, 420], [10.1, 560], [10.5, 560], [11.2, 700], [11.4, 700], [12.0, 725]];
        bx = kf(t, bk);
        const hops: [number, number, number][] = [[8.3, 9.0, 294], [9.4, 10.1, 249], [10.5, 11.2, 289], [11.4, 12.0, 270]];
        by = HIP;
        bp = pose.idle(t);
        let found = false;
        hops.forEach(([a, b, ty], i) => {
          if (t >= a && t < b) {
            found = true;
            const u = (t - a) / (b - a);
            const y0 = i === 0 ? HIP : hops[i - 1][2];
            by = lerp(y0, ty, ease(u)) - sin(PI * u) * 55;
            bp = i === 3 ? (u < 0.4 ? pose.jump(u) : pose.kick(clamp((u - 0.35) / 0.55))) : pose.jump(u);
          }
        });
        if (!found) {
          if (t < 9.4) by = hops[0][2];
          else if (t < 10.5) by = hops[1][2];
          else if (t < 11.4) by = hops[2][2];
          else by = 270;
        }
      }
      if (t >= 12.0 && t < 13.2) {
        const u = (t - 12.0) / 1.2;
        if (t < 12.3) {
          bx = 725;
          by = 270;
          bp = pose.kick(1);
        } else {
          const v = (t - 12.3) / 0.9;
          bx = lerp(725, 330, ease(v));
          by = lerp(270, GROUND - 7, v * v) - sin(PI * v) * 60;
          brot = -PI * 2.5 * ease(v);
          bp = pose.flail(t);
        }
        void u;
      }
      if (t >= 13.2 && t < 16.3) {
        bx = 300;
        by = GROUND - 7;
        brot = -PI / 2 * 0.98;
        bp = pose.hurt(t * 0.4);
      }
      if (t >= 16.3 && t < 17.4) {
        const u = ease(prog(t, 16.3, 17.2));
        bx = 300;
        brot = lerp(-PI / 2 * 0.98, 0, u);
        by = GROUND - 46 * cos(brot) - 7 * sin(-brot);
        bp = pose.idle(t);
      }
      if (t >= 17.4) {
        bx = 300;
        by = HIP;
        bp = t < 20.4 ? pose.cast(t) : t < 21.6 ? pose.cast(t) : pose.idle(t);
        brot = 0;
        blueStaff = true;
      }
      if (t > 21.6) bp = pose.idle(t);
    }
    // الأصفر
    let yx = 230, yy = HIP, yp = pose.idle(t + 1);
    {
      let jump = 0;
      BALL_T.forEach((ts) => {
        const a = ts + 0.7, b = ts + 1.5;
        if (t > a && t < b) {
          const u = (t - a) / (b - a);
          jump = sin(PI * u) * 70;
          yp = pose.jump(u);
        }
      });
      yy = HIP - jump;
      if (t < 2.2) {
        yx = kf(t, [[0, 20], [2.2, 230]], true);
        yp = pose.walk(t);
      } else if (t >= 8.3 && t < 13.3) {
        yp = { ...pose.idle(t * 3), aF: [2.5 + sin(t * 9) * 0.2, 0.3], aB: [2.3, 0.3] };
        yy = HIP;
      } else if (t >= 13.3 && t < 14.3) {
        yx = kf(t, [[13.3, 230], [14.3, 235]], true);
        yp = pose.run(t);
      } else if (t >= 14.3 && t < 17.3) {
        yx = 235;
        yp = pose.hang(t);
        yp = { ...pose.idle(t), lean: 0.4, aF: [0.9, 0.2], aB: [0.7, 0.2] };
      } else if (t >= 17.3) {
        yx = kf(t, [[17.3, 235], [17.6, 210]]);
        yp = t < 21.6 ? pose.cast(t) : pose.cheer(t * 0.4);
        if (t > 21.6) yp = pose.idle(t);
      }
    }
    // الأسود
    const kApp = prog(t, 14.8, 15.7);
    const kx = 390;
    const kp = t >= 17.5 && t < 21.6 ? pose.cast(t) : pose.idle(t * 0.8);

    // رسم الأبطال والأحمر
    const ro = drawStick(ctx, {
      x: rx, y: ry, color: R, dir: -1, scale: rs, pose: rp, rot: rrot, angry: redAngry, glow: rglow,
    });
    const yo = drawStick(ctx, { x: yx, y: yy, color: Y, pose: yp, glow: 'rgba(250,204,21,.45)' });
    const bo = drawStick(ctx, { x: bx, y: by, color: B, pose: bp, rot: brot, glow: 'rgba(59,130,246,.5)' });
    let ko = { hand: { x: kx + 55, y: HIP - 35 }, handB: { x: 0, y: 0 }, head: { x: 0, y: 0 }, hip: { x: 0, y: 0 }, foot: { x: 0, y: 0 } };
    if (kApp > 0) {
      // دخان الظهور
      if (t < 16.5) {
        for (let i = 0; i < 14; i++) {
          const a = i * 1.3 + t * 4;
          ctx.fillStyle = `rgba(80,20,120,${0.5 * (1 - prog(t, 15.2, 16.5))})`;
          ctx.beginPath();
          ctx.arc(kx + cos(a) * (16 + i * 2), HIP - (i % 6) * 12 + sin(a) * 8, 14, 0, PI * 2);
          ctx.fill();
        }
      }
      ko = drawStick(ctx, { x: kx, y: HIP, color: K, pose: kp, alpha: kApp, glow: 'rgba(192,132,252,.95)' });
    }
    if (blueStaff && t < 21.6) staff(ctx, bo.hand.x, bo.hand.y, PI / 2, 60, 1.2, t);
    else if (t > 21.6) staff(ctx, bo.hand.x + 2, bo.hand.y + 10, 0.05, 70, 1.2, t);
    else if (t >= 13.2 && t < 17.4) staff(ctx, 380, GROUND - 6, 1.35, 60, 0.4, t);

    /* ---------- كرات الطاقة ---------- */
    BALL_T.forEach((ts) => {
      const u = (t - ts) / 0.95;
      if (u < 0 || u > 1.35) return;
      const x = lerp(700, -30, u / 1.0);
      const y = lerp(GROUND - 90, GROUND - 30, ease(Math.min(u, 1)));
      glow(ctx, x, y, 70, '#f97316', 0.9);
      ctx.fillStyle = '#fecaca';
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, PI * 2);
      ctx.stroke();
      // ذيل
      ctx.strokeStyle = 'rgba(249,115,22,.5)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 60, y - (1 - 0) * 4);
      ctx.stroke();
    });

    /* ---------- شحن كرة الأحمر ---------- */
    if (t >= 13.2 && t < 17.5) {
      const r = lerp(8, 62, prog(t, 13.2, 17.5));
      const ox = ro.hand.x, oy = ro.hand.y - 32 - r * 0.4;
      glow(ctx, ox, oy, r * 3, '#ef4444', 0.8);
      ctx.fillStyle = '#fee2e2';
      ctx.beginPath();
      ctx.arc(ox, oy, r * 0.7, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, PI * 2);
      ctx.stroke();
    }

    /* ---------- الأشعة ---------- */
    if (t >= 17.5 && t < 21.4) {
      const F = { x: 478, y: GROUND - 92 };
      const grow = prog(t, 17.5, 18.5);
      const cx = t < 20.2 ? lerp(560, 640, ease(prog(t, 18.2, 20.2))) : 640;
      const chest = { x: rx - 10, y: ry - 40 * rs };
      const hw = (4 + 14 * prog(t, 17.8, 20.2)) * grow;
      const col = [Y, B, '#c084fc'];
      [yo.hand, { x: bo.hand.x + 55, y: bo.hand.y }, ko.hand].forEach((h, i) => {
        beam(ctx, h.x, h.y, F.x, F.y + (i - 1) * 4, hw * 0.55, col[i], t);
      });
      if (t < 20.2) {
        beam(ctx, F.x, F.y, cx, F.y, hw * 1.5, '#e0f2fe', t);
        beam(ctx, ro.hand.x, ro.hand.y, cx, F.y, (4 + 14 * (1 - prog(t, 17.8, 20.2) * 0.4)) * grow * 1.3, '#f97316', t);
        glow(ctx, cx, F.y, 120, '#fff7ae', 1);
        for (let i = 0; i < 10; i++) {
          const a = i * 0.8 + t * 20;
          ctx.fillStyle = '#fde047';
          ctx.fillRect(cx + cos(a) * (20 + (t * 90 + i * 17) % 60), F.y + sin(a) * (20 + (t * 70 + i * 13) % 60), 4, 4);
        }
      } else {
        beam(ctx, F.x, F.y, chest.x, chest.y, hw * 1.7, '#ffffff', t);
        glow(ctx, chest.x, chest.y, 200 * (1 - prog(t, 20.2, 21.4)) + 60, '#ffffff', 1);
      }
    }
    // وميض الاصطدام
    if (t >= 20.2 && t < 21.0) {
      ctx.fillStyle = `rgba(255,255,255,${(1 - prog(t, 20.2, 21.0)) * 0.9})`;
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }
    // الطاقة المسروقة تعود إلى العصا
    if (t >= 20.5 && t < 22.4) {
      const u = ease(prog(t, 20.5, 22.2));
      const sx = lerp(ro.hip.x, bo.hand.x, u), sy = lerp(ro.hip.y - 40, bo.hand.y - 20, u) - sin(PI * u) * 130;
      glow(ctx, sx, sy, 80, '#fbbf24', 1);
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, PI * 2);
      ctx.fill();
    }
    if (t >= 22.2 && t < 23.2) glow(ctx, bo.hand.x, bo.hand.y - 20, 200 * (1 - prog(t, 22.2, 23.2)) + 40, '#fde047', 1);

    // تأثيرات
    dust(ctx, 330, GROUND, t, 13.1, 12, 100);
    impact(ctx, 745, 280, t, 12.0, 1.6);
    impact(ctx, 700, 300, t, 12.3, 1.3);
    dust(ctx, 900, GROUND, t, 21.3, 12, 90);
    ctx.restore();

    // حوار
    say(ctx, t, 3.0, 5.2, rx - 20, ry - 135, 'قوة العصا الآن لي!!', R);
    say(ctx, t, 5.4, 7.2, 330, HIP - 90, 'اقفزوا!!', B);
    say(ctx, t, 8.4, 10.5, 420, 230, 'سأوقفك أيها الأحمر!', B, 18);
    say(ctx, t, 13.4, 15.2, 235, HIP - 80, 'أزرق!! هل أنت بخير؟!', '#a16207');
    say(ctx, t, 15.8, 17.5, kx, HIP - 80, 'معاً... وبسرعة!', '#7c3aed');
    say(ctx, t, 17.6, 19.5, 300, HIP - 90, 'الآن!!!', B);
    say(ctx, t, 18.2, 20.2, rx - 20, ry - 135, 'مستحيل!! لا!!', R);
    say(ctx, t, 21.8, 23.8, 900, GROUND - 90, 'قوتي... ذهبت...', R);
    void [moving, heading, torch, text];
  },
};

/* ============================ المشهد 7: النهاية ============================ */
function ruins(ctx: CanvasRenderingContext2D, t: number, night: boolean) {
  if (night) {
    sky(ctx, '#05030d', '#1c1233');
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.7 * Math.abs(sin(t * 1.4 + i))})`;
      ctx.fillRect(rnd(i) * W, rnd(i + 50) * 300, 2, 2);
    }
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.arc(800, 90, 34, 0, PI * 2);
    ctx.fill();
    glow(ctx, 800, 90, 180, '#6366f1', 0.4);
  } else {
    sky(ctx, '#2a1f45', '#6b3a5e');
    glow(ctx, 480, 380, 380, '#f59e0b', 0.25);
  }
  // ظلال معبد منهار
  ctx.fillStyle = night ? '#0d0a1a' : '#241638';
  ctx.beginPath();
  ctx.moveTo(0, GROUND);
  ctx.lineTo(0, 330);
  ctx.lineTo(90, 300);
  ctx.lineTo(130, 350);
  ctx.lineTo(200, 270);
  ctx.lineTo(250, 340);
  ctx.lineTo(330, 380);
  ctx.lineTo(W - 330, 380);
  ctx.lineTo(W - 250, 330);
  ctx.lineTo(W - 190, 260);
  ctx.lineTo(W - 120, 345);
  ctx.lineTo(W - 70, 290);
  ctx.lineTo(W, 330);
  ctx.lineTo(W, GROUND);
  ctx.fill();
  // أعمدة مكسورة
  [150, 300, 660, 820].forEach((x, i) => {
    const h = 90 + rnd(i + 2) * 120;
    ctx.fillStyle = night ? '#171229' : '#3b2e63';
    ctx.beginPath();
    ctx.moveTo(x - 26, GROUND);
    ctx.lineTo(x - 26, GROUND - h);
    ctx.lineTo(x - 8, GROUND - h - 14);
    ctx.lineTo(x + 6, GROUND - h + 8);
    ctx.lineTo(x + 26, GROUND - h - 6);
    ctx.lineTo(x + 26, GROUND);
    ctx.fill();
  });
  ctx.fillStyle = night ? '#0f0b1d' : '#2c2147';
  ctx.fillRect(0, GROUND, W, H - GROUND);
  // أنقاض
  for (let i = 0; i < 34; i++) {
    const x = 480 + (rnd(i) - 0.5) * 760;
    const s = 10 + rnd(i + 3) * 30;
    const y = GROUND - s * 0.5 * (1 - Math.abs(x - 480) / 420);
    ctx.fillStyle = night ? (i % 2 ? '#1a1530' : '#221b3d') : i % 2 ? '#4d4670' : '#3b2e63';
    ctx.save();
    ctx.translate(x, y + 8);
    ctx.rotate((rnd(i + 8) - 0.5) * 0.9);
    ctx.fillRect(-s / 2, -s / 2, s, s * 0.7);
    ctx.restore();
  }
}

function meadow(ctx: CanvasRenderingContext2D, t: number) {
  sky(ctx, '#38bdf8', '#fef3c7');
  glow(ctx, 760, 120, 260, '#fbbf24', 0.7);
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(760, 120, 44, 0, PI * 2);
  ctx.fill();
  const cl = (x: number, y: number, s: number) => {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.ellipse(x, y, 46 * s, 16 * s, 0, 0, PI * 2);
    ctx.ellipse(x - 26 * s, y + 4 * s, 28 * s, 12 * s, 0, 0, PI * 2);
    ctx.ellipse(x + 28 * s, y + 5 * s, 30 * s, 12 * s, 0, 0, PI * 2);
    ctx.ellipse(x + 4 * s, y - 10 * s, 26 * s, 14 * s, 0, 0, PI * 2);
    ctx.fill();
  };
  cl(((200 + t * 10) % 1200) - 120, 100, 1);
  cl(((600 + t * 7) % 1200) - 120, 160, 0.8);
  // طيور
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const bx = ((t * 40 + i * 260) % 1100) - 80, by = 90 + i * 24 + sin(t * 3 + i) * 8;
    const f = sin(t * 10 + i) * 5;
    ctx.beginPath();
    ctx.moveTo(bx - 10, by - f);
    ctx.quadraticCurveTo(bx - 4, by - 5, bx, by);
    ctx.quadraticCurveTo(bx + 4, by - 5, bx + 10, by - f);
    ctx.stroke();
  }
  ctx.fillStyle = '#8fb1d9';
  ctx.beginPath();
  ctx.moveTo(0, 400);
  for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 330 - 70 * (0.5 + 0.5 * sin(x * 0.007 + 1)));
  ctx.lineTo(W, 440);
  ctx.lineTo(0, 440);
  ctx.fill();
  ctx.fillStyle = '#5cb85c';
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = '#72cc66';
  ctx.fillRect(0, GROUND, W, 10);
  for (let i = 0; i < 26; i++) {
    const fx = rnd(i + 1) * W, fy = GROUND + 20 + rnd(i + 2) * 70;
    ctx.fillStyle = ['#f472b6', '#fde047', '#ffffff', '#fb923c'][i % 4];
    ctx.beginPath();
    ctx.arc(fx, fy, 4, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2f7a36';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, fy + 4);
    ctx.lineTo(fx, fy + 12);
    ctx.stroke();
  }
}

const scene7: Scene = {
  id: 7,
  title: 'النهاية',
  desc: 'تدمير العصا... ولكن',
  icon: '✨',
  duration: 32,
  lines: [
    { at: 0, text: 'الغبار يهدأ... والأزرق يحدّق في العصا الذهبية بين يديه.' },
    { at: 2.6, text: 'يدرك الأزرق أن القوة الكبيرة... خطيرة جداً. ⚠️' },
    { at: 6.4, text: 'وبدلاً من الاحتفاظ بالعصا... يتخذ القرار الأصعب!' },
    { at: 9.4, text: 'يكسر العصا الذهبية ويدمّرها! 💥' },
    { at: 11.2, text: 'يتحول المعبد بأكمله إلى نور ساطع...' },
    { at: 15.8, text: 'ويعود الجميع إلى عالمهم بسلام. 🌿' },
    { at: 20.6, text: 'الأبطال يودّعون بعضهم... وتنتهي المغامرة.' },
    { at: 23.6, text: 'لكن... بين الأنقاض في العتمة...' },
    { at: 26.2, text: 'قطعة صغيرة من العصا ما زالت تلمع...' },
    { at: 29.0, text: 'يتبع... في الجزء الثاني 🔥' },
  ],
  draw(ctx, t) {
    if (t < 15.6) {
      // ----- ساحة المعبد المنهار -----
      ruins(ctx, t, false);
      // أعمدة مائلة
      ctx.fillStyle = '#3b2e63';
      [{ x: 70, a: -0.5 }, { x: 890, a: 0.45 }].forEach((p) => {
        ctx.save();
        ctx.translate(p.x, GROUND);
        ctx.rotate(p.a);
        ctx.fillRect(-24, -190, 48, 190);
        ctx.restore();
      });
      // أصفر
      drawStick(ctx, { x: 360, y: HIP, color: Y, pose: pose.idle(t + 1), glow: 'rgba(250,204,21,.4)' });
      // أسود
      drawStick(ctx, { x: 600, y: HIP, color: K, dir: -1, pose: t > 4.6 && t < 6.4 ? { ...pose.idle(t), head: 0.2 } : pose.idle(t * 0.8), glow: 'rgba(192,132,252,.9)' });
      // أحمر ضعيف
      const rp = mixPose(pose.crouch(), pose.idle(t), ease(prog(t, 3, 8)));
      drawStick(ctx, { x: 780, y: HIP, color: R, dir: -1, pose: { ...rp, lean: lerp(0.5, 0.15, prog(t, 3, 8)) }, glow: 'rgba(239,68,68,.25)' });
      // الأزرق
      let bp = pose.think(t);
      if (t > 6.4 && t < 9.4) bp = mixPose(pose.idle(t), pose.cast(t), ease(prog(t, 6.4, 8.2)));
      if (t >= 9.4) bp = pose.hurt(t * 0.2);
      if (t >= 9.4 && t < 9.9) bp = mixPose(pose.cast(t), pose.punch(0.5), 0.6);
      const bo = drawStick(ctx, { x: 480, y: HIP, color: B, pose: t < 9.4 ? bp : { ...pose.idle(t), lean: 0.1 }, glow: 'rgba(59,130,246,.5)' });
      if (t < 9.4) {
        const lifted = ease(prog(t, 6.4, 8.4));
        const ang = lerp(0.05, PI / 2 + 0.1 * sin(t * 30) * prog(t, 8.2, 9.4), lifted);
        staff(ctx, bo.hand.x + 2, bo.hand.y + 10 - lifted * 10, ang, 70, 1 + 0.4 * sin(t * 4) + prog(t, 2, 9) * 1.2, t);
      } else {
        // شظايا
        const u = t - 9.4;
        [[-1, -120], [1, -150], [-0.4, -200], [0.7, -90]].forEach(([vx, vy], i) => {
          const x = bo.hand.x + vx * 110 * u + i * 4;
          const y = bo.hand.y + vy * u + 260 * u * u;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(u * (i % 2 ? 9 : -7));
          ctx.globalAlpha = 1 - prog(t, 11.5, 13);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.shadowColor = '#fde047';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(18, 0);
          ctx.stroke();
          ctx.restore();
        });
      }
      say(ctx, t, 2.6, 6.2, 480, HIP - 80, 'هذه القوة... أكبر من أن يحملها أحد!', B, 19);
      say(ctx, t, 4.6, 6.4, 600, HIP - 80, 'القرار لك يا أزرق.', '#7c3aed', 17);
      say(ctx, t, 6.6, 9.3, 480, HIP - 80, 'لن أحتفظ بها... أبداً!', B);
      say(ctx, t, 10.6, 13, 360, HIP - 80, 'ماذا فعلت؟!', '#a16207');
      // الانفجار الضوئي
      if (t >= 9.4) {
        const cx = bo.hand.x, cy = bo.hand.y - 30;
        const r = ease(prog(t, 9.5, 13.8)) * 1300;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(r, 1));
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.6, 'rgba(255,244,190,.95)');
        g.addColorStop(1, 'rgba(255,225,140,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        // أشعة
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(cx, cy);
        ctx.fillStyle = 'rgba(255,240,170,.22)';
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * PI * 2 + t * 0.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(cos(a - 0.07) * r, sin(a - 0.07) * r);
          ctx.lineTo(cos(a + 0.07) * r, sin(a + 0.07) * r);
          ctx.fill();
        }
        ctx.restore();
      }
      if (t >= 13.4) {
        ctx.fillStyle = `rgba(255,252,238,${prog(t, 13.4, 14.6)})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (t > 13.6) {
        ctx.globalAlpha = Math.min(prog(t, 13.6, 14.4), 1 - prog(t, 15.0, 15.6));
        text(ctx, '✨ النور ✨', W / 2, 200, 54, '#b45309', '900');
        ctx.globalAlpha = 1;
      }
    } else if (t < 22.4) {
      // ----- المرج المسالم -----
      meadow(ctx, t);
      const spots: { x: number; c: string; d: 1 | -1; g: string; delay: number }[] = [
        { x: 330, c: Y, d: 1, g: 'rgba(250,204,21,.4)', delay: 0 },
        { x: 440, c: B, d: 1, g: 'rgba(59,130,246,.4)', delay: 0.3 },
        { x: 560, c: K, d: -1, g: 'rgba(192,132,252,.8)', delay: 0.6 },
        { x: 670, c: R, d: -1, g: 'rgba(239,68,68,.3)', delay: 0.9 },
      ];
      spots.forEach((s, i) => {
        const fade = 1 - prog(t, 20.8 + i * 0.35, 21.8 + i * 0.35);
        if (fade <= 0) return;
        const rise = (1 - fade) * 90;
        const p = t < 20.6 ? pose.wave(t + s.delay) : pose.idle(t);
        drawStick(ctx, { x: s.x, y: HIP - rise, color: s.c, dir: s.d, alpha: fade, pose: p, glow: s.g });
        if (fade < 1) {
          for (let k = 0; k < 10; k++) {
            const a = rnd(k + i * 10) * PI * 2;
            const rr2 = (1 - fade) * (30 + rnd(k) * 50);
            ctx.fillStyle = `rgba(255,255,255,${fade})`;
            ctx.beginPath();
            ctx.arc(s.x + cos(a) * rr2, HIP - rise - 20 + sin(a) * rr2, 3, 0, PI * 2);
            ctx.fill();
          }
          glow(ctx, s.x, HIP - rise - 20, 80, s.c, 0.6 * (1 - fade));
        }
      });
      say(ctx, t, 16.0, 17.8, 670, HIP - 80, 'آسف... لقد أعماني الطمع.', R, 17);
      say(ctx, t, 17.9, 19.4, 440, HIP - 80, 'كانت مغامرة لا تُنسى!', B);
      say(ctx, t, 19.5, 20.7, 330, HIP - 80, 'إلى اللقاء يا صديقي!', '#a16207', 17);
      // انتقال الضوء
      const wa = 1 - prog(t, 15.6, 16.8);
      if (wa > 0) {
        ctx.fillStyle = `rgba(255,252,238,${wa})`;
        ctx.fillRect(0, 0, W, H);
      }
      const fa = prog(t, 21.8, 22.4);
      if (fa > 0) {
        ctx.fillStyle = `rgba(0,0,0,${fa})`;
        ctx.fillRect(0, 0, W, H);
      }
    } else {
      // ----- الأنقاض والقطعة المتبقية -----
      const z = lerp(1, 2.1, ease(prog(t, 23, 29)));
      const sy = GROUND - 14;
      ctx.save();
      ctx.translate(480, sy);
      ctx.scale(z, z);
      ctx.translate(-480, -sy);
      ruins(ctx, t, true);
      // الضباب
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = 'rgba(120,100,180,.07)';
        ctx.beginPath();
        ctx.ellipse(((t * 15 + i * 200) % 1200) - 120, GROUND - 10 + (i % 2) * 20, 180, 30, 0, 0, PI * 2);
        ctx.fill();
      }
      const lit = prog(t, 24, 26);
      const pulse = 0.6 + 0.4 * sin(t * 3);
      glow(ctx, 480, sy, 120 * lit * pulse + 20, '#f59e0b', lit);
      glow(ctx, 480, sy, 40 * lit, '#fff7ae', lit);
      ctx.save();
      ctx.translate(480, sy);
      ctx.rotate(-0.4);
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 16 * pulse;
      ctx.beginPath();
      ctx.moveTo(-9, 2);
      ctx.lineTo(0, -4);
      ctx.lineTo(10, 0);
      ctx.lineTo(7, 4);
      ctx.lineTo(-8, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // شرارات
      for (let i = 0; i < 12; i++) {
        const u = (t * 0.5 + rnd(i)) % 1;
        ctx.fillStyle = `rgba(253,224,71,${(1 - u) * lit})`;
        ctx.fillRect(480 + (rnd(i + 4) - 0.5) * 60 * (0.3 + u), sy - u * 80, 3, 3);
      }
      ctx.restore();
      // عنوان النهاية
      const ta = prog(t, 28.6, 30);
      if (ta > 0) {
        ctx.fillStyle = `rgba(0,0,0,${0.45 * ta})`;
        ctx.fillRect(0, 150, W, 150);
        ctx.globalAlpha = ta;
        text(ctx, 'يتبع... الجزء الثاني 🔥', W / 2, 205, 56, '#fde047', '900');
        text(ctx, 'عصا التحكم الذهبية', W / 2, 262, 26, '#fef3c7', '600');
        ctx.globalAlpha = 1;
      }
      const ia = 1 - prog(t, 22.4, 23.4);
      if (ia > 0) {
        ctx.fillStyle = `rgba(0,0,0,${ia})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
    void [mix, impact, dust, torch, kf, moving, heading, pillar, beam, arenaBg];
  },
};

export const scenesC: Scene[] = [scene6, scene7];
