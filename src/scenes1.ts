import {
  COLORS, GROUND, HIP, H, W, PI, sin, cos,
  Scene, clamp, lerp, ease, prog, rnd, kf, moving, heading, mix, rr,
  drawStick, pose, mixPose, sky, mountains, glow, cloud, stars, text, say, impact, dust, miniMap, temple, bubble,
} from './engine';

const B = COLORS.blue, R = COLORS.red, Y = COLORS.yellow;

function groundFill(ctx: CanvasRenderingContext2D, top: string, body: string) {
  ctx.fillStyle = body;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = top;
  ctx.fillRect(0, GROUND, W, 9);
}

/* ============================ المشهد 1: الاكتشاف ============================ */
function drawMapOverlay(ctx: CanvasRenderingContext2D, t: number) {
  const a = ease(prog(t, 11.6, 12.6));
  if (a <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${0.7 * a})`;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;
  ctx.translate(W / 2, H / 2 + (1 - a) * 40);
  ctx.scale(0.8 + 0.2 * a, 0.8 + 0.2 * a);
  ctx.translate(-W / 2, -H / 2);
  // الورقة
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#e8d3a0';
  rr(ctx, 170, 50, 620, 410, 16);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#8a6a2f';
  ctx.lineWidth = 6;
  ctx.stroke();
  // بقع قديمة
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(139,94,40,${0.06 + rnd(i) * 0.08})`;
    ctx.beginPath();
    ctx.arc(190 + rnd(i + 3) * 580, 70 + rnd(i + 7) * 370, 20 + rnd(i + 1) * 40, 0, PI * 2);
    ctx.fill();
  }
  // جبال مرسومة
  ctx.strokeStyle = '#7a5a2a';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const mx = 240 + i * 70, my = 300 + (i % 2) * 40;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx + 30, my - 55);
    ctx.lineTo(mx + 60, my);
    ctx.stroke();
  }
  // المسار
  const pts: [number, number][] = [[250, 400], [330, 350], [410, 395], [490, 310], [560, 340], [620, 235], [690, 190]];
  const f = prog(t, 12.6, 15.4) * (pts.length - 1);
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < pts.length - 1; i++) {
    const s = clamp(f - i);
    if (s <= 0) break;
    ctx.lineTo(lerp(pts[i][0], pts[i + 1][0], s), lerp(pts[i][1], pts[i + 1][1], s));
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // نقطة البداية
  ctx.fillStyle = B;
  ctx.beginPath();
  ctx.arc(250, 400, 9, 0, PI * 2);
  ctx.fill();
  // المعبد
  const la = prog(t, 15.2, 16.2);
  if (la > 0) {
    ctx.globalAlpha = a * la;
    temple(ctx, 700, 235, 0.55, '#6b5326', la);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(740, 170);
    ctx.lineTo(770, 200);
    ctx.moveTo(770, 170);
    ctx.lineTo(740, 200);
    ctx.stroke();
  }
  ctx.globalAlpha = a;
  text(ctx, 'معبد العصا الذهبية', W / 2, 105, 38, '#5b3a0e', '900');
  ctx.restore();
}

