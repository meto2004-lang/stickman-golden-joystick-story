import { useCallback, useEffect, useRef, useState } from 'react';
import { H, W, FONT, prog, text } from './engine';
import type { Scene } from './engine';
import { scenesA } from './scenes1';
import { scenesB } from './scenes2';
import { scenesC } from './scenes3';

const SCENES: Scene[] = [...scenesA, ...scenesB, ...scenesC];

const CHARS = [
  { name: 'الأزرق', role: 'البطل', color: '#3b82f6', emoji: '🟦', desc: 'شجاع وذكي، يجد الخريطة التي تغيّر كل شيء.' },
  { name: 'الأحمر', role: 'الخصم', color: '#ef4444', emoji: '🟥', desc: 'طامع في القوة، يلاحق العصا بأي ثمن.' },
  { name: 'الأصفر', role: 'الصديق', color: '#facc15', emoji: '🟨', desc: 'الصديق الوفي الذي لا يترك البطل أبداً.' },
  { name: 'الأسود', role: 'الغامض', color: '#a78bfa', emoji: '⚫', desc: 'يعرف سرّ العصا... وسرّ الختم القديم.' },
];

function StickIcon({ color, size = 64 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 50 70" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round">
      <circle cx="25" cy="12" r="9" fill={color} />
      <path d="M25 21 V45 M25 28 L10 40 M25 28 L40 20 M25 45 L12 64 M25 45 L38 64" />
    </svg>
  );
}

