import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { W } from './engine';
import type { StoryPart } from './story';
import { INTRO, INTERLUDE, drawIntro, timelineDuration } from './render';
import type { TimelinePart } from './render';
import { exportVideo, isExportSupported, pickMimeType } from './videoExport';
import type { ExportProgress, ExportResult, ExportSettings, Fps, Resolution } from './videoExport';

type Phase = 'setup' | 'preparing' | 'recording' | 'finalizing' | 'done' | 'error';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const mb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
const ar = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

const TAGS = 'ستيكمان, قصة متحركة, أنيميشن عربي, عصا التحكم الذهبية, الختم القديم, كرتون, stickman, animation, story';

/** فصول الفيديو باحتساب المقدمة والفواصل */
function chapters(parts: TimelinePart[]) {
  const out: { time: number; label: string }[] = [];
  let acc = INTRO;
  parts.forEach((p, pi) => {
    p.scenes.forEach((s, si) => {
      out.push({ time: pi === 0 && si === 0 ? 0 : Math.round(acc), label: `المشهد ${ar(s.id)}: ${s.title}` });
      acc += s.duration;
    });
    if (pi < parts.length - 1) acc += INTERLUDE;
  });
  return out;
}

function Toggle({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-right hover:bg-white/10 transition"
    >
      <span>
        <span className="block text-sm font-bold">{label}</span>
        {hint && <span className="block text-[11px] text-purple-200/60">{hint}</span>}
      </span>
      <span className={`relative w-11 h-6 rounded-full transition ${on ? 'bg-amber-400' : 'bg-white/20'}`} aria-hidden>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'right-0.5' : 'right-[22px]'}`} />
      </span>
    </button>
  );
}

function OptionRow<T extends number>({
  value,
  options,
  onChange,
  suffix,
  disabled,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-white/5 border border-white/10 p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-bold transition disabled:opacity-40 ${
            value === o ? 'bg-amber-400 text-black' : 'text-purple-100 hover:bg-white/10'
          }`}
        >
          {o}
          {suffix}
        </button>
      ))}
    </div>
  );
}