const scene1: Scene = {
  id: 1,
  title: 'الاكتشاف',
  desc: 'الأزرق يجد خريطة قديمة',
  icon: '🗺️',
  duration: 18,
  lines: [
    { at: 0, text: 'في عالم الستيكمان... يرقد الأزرق نائماً مع شروق الشمس 🌅' },
    { at: 3.4, text: 'يستيقظ الأزرق ويتمدد... كان صباحاً غريباً.' },
    { at: 6.4, text: 'يلاحظ وهجاً خافتاً تحت صخرة ضخمة... فيدفعها بكل قوته!' },
    { at: 9.0, text: 'خريطة قديمة مخفية تحت الصخرة!' },
    { at: 12.2, text: 'الخريطة تشير إلى مكان يُدعى: «معبد العصا الذهبية»' },
    { at: 15.4, text: 'يُقال إن من يمتلك العصا الذهبية يستطيع التحكم في قوانين العالم...' },
  ],
  draw(ctx, t) {
    const k = prog(t, 0, 9);
    sky(ctx, mix('#0f172a', '#38bdf8', k), mix('#312e81', '#fdba74', k));
    stars(ctx, t, 1 - k);
    const sunY = lerp(500, 250, ease(k));
    glow(ctx, 720, sunY, 220, '#f59e0b', 0.8);
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(720, sunY, 46, 0, PI * 2);
    ctx.fill();
    cloud(ctx, 200 + t * 6, 110, 1, 0.5 * k);
    cloud(ctx, 560 + t * 4, 80, 0.8, 0.5 * k);
    mountains(ctx, 0, 400, 140, mix('#1e293b', '#7c8fb8', k), 0.006, 1);
    mountains(ctx, 300, 440, 90, mix('#0f172a', '#4b5d86', k), 0.009, 4);
    groundFill(ctx, mix('#1d4a2c', '#5cb85c', k), mix('#14301f', '#4a8a3f', k));
    for (let i = 0; i < 40; i++) {
      const gx = rnd(i) * W, gy = GROUND + 14 + rnd(i + 4) * 80;
      ctx.strokeStyle = mix('#1d4a2c', '#2f7a36', k);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx - 3, gy - 8);
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 3, gy - 8);
      ctx.stroke();
    }
    // الخريطة تحت الصخرة
    const rockX = 640 + ease(prog(t, 6.8, 8.6)) * 110;
    if (t > 7.2 && t < 9.7) {
      glow(ctx, 640, GROUND - 6, 70, '#fbbf24', 0.5 + 0.3 * sin(t * 8));
      miniMap(ctx, 640, GROUND - 8, 1.2, 0.1);
    }
    // الأزرق
    let bx = 300, by = HIP, rot = 0, dir: 1 | -1 = 1;
    let p = pose.idle(t);
    let holdMap = false;
    if (t < 1.6) {
      rot = PI / 2 * 0.98;
      by = GROUND - 7;
      p = pose.idle(t * 0.5);
    } else if (t < 3.6) {
      const u = ease(prog(t, 1.6, 3.6));
      rot = lerp(PI / 2 * 0.98, 0, u);
      by = GROUND - 46 * cos(rot) - 7 * sin(rot);
      p = mixPose(pose.idle(t), pose.stand(t), u);
    } else if (t < 4.6) {
      p = pose.cheer(t * 0.5);
      p = { ...p, dy: 0 };
    } else if (t < 6.6) {
      bx = kf(t, [[4.6, 300], [6.6, 555]], true);
      p = pose.walk(t);
    } else if (t < 6.8) {
      bx = 555;
    } else if (t < 8.7) {
      bx = rockX - 85;
      p = pose.push(t);
    } else if (t < 9.7) {
      bx = 667;
      dir = -1;
      p = mixPose(pose.idle(t), pose.crouch(), ease(prog(t, 8.7, 9.2)));
      by = HIP;
    } else {
      bx = 667;
      dir = -1;
      holdMap = true;
      p = mixPose(pose.crouch(), pose.reachUp(t), ease(prog(t, 9.7, 10.4)));
    }
    // الصخرة
    ctx.save();
    ctx.translate(rockX, GROUND);
    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    ctx.moveTo(-64, 0);
    ctx.lineTo(-58, -40);
    ctx.lineTo(-30, -78);
    ctx.lineTo(14, -84);
    ctx.lineTo(50, -58);
    ctx.lineTo(66, -16);
    ctx.lineTo(70, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.beginPath();
    ctx.moveTo(-50, -40);
    ctx.lineTo(-28, -72);
    ctx.lineTo(0, -76);
    ctx.lineTo(-20, -40);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, -80);
    ctx.lineTo(0, -40);
    ctx.lineTo(18, -20);
    ctx.stroke();
    ctx.restore();
    if (t > 6.8 && t < 8.7) dust(ctx, rockX - 50, GROUND, t, 7.0, 6, 40);
    const out = drawStick(ctx, { x: bx, y: by, color: B, dir, pose: p, rot, glow: 'rgba(59,130,246,.5)' });
    if (holdMap) miniMap(ctx, out.hand.x, out.hand.y - 12, lerp(0.7, 1.4, prog(t, 10.4, 11.4)), -0.2);
    // Z Z Z
    if (t < 3) {
      for (let i = 0; i < 3; i++) {
        const u = ((t * 0.7 + i / 3) % 1);
        ctx.globalAlpha = 1 - u;
        text(ctx, 'Z', bx + 30 + u * 40 + i * 4, GROUND - 40 - u * 80, 16 + i * 6, '#e0e7ff');
        ctx.globalAlpha = 1;
      }
    }
    say(ctx, t, 4.0, 5.5, bx, by - 70, 'آآآه... يوم جديد!', B);
    say(ctx, t, 9.9, 11.3, bx, by - 85, 'خريطة؟! ما هذا؟!', B);
    drawMapOverlay(ctx, t);
  },
};