function Cover({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0720] via-[#1a1040] to-[#3b1d5a] text-white flex flex-col items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-60">
        {Array.from({ length: 50 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 70}%`,
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              animationDelay: `${(i % 7) * 0.4}s`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 max-w-4xl w-full text-center">
        <div className="inline-block px-4 py-1 rounded-full bg-white/10 border border-white/20 text-sm mb-5">
          🎬 قصة ستيكمان متحركة · 7 مشاهد
        </div>
        <h1
          className="text-5xl md:text-7xl font-black leading-tight bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(90deg,#fde047,#f59e0b,#fde047)' }}
        >
          عصا التحكم الذهبية
        </h1>
        <p className="mt-4 text-lg md:text-xl text-purple-100/90 max-w-2xl mx-auto">
          يُقال إن من يمتلك العصا الذهبية يستطيع التحكم في قوانين العالم... فمن سيصل إليها أولاً؟
        </p>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {CHARS.map((c) => (
            <div
              key={c.name}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur hover:-translate-y-1 transition"
              style={{ boxShadow: `0 0 30px ${c.color}22` }}
            >
              <div className="flex justify-center animate-bounce" style={{ animationDuration: '2.4s' }}>
                <StickIcon color={c.color} />
              </div>
              <div className="mt-2 font-bold text-lg">
                {c.emoji} {c.name}
              </div>
              <div className="text-xs font-semibold" style={{ color: c.color }}>
                ({c.role})
              </div>
              <p className="text-xs text-purple-100/70 mt-2 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="mt-12 px-10 py-4 rounded-full text-xl font-black text-black shadow-2xl hover:scale-105 active:scale-95 transition"
          style={{ backgroundImage: 'linear-gradient(90deg,#fde047,#f59e0b)', boxShadow: '0 0 40px #f59e0b88' }}
        >
          ▶ ابدأ القصة
        </button>

        <div className="mt-10 flex flex-wrap justify-center gap-2 text-xs text-purple-100/70">
          {SCENES.map((s) => (
            <span key={s.id} className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {s.icon} {s.id}. {s.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [ended, setEnded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef({ idx: 0, t: 0, playing: true, ended: false });

  const goScene = useCallback((n: number) => {
    const i = Math.max(0, Math.min(SCENES.length - 1, n));
    st.current.idx = i;
    st.current.t = 0;
    st.current.ended = false;
    setIdx(i);
    setT(0);
    setEnded(false);
  }, []);

  const setPlay = useCallback((p: boolean) => {
    st.current.playing = p;
    setPlaying(p);
  }, []);

  const restart = useCallback(() => {
    goScene(0);
    setPlay(true);
  }, [goScene, setPlay]);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = st.current;
      const sc = SCENES[s.idx];
      if (s.playing && !s.ended) {
        s.t += dt;
        if (s.t >= sc.duration) {
          if (s.idx < SCENES.length - 1) {
            s.idx += 1;
            s.t = 0;
            setIdx(s.idx);
          } else {
            s.t = sc.duration;
            s.ended = true;
            s.playing = false;
            setEnded(true);
            setPlaying(false);
          }
        }
      }
      const cur = SCENES[s.idx];
      ctx.save();
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();
      cur.draw(ctx, s.t);
      // بطاقة عنوان المشهد
      const ca = Math.min(prog(s.t, 0.3, 0.8), 1 - prog(s.t, 2.3, 2.9));
      if (ca > 0) {
        ctx.fillStyle = `rgba(0,0,0,${0.55 * ca})`;
        ctx.fillRect(0, H / 2 - 80, W, 150);
        ctx.globalAlpha = ca;
        text(ctx, `المشهد ${cur.id}`, W / 2, H / 2 - 35, 26, '#fde047', '700');
        text(ctx, cur.title, W / 2, H / 2 + 15, 54, '#ffffff', '900');
        ctx.globalAlpha = 1;
      }
      // تلاشي الدخول والخروج
      const fa = Math.max(1 - prog(s.t, 0, 0.5), prog(s.t, cur.duration - 0.5, cur.duration));
      if (fa > 0 && !(s.idx === SCENES.length - 1 && s.t > cur.duration - 0.5)) {
        ctx.fillStyle = `rgba(0,0,0,${fa})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
      setT(s.t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (st.current.ended) restart();
        else setPlay(!st.current.playing);
      } else if (e.code === 'ArrowLeft') goScene(st.current.idx + 1);
      else if (e.code === 'ArrowRight') goScene(st.current.idx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, goScene, restart, setPlay]);

  if (!started) return <Cover onStart={() => setStarted(true)} />;

  const sc = SCENES[idx];
  const line = [...sc.lines].reverse().find((l) => l.at <= t);
  const total = SCENES.reduce((a, s) => a + s.duration, 0);
  const elapsed = SCENES.slice(0, idx).reduce((a, s) => a + s.duration, 0) + t;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0720] to-[#1a1040] text-white flex flex-col items-center px-3 py-4">
      <header className="w-full max-w-5xl flex items-center justify-between mb-3">
        <button onClick={() => { setStarted(false); setPlay(true); goScene(0); }} className="text-sm text-purple-200 hover:text-white">
          ← الرئيسية
        </button>
        <h1 className="font-black text-lg md:text-2xl text-amber-300">🔱 عصا التحكم الذهبية</h1>
        <div className="text-sm text-purple-200">المشهد {sc.id} / {SCENES.length}</div>
      </header>

      <div className="w-full max-w-5xl">
        <div className="relative rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-2xl bg-black" style={{ aspectRatio: '16 / 9' }}>
          <canvas ref={canvasRef} width={W * 2} height={H * 2} className="w-full h-full block" onClick={() => (ended ? restart() : setPlay(!playing))} />
          {/* ترجمة السرد */}
          <div className="absolute bottom-0 inset-x-0 p-2 md:p-4 pointer-events-none">
            {line && (
              <div key={line.text} className="mx-auto max-w-3xl text-center text-sm md:text-xl font-bold leading-relaxed bg-black/70 backdrop-blur rounded-xl px-4 py-2 border border-white/10 animate-[fadeIn_.4s_ease]">
                {line.text}
              </div>
            )}
          </div>
          {!playing && !ended && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl backdrop-blur">⏸</div>
            </div>
          )}
          {ended && (
            <div className="absolute inset-0 flex items-end justify-center pb-24 bg-black/10">
              <button onClick={restart} className="px-8 py-3 rounded-full font-black text-black text-lg shadow-xl hover:scale-105 transition" style={{ backgroundImage: 'linear-gradient(90deg,#fde047,#f59e0b)' }}>
                ↻ إعادة القصة
              </button>
            </div>
          )}
        </div>

        {/* شريط التحكم */}
        <div className="mt-3 rounded-2xl bg-white/5 border border-white/10 p-3">
          <div className="flex items-center gap-3">
            <button onClick={() => goScene(idx - 1)} disabled={idx === 0} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-lg" title="المشهد السابق">⏮</button>
            <button
              onClick={() => (ended ? restart() : setPlay(!playing))}
              className="w-12 h-12 rounded-full text-black text-xl font-black hover:scale-105 transition"
              style={{ backgroundImage: 'linear-gradient(90deg,#fde047,#f59e0b)' }}
              title="تشغيل / إيقاف"
            >
              {ended ? '↻' : playing ? '⏸' : '▶'}
            </button>
            <button onClick={() => goScene(idx + 1)} disabled={idx === SCENES.length - 1} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-lg" title="المشهد التالي">⏭</button>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={sc.duration}
                step={0.05}
                value={t}
                onChange={(e) => {
                  st.current.t = parseFloat(e.target.value);
                  st.current.ended = false;
                  setEnded(false);
                  setT(st.current.t);
                }}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[11px] text-purple-200/70 -mt-1">
                <span>{Math.floor(elapsed)}ث</span>
                <span>{Math.floor(total)}ث</span>
              </div>
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-l from-amber-300 to-amber-500" style={{ width: `${(elapsed / total) * 100}%`, float: 'right' }} />
          </div>
        </div>

        {/* قائمة المشاهد */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { goScene(i); setPlay(true); }}
              className={`rounded-xl p-2 text-right border transition ${i === idx ? 'bg-amber-400/20 border-amber-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              <div className="text-xl">{s.icon}</div>
              <div className="text-xs font-bold">{s.id}. {s.title}</div>
              <div className="text-[10px] text-purple-200/70 leading-tight">{s.desc}</div>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-purple-200/50 mt-3" style={{ fontFamily: FONT }}>
          المسافة: تشغيل/إيقاف · الأسهم: التنقل بين المشاهد
        </p>
      </div>
    </div>
  );
}