export default function VideoExport({
  parts,
  initialPart = 0,
  onClose,
}: {
  parts: StoryPart[];
  initialPart?: number;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<number | 'all'>(initialPart);
  const [settings, setSettings] = useState<ExportSettings>({
    height: 1080,
    fps: 30,
    music: true,
    subtitles: true,
  });
  const [phase, setPhase] = useState<Phase>('setup');
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const urlRef = useRef<string | null>(null);
  const lastUi = useRef(0);

  /** الأجزاء المختارة للتصدير */
  const timeline = useMemo<TimelinePart[]>(() => {
    const toTm = (p: StoryPart) => ({ label: p.label, title: p.title, scenes: p.scenes });
    if (scope === 'all') return parts.map(toTm);
    const p = parts[Math.min(scope, parts.length - 1)];
    return [toTm(p)];
  }, [parts, scope]);

  const scenesCount = useMemo(() => timeline.reduce((a, p) => a + p.scenes.length, 0), [timeline]);
  const total = useMemo(() => timelineDuration(timeline), [timeline]);
  const supported = useMemo(() => isExportSupported(), []);
  const mimePreview = useMemo(() => (supported ? pickMimeType(settings.music) : ''), [supported, settings.music]);
  const formatLabel = mimePreview.includes('mp4') ? 'MP4 (H.264)' : 'WebM (VP9)';

  const introSub = useMemo(() => {
    if (scope === 'all') return `القصة كاملة · ${ar(scenesCount)} مشهداً · الجزءان الأول والثاني`;
    const p = parts[Math.min(scope, parts.length - 1)];
    return `${p.label}: ${p.subtitle} · ${ar(p.scenes.length)} مشاهد`;
  }, [parts, scope, scenesCount]);

  const outro = useMemo(() => {
    if (scope === 'all') {
      return { sub: 'شكراً لمشاهدة القصة كاملة', note: 'الهمس لم يتوقف… الجزء الثالث؟ 👁️' };
    }
    const p = parts[Math.min(scope, parts.length - 1)];
    if (p.id === 'part1') {
      return { sub: 'الجزء الثاني متوفر الآن', note: 'شاهد الجزء الثاني: الختم القديم 🔥' };
    }
    return { sub: 'شكراً لمشاهدة الجزء الثاني', note: 'تريد الجزء الثالث؟ اكتب لنا في التعليقات 👁️' };
  }, [parts, scope]);

  const youtubeTitle = useMemo(() => {
    if (scope === 'all') return 'عصا التحكم الذهبية 🔱 القصة كاملة (الجزء الأول + الثاني) | ستيكمان متحرك';
    const p = parts[Math.min(scope, parts.length - 1)];
    return p.id === 'part1'
      ? 'عصا التحكم الذهبية 🔱 قصة ستيكمان متحركة — الجزء الأول'
      : 'الختم القديم 🗝️ عصا التحكم الذهبية — الجزء الثاني | قصة ستيكمان متحركة';
  }, [parts, scope]);

  const youtubeDesc = useMemo(() => {
    const ch = chapters(timeline).map((c) => `${fmt(c.time)} ${c.label}`);
    const head =
      scope === 'all'
        ? [
            '🔱 عصا التحكم الذهبية — القصة كاملة (الجزء الأول + الجزء الثاني)',
            '',
            'يُقال إن من يمتلك العصا الذهبية يستطيع التحكم في قوانين العالم...',
            'وفي الجزء الثاني يكتشف الأبطال أن العصا كانت مفتاحاً لختمٍ قديم، وأن كسره أيقظ «الحارس الفارغ».',
          ]
        : scope === 0
          ? [
              '🔱 عصا التحكم الذهبية — الجزء الأول: المعركة على العصا',
              '',
              'يُقال إن من يمتلك العصا الذهبية يستطيع التحكم في قوانين العالم... فمن سيصل إليها أولاً؟',
            ]
          : [
              '🗝️ الختم القديم — الجزء الثاني من «عصا التحكم الذهبية»',
              '',
              'لم تكن العصا قوة... بل مفتاحاً لقفلٍ قديم. والآن وقد انكسر الختم، يستيقظ الحارس الفارغ.',
            ];
    return [...head, '', '⏱ الفصول:', ...ch, '', '⭐ لا تنسَ الإعجاب والاشتراك وتفعيل التنبيهات.', '', '#ستيكمان #قصة_متحركة #أنيميشن #عصا_التحكم_الذهبية'].join('\n');
  }, [scope, timeline]);

  const estimatedMB = ((settings.height >= 1080 ? 6_000_000 : settings.height >= 720 ? 4_000_000 : 2_500_000) / 8) * total / (1024 * 1024);
  const busy = phase === 'preparing' || phase === 'recording' || phase === 'finalizing';

  const stopAndReset = useCallback((keepResult = true) => {
    cancelRef.current?.();
    cancelRef.current = null;
    if (!keepResult) setResult(null);
  }, []);

  const close = useCallback(() => {
    if (busy) {
      if (!window.confirm('التحويل جارٍ… هل تريد إلغاءه وإغلاق النافذة؟')) return;
      stopAndReset(false);
    } else if (result && !downloaded) {
      if (!window.confirm('لم تُحمّل ملف الفيديو بعد. هل تريد الإغلاق على أي حال؟')) return;
    }
    onClose();
  }, [busy, downloaded, onClose, result, stopAndReset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(
    () => () => {
      cancelRef.current?.();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;

    setError(null);
    setResult(null);
    setDownloaded(false);
    setProgress(null);
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
      setUrl(null);
    }
    setPhase('preparing');

    const handle = exportVideo({
      canvas,
      parts: timeline,
      settings,
      labels: { introSub, outroSub: outro.sub, outroNote: outro.note },
      onProgress: (p) => {
        const now = performance.now();
        const isEdge = p.phase !== 'recording' || p.time >= p.total || now - lastUi.current > 120;
        if (!isEdge) return;
        lastUi.current = now;
        setProgress(p);
        if (p.phase === 'preparing') setPhase('preparing');
        else if (p.phase === 'recording') setPhase('recording');
        else if (p.phase === 'finalizing') setPhase('finalizing');
      },
    });
    cancelRef.current = handle.cancel;

    handle.done
      .then((res) => {
        cancelRef.current = null;
        const objectUrl = URL.createObjectURL(res.blob);
        urlRef.current = objectUrl;
        setUrl(objectUrl);
        setResult(res);
        setPhase('done');
      })
      .catch((e: unknown) => {
        cancelRef.current = null;
        const err = e as { name?: string; message?: string };
        if (err?.name === 'AbortError') {
          setPhase('setup');
          setProgress(null);
          return;
        }
        setError(err?.message ?? 'حدث خطأ غير متوقع أثناء التحويل.');
        setPhase('error');
      });
  }, [busy, introSub, outro, settings, timeline]);

  const copy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }, []);

  const downloadThumbnail = useCallback(() => {
    const c = document.createElement('canvas');
    c.width = 1280;
    c.height = 720;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const k = 1280 / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    drawIntro(ctx, 2.4, introSub);
    c.toBlob((b) => {
      if (!b) return;
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u;
      a.download = 'golden-joystick-thumbnail.png';
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(u), 5000);
    }, 'image/png');
  }, [introSub]);

  const pct = progress && progress.total > 0 ? Math.min(100, (progress.time / progress.total) * 100) : 0;
  const remaining = progress ? Math.max(0, progress.total - progress.time) : total;
  const scopePart = typeof scope === 'number' ? parts[Math.min(scope, parts.length - 1)] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start md:items-center justify-center p-3 overflow-y-auto" dir="rtl">
      <div className="w-full max-w-3xl my-auto rounded-3xl bg-gradient-to-b from-[#160c33] to-[#0b0720] border border-amber-400/30 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 md:px-5 py-3 border-b border-white/10 bg-white/[0.03]">
          <h2 className="font-black text-lg md:text-xl text-amber-300">🎬 تحويل القصة إلى فيديو</h2>
          <button onClick={close} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-lg leading-none" title="إغلاق">
            ✕
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-4">
          {/* المعاينة */}
          <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black aspect-video">
            <canvas ref={canvasRef} width={1920} height={1080} className="w-full h-full block object-contain" />

            {phase === 'setup' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 bg-gradient-to-b from-[#120a2c] to-[#22103f]">
                <div className="text-4xl">{scope === 'all' ? '🔱' : scopePart?.icon}</div>
                <div className="text-2xl font-black text-amber-300">{scope === 'all' ? 'القصة كاملة' : scopePart?.title}</div>
                <div className="text-xs text-purple-200/70">{introSub}</div>
              </div>
            )}

            {(phase === 'preparing' || phase === 'recording') && (
              <div className="absolute top-2 left-2 flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-600/90 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> جارٍ التسجيل
              </div>
            )}

            {phase === 'done' && url && <video src={url} controls className="absolute inset-0 w-full h-full bg-black" />}
          </div>

          {/* شريط التقدم */}
          {busy && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-purple-200/80">
                <span className="font-bold text-amber-300">
                  {phase === 'preparing'
                    ? 'تجهيز التسجيل…'
                    : phase === 'finalizing'
                      ? 'إنهاء الملف…'
                      : `${
                          parts.length > 1 && scope === 'all' ? `${parts[progress?.partIndex ?? 0]?.label ?? ''} · ` : ''
                        }المشهد ${ar((progress?.sceneIndex ?? 0) + 1)}: ${progress?.sceneTitle ?? ''}`}
                </span>
                <span dir="ltr">
                  {fmt(progress?.time ?? 0)} / {fmt(total)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-amber-300 to-amber-500 transition-[width] duration-200"
                  style={{ width: `${phase === 'finalizing' ? 100 : pct}%` }}
                />
              </div>
              <div className="text-[11px] text-purple-200/60">
                متبقٍ ≈ {fmt(remaining)} · التحويل يتم بالزمن الحقيقي، فلا تُغلق التبويب ولا تُخفِه.
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/15 border border-red-400/40 text-red-100 text-sm px-3 py-2">⚠️ {error}</div>
          )}

          {/* الإعدادات */}
          {(phase === 'setup' || phase === 'error') && (
            <>
              {!supported && (
                <div className="rounded-xl bg-amber-400/10 border border-amber-400/40 text-amber-100 text-sm px-3 py-2">
                  ⚠️ متصفحك لا يدعم تسجيل الفيديو من Canvas. استخدم Chrome أو Edge أو Firefox حديثًا.
                </div>
              )}

              {/* اختيار ما يُصدَّر */}
              <div>
                <div className="text-[11px] font-bold text-purple-200/70 mb-1">ما الذي تريد تحويله؟</div>
                <div className="flex flex-wrap gap-2">
                  {parts.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setScope(i)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition ${
                        scope === i ? 'bg-amber-400 text-black border-amber-300' : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                  {parts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setScope('all')}
                      className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition ${
                        scope === 'all' ? 'bg-amber-400 text-black border-amber-300' : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      🔱 القصة كاملة
                    </button>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] font-bold text-purple-200/70 mb-1">الدقة</div>
                  <OptionRow<Resolution>
                    value={settings.height}
                    options={[1080, 720, 480]}
                    onChange={(height) => setSettings((s) => ({ ...s, height }))}
                    suffix="p"
                  />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-purple-200/70 mb-1">معدل الإطارات</div>
                  <OptionRow<Fps>
                    value={settings.fps}
                    options={[24, 30, 60]}
                    onChange={(fps) => setSettings((s) => ({ ...s, fps }))}
                    suffix=" fps"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Toggle
                  on={settings.music}
                  onClick={() => setSettings((s) => ({ ...s, music: !s.music }))}
                  label="موسيقى خلفية"
                  hint="موسيقى مُولّدة داخل المتصفح"
                />
                <Toggle
                  on={settings.subtitles}
                  onClick={() => setSettings((s) => ({ ...s, subtitles: !s.subtitles }))}
                  label="ترجمة مدمجة في الصورة"
                  hint="نص السرد محروق داخل الفيديو"
                />
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-purple-100/80 flex flex-wrap gap-x-4 gap-y-1">
                <span>⏱ المدة: <b>{fmt(total)}</b></span>
                <span>🗂 {ar(scenesCount)} مشهداً</span>
                <span>🖼 {settings.height}p · {settings.fps} إطار/ث</span>
                <span>📦 <b>{formatLabel}</b></span>
                <span>💾 ≈ {estimatedMB.toFixed(0)} م.ب</span>
              </div>

              <button
                type="button"
                disabled={!supported}
                onClick={start}
                className="w-full py-3.5 rounded-full text-lg font-black text-black transition hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                style={{ backgroundImage: 'linear-gradient(90deg,#fde047,#f59e0b)', boxShadow: '0 0 30px #f59e0b55' }}
              >
                ● ابدأ التحويل إلى فيديو
              </button>
              <p className="text-center text-[11px] text-purple-200/50 -mt-1">
                مدة التحويل ≈ {fmt(total)} (بالزمن الحقيقي) · الملف يُحفظ على جهازك عبر زر التحميل
              </p>
            </>
          )}

          {/* الملف جاهز */}
          {phase === 'done' && result && (
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-100 text-sm px-3 py-2">
                ✅ تم إنشاء الفيديو · {fmt(result.duration)} · {result.width}×{result.height} · {mb(result.blob.size)}
              </div>
              {result.ext === 'webm' && (
                <div className="rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-100 text-xs px-3 py-2 leading-relaxed">
                  ℹ️ الملف بصيغة <b>WebM</b> لأن هذا المتصفح لا يدعم تسجيل MP4. يوتيوب يقبلها مباشرة، وتُشغَّل على VLC
                  ومتصفحات Chrome/Firefox — لكن مشغّل ويندوز الافتراضي قد لا يفتحها. للحصول على MP4 استخدم <b>Chrome</b> أو{' '}
                  <b>Edge</b>.
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={url ?? '#'}
                  download={`golden-joystick-${scope === 'all' ? 'full-story' : `part${(scope as number) + 1}`}-${result.height}p.${result.ext}`}
                  onClick={() => setDownloaded(true)}
                  className="flex-1 text-center py-3 rounded-full font-black text-black"
                  style={{ backgroundImage: 'linear-gradient(90deg,#fde047,#f59e0b)' }}
                >
                  ⬇ تحميل الفيديو ({result.ext.toUpperCase()})
                </a>
                <a
                  href="https://studio.youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center py-3 rounded-full font-bold bg-white/10 hover:bg-white/20 border border-white/15"
                >
                  ↗ رفعه على يوتيوب
                </a>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPhase('setup');
                    setResult(null);
                    setProgress(null);
                    if (urlRef.current) {
                      URL.revokeObjectURL(urlRef.current);
                      urlRef.current = null;
                      setUrl(null);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  ♻ إعادة التحويل
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  إغلاق
                </button>
              </div>

              {/* بيانات الرفع على يوتيوب */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 space-y-2">
                <div className="text-sm font-black text-amber-300">📋 بيانات جاهزة للرفع على يوتيوب</div>
                <div className="space-y-1.5 text-xs">
                  {[
                    { key: 'title', label: 'العنوان', value: youtubeTitle },
                    { key: 'desc', label: 'الوصف + الفصول', value: youtubeDesc },
                    { key: 'tags', label: 'الوسوم', value: TAGS },
                  ].map((c) => (
                    <div key={c.key} className="flex items-center gap-2 rounded-lg bg-black/30 border border-white/10 px-2 py-1.5">
                      <span className="font-bold text-purple-200/80 shrink-0">{c.label}:</span>
                      <span className="flex-1 truncate text-purple-100/70">{c.value.replace(/\n/g, ' · ')}</span>
                      <button
                        type="button"
                        onClick={() => copy(c.value, c.key)}
                        className="shrink-0 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 font-bold"
                      >
                        {copied === c.key ? '✓ تم' : 'نسخ'}
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={downloadThumbnail}
                  className="w-full py-2 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 border border-white/15"
                >
                  🖼 تحميل صورة مصغّرة جاهزة (1280×720 PNG)
                </button>
                <div className="text-[11px] text-purple-200/60">
                  💡 المدة {fmt(total)} مناسبة ليوتيوب. الصورة المصغّرة بنسبة 16:9 تزيد نسبة النقر على الفيديو.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 md:px-5 py-2.5 border-t border-white/10 bg-white/[0.02] text-[11px] text-purple-200/50 flex flex-wrap justify-between gap-2">
          <span>🎞 {ar(scenesCount)} مشهداً · مدة هذا الفيديو: {fmt(total)}</span>
          <span>الفيديو يُنتج داخل متصفحك فقط — لا يُرفع أي شيء إلى الإنترنت.</span>
        </div>
      </div>
    </div>
  );
}