/* ============================ المشهد 2: السباق نحو المعبد ============================ */
interface Obs { x: number; type: 'gap' | 'spike' | 'saw'; w: number }
const OBS: Obs[] = [
  { x: 900, type: 'gap', w: 130 },
  { x: 1450, type: 'spike', w: 80 },
  { x: 1900, type: 'saw', w: 70 },
  { x: 2350, type: 'gap', w: 150 },
  { x: 2800, type: 'spike', w: 90 },
  { x: 3250, type: 'gap', w: 130 },
];
const SPEED = 230;

function jumpInfo(cx: number, scroll: number) {
  for (const o of OBS) {
    const c = o.x - scroll;
    const hw = o.w / 2;
    const a = c - hw - 55, b = c + hw + 55;
    const u = (cx - a) / (b - a);
    if (u > 0 && u < 1) return { u, h: sin(PI * u) * (o.type === 'gap' ? 100 : 85) };
  }
  return { u: 0, h: 0 };
}

const scene2: Scene = {
  id: 2,
  title: 'السباق نحو المعبد',
  desc: 'قفزات وفخاخ وصخور عملاقة',
  icon: '🏃',
  duration: 18,
  lines: [
    { at: 0, text: 'ينطلق الأزرق مع صديقه الأصفر نحو المعبد... سباق مع الزمن! 🏃' },
    { at: 2.0, text: 'قفزات مذهلة بين الجبال والهاويات!' },
    { at: 4.3, text: 'لكن شخصاً ما يراقبهم سراً من فوق الجرف... إنه الأحمر! 👀' },
    { at: 6.2, text: 'فخاخ متحركة ومناشير دوّارة تعترض طريقهما!' },
    { at: 8.4, text: 'فجأة... صخرة عملاقة تتدحرج خلفهما! اركضا!!' },
    { at: 14.2, text: 'ينجوان بأعجوبة... والمعبد يلوح في الأفق ✨' },
  ],
  draw(ctx, t) {
    const scroll = t * SPEED;
    sky(ctx, '#38bdf8', '#e0f2fe');
    glow(ctx, 160, 90, 150, '#fbbf24', 0.5);
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(160, 90, 38, 0, PI * 2);
    ctx.fill();
    cloud(ctx, ((500 - t * 20) % 1200 + 1200) % 1200 - 120, 90, 1);
    cloud(ctx, ((900 - t * 14) % 1200 + 1200) % 1200 - 120, 150, 0.7);
    mountains(ctx, scroll * 0.1, 360, 160, '#9db4d6', 0.006, 2);
    // معبد بعيد
    const tp = prog(t, 11.5, 18);
    if (tp > 0) temple(ctx, lerp(1100, 800, ease(tp)), 395, lerp(0.35, 0.6, tp), '#6e7aa0', tp);
    mountains(ctx, scroll * 0.3, 430, 130, '#6f8ab5', 0.008, 5);
    mountains(ctx, scroll * 0.6, 470, 80, '#4f6b99', 0.011, 9);

    // الأحمر يراقب من الجرف
    const cl = (1 - ease(prog(t, 2.5, 3.6))) * 260 + ease(prog(t, 8.8, 9.8)) * 260;
    if (t > 2.4 && t < 10) {
      ctx.save();
      ctx.translate(cl, 0);
      ctx.fillStyle = '#3f4a63';
      ctx.beginPath();
      ctx.moveTo(740, 280);
      ctx.lineTo(752, 215);
      ctx.lineTo(960, 205);
      ctx.lineTo(960, 280);
      ctx.fill();
      ctx.restore();
      const o = drawStick(ctx, {
        x: 820 + cl, y: 207 - 46 + 2, color: R, dir: -1, scale: 0.8,
        pose: { ...pose.idle(t), aF: [2.35, 2.3], lean: 0.2 }, angry: true,
      });
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(o.head.x - 9, o.head.y - 1, 4, 0, PI * 2);
      ctx.arc(o.head.x - 3, o.head.y - 1, 4, 0, PI * 2);
      ctx.fill();
      say(ctx, t, 4.5, 7.3, 820 + cl, 120, 'العصا ستكون لي وحدي... 😈', R, 17);
    }

    // الأرض مع الحفر
    const gaps = OBS.filter((o) => o.type === 'gap').map((o) => [o.x - scroll - o.w / 2, o.x - scroll + o.w / 2]);
    const segs: [number, number][] = [];
    let cur = -10;
    for (const g of gaps.sort((a, b) => a[0] - b[0])) {
      if (g[1] < -10 || g[0] > W + 10) continue;
      segs.push([cur, g[0]]);
      cur = g[1];
    }
    segs.push([cur, W + 10]);
    for (const g of gaps) {
      if (g[1] < 0 || g[0] > W) continue;
      const gr = ctx.createLinearGradient(0, GROUND, 0, H);
      gr.addColorStop(0, '#1e1b2e');
      gr.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = gr;
      ctx.fillRect(g[0], GROUND, g[1] - g[0], H - GROUND);
    }
    for (const s of segs) {
      if (s[1] <= s[0]) continue;
      ctx.fillStyle = '#7a5a3a';
      ctx.fillRect(s[0], GROUND, s[1] - s[0], H - GROUND);
      ctx.fillStyle = '#58a24a';
      ctx.fillRect(s[0], GROUND, s[1] - s[0], 10);
      ctx.fillStyle = 'rgba(0,0,0,.12)';
      for (let i = 0; i < 10; i++) {
        const sx = s[0] + 20 + i * 70;
        if (sx < s[1] - 10) ctx.fillRect(sx, GROUND + 25 + (i % 3) * 20, 34, 8);
      }
    }
    // الفخاخ
    for (const o of OBS) {
      const c = o.x - scroll;
      if (c < -100 || c > W + 100) continue;
      if (o.type === 'spike') {
        const hgt = 18 + 24 * (0.5 + 0.5 * sin(t * 5 + o.x));
        ctx.fillStyle = '#cbd5e1';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        const n = Math.round(o.w / 20);
        for (let i = 0; i < n; i++) {
          const sx = c - o.w / 2 + i * 20;
          ctx.beginPath();
          ctx.moveTo(sx, GROUND);
          ctx.lineTo(sx + 10, GROUND - hgt);
          ctx.lineTo(sx + 20, GROUND);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else if (o.type === 'saw') {
        const sx = c + sin(t * 3) * 40;
        ctx.save();
        ctx.translate(sx, GROUND - 30);
        ctx.rotate(t * 12);
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const r = i % 2 ? 24 : 34;
          const a = (i / 16) * PI * 2;
          ctx.lineTo(cos(a) * r, sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx - 60, GROUND - 2, 120, 4);
      }
    }
    // الشخصيات
    const draw = (cx: number, color: string, gl: string, off: number) => {
      const j = jumpInfo(cx, scroll);
      const p = j.h > 0 ? pose.jump(j.u) : pose.run(t + off);
      drawStick(ctx, { x: cx, y: HIP - j.h, color, pose: p, glow: gl });
    };
    draw(350, Y, 'rgba(250,204,21,.5)', 0.3);
    draw(450, B, 'rgba(59,130,246,.5)', 0);
    // الصخرة العملاقة
    if (t > 7.6) {
      let bxr = lerp(-220, 100, ease(prog(t, 7.6, 10.4))) + sin(t * 3) * 6;
      let byr = GROUND - 82 + (t > 10.5 ? -abs0(sin(t * 6)) * 6 : 0);
      if (t > 13.3) {
        const u = t - 13.3;
        byr += u * u * 700;
        bxr -= u * 90;
      }
      ctx.save();
      ctx.translate(bxr, byr);
      ctx.rotate(t * 4);
      ctx.fillStyle = '#6b7280';
      ctx.beginPath();
      for (let i = 0; i < 24; i++) {
        const r = 82 + rnd(i) * 10;
        const a = (i / 24) * PI * 2;
        ctx.lineTo(cos(a) * r, sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath();
      ctx.moveTo(-40, -30);
      ctx.lineTo(0, 0);
      ctx.lineTo(30, -40);
      ctx.moveTo(0, 0);
      ctx.lineTo(20, 50);
      ctx.moveTo(-50, 30);
      ctx.lineTo(-10, 25);
      ctx.stroke();
      ctx.restore();
      if (t < 13.3) {
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = `rgba(160,140,110,${0.5})`;
          ctx.beginPath();
          ctx.arc(bxr + 70 + ((t * 6 + i) % 3) * 30, GROUND - 5 - rnd(i) * 30, 8 + rnd(i + 3) * 8, 0, PI * 2);
          ctx.fill();
        }
      }
    }
    say(ctx, t, 0.4, 2.0, 450, HIP - 70, 'اتبعني يا أصفر!', B);
    say(ctx, t, 2.2, 3.8, 350, HIP - 70, 'واااو! ما أعلى هذه القفزة!', '#a16207');
    say(ctx, t, 8.8, 11, 350, HIP - 70, 'صخرة عملاقة!! اركض!!', '#a16207');
    say(ctx, t, 14.2, 16.5, 450, HIP - 70, 'نجحنا! المعبد أمامنا!', B);
  },
};
function abs0(v: number) {
  return Math.abs(v);
}

/* ============================ المشهد 3: كمين الأحمر ============================ */
const ropeTheta = (t: number) => {
  const sway = sin(t * 1.5) * 0.06;
  return kf(t, [[0, sway], [9.5, sway], [10.5, -0.85], [10.65, -0.85], [12.2, 0.5], [13, 0.15], [16, 0]]);
};
const ROPE_P = { x: 600, y: -50 };
const ROPE_L = 345;

const scene3: Scene = {
  id: 3,
  title: 'كمين الأحمر',
  desc: 'معركة سريعة على حافة الهاوية',
  icon: '🥊',
  duration: 19,
  lines: [
    { at: 0, text: 'قبل الوصول إلى المعبد... الطريق يبدو هادئاً أكثر من اللازم...' },
    { at: 1.0, text: 'فجأة! الأحمر يهبط من السماء ويعترض الطريق! 😠' },
    { at: 3.2, text: '«سلّم الخريطة... وإلا ستندم!»' },
    { at: 5.0, text: 'تبدأ المعركة! لكمات وقفزات سريعة 🥊' },
    { at: 7.0, text: 'ركلة هوائية مذهلة من الأزرق!' },
    { at: 10.4, text: 'الأزرق يمسك بالحبل ويتأرجح فوق ساحة المعركة!' },
    { at: 11.6, text: 'ركلة قوية... الأحمر يتراجع نحو الحفرة!' },
    { at: 12.8, text: 'يسقط الأحمر في الحفرة... والأزرق يهرب مع الخريطة! 🗺️' },
    { at: 15.0, text: 'لكن الأحمر لن يستسلم بهذه السهولة...' },
  ],
  draw(ctx, t) {
    sky(ctx, '#3b1d5a', '#fb923c');
    glow(ctx, 480, 300, 300, '#f97316', 0.5);
    mountains(ctx, 0, 380, 150, '#5b2b4f', 0.007, 3);
    mountains(ctx, 120, 470, 120, '#3d1d3a', 0.01, 8);
    // جدران الوادي
    ctx.fillStyle = '#1f1022';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(90, 0);
    ctx.lineTo(60, 120);
    ctx.lineTo(95, 240);
    ctx.lineTo(40, GROUND);
    ctx.lineTo(0, GROUND);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W, 0);
    ctx.lineTo(W - 70, 0);
    ctx.lineTo(W - 40, 130);
    ctx.lineTo(W - 90, 260);
    ctx.lineTo(W - 20, GROUND);
    ctx.lineTo(W, GROUND);
    ctx.fill();
    // الأرض
    const PIT: [number, number] = [800, 900];
    ctx.fillStyle = '#5a3a2a';
    ctx.fillRect(0, GROUND, PIT[0], H - GROUND);
    ctx.fillRect(PIT[1], GROUND, W - PIT[1], H - GROUND);
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(0, GROUND, PIT[0], 9);
    ctx.fillRect(PIT[1], GROUND, W - PIT[1], 9);
    const pg = ctx.createLinearGradient(0, GROUND, 0, H);
    pg.addColorStop(0, '#120a14');
    pg.addColorStop(1, '#450a0a');
    ctx.fillStyle = pg;
    ctx.fillRect(PIT[0], GROUND, PIT[1] - PIT[0], H - GROUND);

    // العارضة والحبل
    ctx.fillStyle = '#4b3621';
    ctx.fillRect(540, 0, 120, 12);
    const th = ropeTheta(t);
    const rex = ROPE_P.x + ROPE_L * sin(th), rey = ROPE_P.y + ROPE_L * cos(th);
    ctx.strokeStyle = '#d6b87a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(600, 6);
    ctx.lineTo(rex, rey);
    ctx.stroke();

    /* ---------- الأزرق ---------- */
    let bx = 330, by = HIP, rot = 0, bp = pose.idle(t), showMap = true;
    let bi = 0; // لقياس ضربة
    if (t < 1.8) {
      bx = lerp(100, 330, t / 1.8);
      bp = pose.walk(t);
    } else if (t < 5.0) {
      bx = kf(t, [[2.6, 330], [3.0, 300]]);
      bp = t < 3.2 ? pose.hurt(t) : pose.idle(t);
      if (t < 3.2) bp = mixPose(pose.idle(t), pose.hurt(t * 0.3), 0.4);
    } else if (t < 5.5) {
      bx = lerp(300, 540, (t - 5) / 0.5);
      bp = pose.run(t);
    } else if (t < 6.2) {
      bx = 540;
      bp = pose.punch((t - 5.5) / 0.7);
    } else if (t < 6.9) {
      bx = kf(t, [[6.3, 540], [6.9, 480]]);
      bp = pose.hurt(t);
    } else if (t < 7.8) {
      const u = (t - 6.9) / 0.9;
      bx = lerp(480, 560, ease(u));
      by = HIP - sin(PI * u) * 70;
      bp = u < 0.3 ? pose.jump(u / 0.3 * 0.5) : pose.kick(clamp((u - 0.3) / 0.5));
    } else if (t < 8.9) {
      const u = (t - 7.8) / 1.1;
      bx = lerp(560, 450, ease(u));
      by = HIP - sin(PI * u) * 60;
      rot = -2 * PI * ease(u);
      bp = pose.jump(u);
    } else if (t < 9.9) {
      bx = kf(t, [[8.9, 450], [9.2, 500]]);
      bp = pose.punch(((t - 8.9) % 0.5) / 0.5);
      bi = 1;
    } else if (t < 10.5) {
      bx = lerp(500, 300, (t - 9.9) / 0.6);
      bp = pose.run(t);
    } else if (t < 11.0) {
      const u = (t - 10.5) / 0.5;
      const ex = ROPE_P.x + ROPE_L * sin(-0.85), ey = ROPE_P.y + ROPE_L * cos(-0.85) + 75;
      bx = lerp(300, ex, ease(u));
      by = lerp(HIP, ey, u) - sin(PI * u) * 40;
      bp = pose.jump(u * 0.6);
      if (u > 0.7) bp = pose.hang(t);
      showMap = false;
    } else if (t < 12.2) {
      bx = rex;
      by = rey + 75;
      const e = sin(prog(t, 11.3, 12.0) * PI);
      const h = pose.hang(t);
      bp = { ...h, lF: [lerp(0.1, 1.5, e), lerp(0, 0, e)], lB: [lerp(-0.05, 0.3, e), -0.3 * e] };
      rot = th * 0.35;
      showMap = false;
    } else if (t < 13.4) {
      const u = (t - 12.2) / 1.2;
      const sx = ROPE_P.x + ROPE_L * sin(0.5), sy = ROPE_P.y + ROPE_L * cos(0.5) + 75;
      bx = lerp(sx, 945, u);
      by = lerp(sy, HIP, u * u) - sin(PI * u) * 50;
      bp = pose.jump(u);
    } else {
      bx = kf(t, [[13.4, 945], [15.5, 1120]], true);
      bp = pose.run(t);
    }
    void bi;

    /* ---------- الأصفر ---------- */
    let yx = 240, yy = HIP, yp = pose.idle(t + 1);
    if (t < 1.8) {
      yx = lerp(20, 240, t / 1.8);
      yp = pose.walk(t);
    } else if (t < 13) {
      yx = t > 2.6 && t < 3.2 ? lerp(240, 215, (t - 2.6) / 0.6) : t >= 3.2 ? 215 : 240;
      if (t > 5 && t < 10.5) yp = { ...pose.idle(t * 3), aF: [2.4 + sin(t * 9) * 0.2, 0.3], aB: [2.2, 0.3], dy: -abs0(sin(t * 4)) * 3 };
    } else {
      yx = kf(t, [[13, 215], [14.1, 740], [15.1, 950], [16.4, 1130]], true);
      const jx = (yx - 740) / 210;
      if (jx > 0 && jx < 1) {
        yy = HIP - sin(PI * jx) * 80;
        yp = pose.jump(jx);
      } else yp = pose.run(t);
    }

    /* ---------- الأحمر ---------- */
    let rx = 640, ry = HIP, rp = pose.idle(t), rrot = 0, redVisible = true, clipPit = false;
    if (t < 1.0) redVisible = false;
    else if (t < 1.8) {
      const u = (t - 1) / 0.8;
      ry = lerp(-90, HIP, u * u);
      rp = pose.flail(t);
    } else if (t < 2.5) {
      rp = mixPose(pose.crouch(), pose.idle(t), ease((t - 1.8) / 0.7));
    } else if (t < 5.6) {
      rp = pose.idle(t);
    } else if (t < 6.1) {
      rx = kf(t, [[5.7, 640], [6.1, 672]]);
      rp = pose.hurt(t);
    } else if (t < 6.9) {
      rx = kf(t, [[6.1, 672], [6.4, 596]]);
      rp = pose.punch((t - 6.2) / 0.6);
      if (t < 6.2) rp = pose.idle(t);
    } else if (t < 7.8) {
      rx = 596;
      if (t > 7.45) {
        rx = kf(t, [[7.45, 596], [7.9, 650]]);
        rp = pose.hurt(t);
      }
    } else if (t < 8.9) {
      rx = kf(t, [[7.8, 650], [8.1, 610]]);
      rp = pose.kick((t - 7.8) / 0.7);
      if (t > 8.5) rp = pose.idle(t);
    } else if (t < 9.9) {
      const ph = ((t - 8.9) % 0.5) / 0.5;
      rx = kf(t, [[8.9, 610], [9.9, 650]]);
      rp = ph > 0.3 ? pose.hurt(t) : pose.idle(t);
    } else if (t < 11.0) {
      rx = kf(t, [[9.9, 650], [10.6, 570], [11.0, 600]], true);
      rp = pose.walk(t);
      if (t > 10.6) rp = pose.idle(t);
    } else if (t < 11.75) {
      rx = kf(t, [[11.0, 600], [11.5, 750]]);
      rp = t < 11.5 ? pose.walk(t, 1.4) : pose.idle(t);
      if (t > 11.5) rp = { ...pose.idle(t), aF: [2.3, 0.4], aB: [2.1, 0.4] };
    } else if (t < 12.6) {
      const u = (t - 11.75) / 0.85;
      rx = lerp(750, 848, ease(u));
      ry = HIP - sin(PI * u) * 60;
      rp = pose.hurt(t);
      rrot = -0.5 * u;
    } else {
      const u = t - 12.6;
      rx = 848;
      ry = HIP + u * u * 520;
      rp = pose.flail(t);
      rrot = -3 * u;
      clipPit = true;
    }

    // رسم الشخصيات
    const drawRed = () => {
      if (!redVisible) return;
      if (clipPit) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(PIT[0], 0, PIT[1] - PIT[0], H);
        ctx.clip();
      }
      drawStick(ctx, { x: rx, y: ry, color: R, dir: -1, pose: rp, rot: rrot, angry: true, glow: 'rgba(239,68,68,.45)' });
      if (clipPit) ctx.restore();
    };
    if (t < 15.5) drawRed();
    drawStick(ctx, { x: yx, y: yy, color: Y, pose: yp, glow: 'rgba(250,204,21,.45)' });
    const bo = drawStick(ctx, { x: bx, y: by, color: B, pose: bp, rot, glow: 'rgba(59,130,246,.5)' });
    if (showMap) miniMap(ctx, bo.handB.x, bo.handB.y - 6, 0.55, 0.3);

    // يد الأحمر من الحفرة
    if (t > 14.4) {
      const u = ease(prog(t, 14.4, 15.2));
      const hy = lerp(H + 20, GROUND - 14, u) + sin(t * 14) * 3;
      ctx.strokeStyle = R;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(848, H + 20);
      ctx.lineTo(848 + sin(t * 14) * 3, hy + 6);
      ctx.stroke();
      ctx.fillStyle = R;
      ctx.beginPath();
      ctx.arc(848 + sin(t * 14) * 3, hy, 9, 0, PI * 2);
      ctx.fill();
    }

    // تأثيرات
    dust(ctx, 640, GROUND, t, 1.8, 10, 90);
    impact(ctx, 592, HIP - 30, t, 5.8);
    impact(ctx, 562, HIP - 30, t, 6.5);
    impact(ctx, 612, HIP - 25, t, 7.5);
    impact(ctx, 590, HIP - 34, t, 9.15);
    impact(ctx, 600, HIP - 34, t, 9.65);
    impact(ctx, 735, 330, t, 11.78, 1.4);
    dust(ctx, 945, GROUND, t, 13.3, 8, 60);

    // حوار
    say(ctx, t, 3.2, 5.0, 640, HIP - 70, 'سلّم الخريطة يا أزرق!', R);
    say(ctx, t, 3.5, 4.9, 215, HIP - 70, 'يا إلهي! الأحمر!', '#a16207');
    say(ctx, t, 5.0, 5.5, 540, HIP - 70, 'لن أسلّمها!', B, 17);
    say(ctx, t, 8.9, 10.2, 640, HIP - 70, 'أيها المزعج!!', R, 17);
    say(ctx, t, 11.0, 11.7, 700, 90, 'هيا!!', B, 17);
    say(ctx, t, 12.9, 14.0, 820, 200, 'آآآآآه!!!', R);
    say(ctx, t, 15.0, 18.6, 848, GROUND - 40, 'سأنتقم... لن تهربوا!', R);
    say(ctx, t, 13.6, 15.4, 700, 150, 'الخريطة بأمان! هيا بنا!', B, 17);
    void [W, bubble];
  },
};

export const scenesA: Scene[] = [scene1, scene2, scene3];
void heading;
void moving;
