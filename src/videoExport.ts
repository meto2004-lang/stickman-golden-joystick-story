// محرك تصدير الفيديو: يرسم القصة كاملة على Canvas ويسجّلها إلى ملف فيديو
// (MP4 إن كان مدعومًا، وإلا WebM) جاهز للرفع على YouTube.
import { W } from './engine';
import type { Scene } from './engine';
import { renderTimeline, sceneAt, videoDuration } from './render';
import { startMusic, type MusicHandle } from './music';

export type Resolution = 480 | 720 | 1080;
export type Fps = 24 | 30 | 60;

export interface ExportSettings {
  height: Resolution;
  fps: Fps;
  music: boolean;
  subtitles: boolean;
}

export interface ExportProgress {
  time: number;
  total: number;
  sceneIndex: number;
  sceneTitle: string;
  phase: 'preparing' | 'recording' | 'finalizing';
}

export interface ExportResult {
  blob: Blob;
  mime: string;
  ext: 'mp4' | 'webm';
  width: number;
  height: number;
  duration: number;
  fps: number;
}

const VIDEO_CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export function isExportSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    'captureStream' in HTMLCanvasElement.prototype
  );
}

/** أفضل صيغة يدعمها المتصفح (مع مراعاة وجود مسار صوتي) */
export function pickMimeType(audio: boolean): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const list = audio
    ? VIDEO_CANDIDATES
    : VIDEO_CANDIDATES.map((m) => m.replace(/,(opus|mp4a\.40\.2)/, '')).filter((m, i, a) => a.indexOf(m) === i);
  for (const m of list) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      /* تجاهل */
    }
  }
  return '';
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * تجربة قصيرة جدًا لصيغة معيّنة (نصف ثانية) للتأكد من أن المتصفح يستطيع
 * فعلًا التسجيل بهذه الصيغة — بعض المتصفحات تعلن الدعم ثم تفشل عند التسجيل.
 */
async function probeMime(mime: string, ac: AudioContext | null): Promise<boolean> {
  try {
    if (mime && !MediaRecorder.isTypeSupported(mime)) return false;
    const c = document.createElement('canvas');
    c.width = 160;
    c.height = 90;
    const g = c.getContext('2d');
    g?.fillRect(0, 0, 160, 90);
    const stream = c.captureStream(15);
    let audioStream: MediaStream | null = null;
    if (ac && ac.state === 'running') {
      const dest = ac.createMediaStreamDestination();
      dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
      audioStream = dest.stream;
    }

    const opts: MediaRecorderOptions = { videoBitsPerSecond: 300_000 };
    if (mime) opts.mimeType = mime;
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, opts);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }

    const chunks: Blob[] = [];
    const ok = await new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (v: boolean) => {
        if (settled) return;
        settled = true;
        resolve(v);
      };
      const guard = window.setTimeout(() => finish(false), 4000);
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size) chunks.push(e.data);
      };
      rec.onerror = () => {
        window.clearTimeout(guard);
        finish(false);
      };
      rec.onstop = () => {
        window.clearTimeout(guard);
        finish(chunks.reduce((a, b) => a + b.size, 0) > 0);
      };
      try {
        rec.start(150);
      } catch {
        window.clearTimeout(guard);
        finish(false);
        return;
      }
      window.setTimeout(() => {
        try {
          if (rec.state !== 'inactive') rec.stop();
        } catch {
          /* تجاهل */
        }
      }, 450);
    });

    stream.getTracks().forEach((t) => t.stop());
    audioStream?.getTracks().forEach((t) => t.stop());
    await sleep(0);
    return ok;
  } catch {
    return false;
  }
}

/** اختيار أول صيغة تعمل فعليًا */
async function resolveMime(audio: boolean, ac: AudioContext | null): Promise<string> {
  const list = audio
    ? VIDEO_CANDIDATES
    : VIDEO_CANDIDATES.map((m) => m.replace(/,(opus|mp4a\.40\.2)/, '')).filter((m, i, a) => a.indexOf(m) === i);
  for (const m of list) {
    if (await probeMime(m, audio ? ac : null)) return m;
  }
  // المحاولة الأخيرة: صيغة المتصفح الافتراضية دون تحديد نوع
  if (await probeMime('', audio ? ac : null)) return '';
  return audio ? (pickMimeType(true) || '') : '';
}

export interface ExportHandle {
  cancel: () => void;
  done: Promise<ExportResult>;
}

export function exportVideo(args: {
  canvas: HTMLCanvasElement;
  scenes: Scene[];
  settings: ExportSettings;
  onProgress?: (p: ExportProgress) => void;
}): ExportHandle {
  const { canvas, scenes, settings, onProgress } = args;
  const total = videoDuration(scenes);
  const height = settings.height;
  const width = Math.round((height * 16) / 9);
  const scale = width / W;

  let cancelled = false;
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let ac: AudioContext | null = null;
  let music: MusicHandle | null = null;
  let raf = 0;
  let abort: ((e: unknown) => void) | null = null;

  canvas.width = width;
  canvas.height = height;

  // يُنشأ سياق الصوت هنا (وبشكل متزامن) لأن المتصفحات تسمح بذلك فقط داخل تفاعل المستخدم،
  // وإلا فقد يبقى الصوت صامتًا في الملف الناتج.
  if (settings.music) {
    try {
      const Ctor: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ac = new Ctor();
      void ac.resume().catch(() => {});
    } catch {
      ac = null;
    }
  }

  const cleanup = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (music) {
      music.stop();
      music = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (ac) {
      const ctx = ac;
      ac = null;
      void ctx.close().catch(() => {});
    }
  };

  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    try {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    } catch {
      /* تجاهل */
    }
    cleanup();
    abort?.(new DOMException('تم إلغاء التحويل', 'AbortError'));
  };

  const done = (async (): Promise<ExportResult> => {
    if (!isExportSupported()) {
      throw new Error('المتصفح لا يدعم تسجيل الفيديو. جرّب Chrome أو Edge أو Firefox الحديث.');
    }

    onProgress?.({
      time: 0,
      total,
      sceneIndex: 0,
      sceneTitle: scenes[0]?.title ?? '',
      phase: 'preparing',
    });

    // التأكد من تحميل الخط قبل الرسم
    try {
      await document.fonts?.ready;
    } catch {
      /* تجاهل */
    }

    // الصوت
    let audioStream: MediaStream | null = null;
    if (ac) {
      try {
        if (ac.state === 'suspended') await ac.resume();
        const dest = ac.createMediaStreamDestination();
        music = startMusic(ac, dest);
        audioStream = dest.stream;
      } catch {
        if (ac) {
          void ac.close().catch(() => {});
          ac = null;
        }
        audioStream = null;
      }
    }

    const mime = await resolveMime(!!audioStream, ac);
    if (cancelled) throw new DOMException('تم إلغاء التحويل', 'AbortError');
    stream = canvas.captureStream(settings.fps);
    audioStream?.getAudioTracks().forEach((tr) => stream!.addTrack(tr));

    const bitrate =
      height >= 1080 ? (settings.fps >= 60 ? 9_000_000 : 6_000_000) : height >= 720 ? 4_000_000 : 2_500_000;

    const recOpts: MediaRecorderOptions = {
      videoBitsPerSecond: bitrate,
      audioBitsPerSecond: 128_000,
    };
    if (mime) recOpts.mimeType = mime;

    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, recOpts);
    } catch {
      // بعض المتصفحات ترفض صيغة معيّنة رغم الإعلان عن دعمها → نعيد المحاولة بالإعدادات الافتراضية
      rec = new MediaRecorder(stream, { videoBitsPerSecond: bitrate, audioBitsPerSecond: 128_000 });
    }
    recorder = rec;
    const actualMime = rec.mimeType || mime || '';

    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };
    let recError: Error | null = null;
    rec.onerror = (e) => {
      const ev = e as unknown as { error?: Error };
      recError = ev.error ?? new Error('فشل تسجيل الفيديو');
    };
    const stopped = new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
    });

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('تعذّر تجهيز Canvas للتصدير.');

    const paint = (time: number) => {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      renderTimeline(ctx, scenes, time, { subtitles: settings.subtitles });
    };

    paint(0);
    rec.start(1000);
    const t0 = performance.now();

    try {
      await new Promise<void>((resolve, reject) => {
        const bail = () => reject(new DOMException('تم إلغاء التحويل', 'AbortError'));
        if (cancelled) {
          bail();
          return;
        }
        abort = reject;
        const loop = () => {
          if (cancelled) {
            bail();
            return;
          }
          const elapsed = Math.min(total, (performance.now() - t0) / 1000);
          paint(elapsed);
          const { index, scene } = sceneAt(scenes, elapsed);
          onProgress?.({
            time: elapsed,
            total,
            sceneIndex: index,
            sceneTitle: scene.title,
            phase: 'recording',
          });
          if (elapsed >= total) {
            resolve();
            return;
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      });
    } catch (e) {
      try {
        if (rec.state !== 'inactive') rec.stop();
      } catch {
        /* تجاهل */
      }
      cleanup();
      throw e;
    }

    onProgress?.({
      time: total,
      total,
      sceneIndex: scenes.length - 1,
      sceneTitle: scenes[scenes.length - 1]?.title ?? '',
      phase: 'finalizing',
    });

    // إبقاء التسجيل لحظة بعد آخر إطار حتى يُحتسب
    paint(total);
    await new Promise((r) => setTimeout(r, 400));
    try {
      if (rec.state !== 'inactive') rec.stop();
    } catch {
      /* تجاهل */
    }
    await stopped;
    cleanup();

    if (cancelled) throw new DOMException('تم إلغاء التحويل', 'AbortError');
    if (recError) throw recError;

    const type = actualMime || 'video/webm';
    const blob = new Blob(chunks, { type });
    if (!blob.size) throw new Error('لم يتم إنتاج بيانات فيديو. جرّب صيغة أو متصفحًا آخر.');

    return {
      blob,
      mime: type,
      ext: type.includes('mp4') ? 'mp4' : 'webm',
      width,
      height,
      duration: total,
      fps: settings.fps,
    };
  })().catch((e: unknown) => {
    cleanup();
    throw e;
  });

  return { cancel, done };
}
