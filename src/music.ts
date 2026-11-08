// موسيقى خلفية مُولّدة داخل المتصفح (Web Audio) — تُدمج في الفيديو المُصدَّر
// بدون أي ملفات صوتية خارجية.

const CHORDS: { notes: number[]; bass: number }[] = [
  { notes: [220.0, 261.63, 329.63], bass: 110.0 }, // Am
  { notes: [174.61, 220.0, 261.63], bass: 87.31 }, // F
  { notes: [261.63, 329.63, 392.0], bass: 130.81 }, // C
  { notes: [196.0, 246.94, 293.66], bass: 98.0 }, // G
];

const CHORD_DUR = 4;

export interface MusicHandle {
  stop: () => void;
}

/**
 * يشغّل موسيقى هادئة/ملحمية متكرّرة ويوجّهها إلى المخرج المطلوب.
 * @param ac   سياق الصوت (يجب أن يكون بدأ بعد تفاعل المستخدم)
 * @param out  مخرج الصوت (مثل MediaStreamAudioDestinationNode)
 */
export function startMusic(ac: AudioContext, out: AudioNode): MusicHandle {
  const master = ac.createGain();
  master.gain.value = 0.85;

  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value = 24;
  comp.ratio.value = 3.2;
  comp.attack.value = 0.006;
  comp.release.value = 0.25;
  master.connect(comp);
  comp.connect(out);

  // صدى خفيف لإعطاء عمق
  const delay = ac.createDelay(1);
  delay.delayTime.value = 0.36;
  const feedback = ac.createGain();
  feedback.gain.value = 0.3;
  const wet = ac.createGain();
  wet.gain.value = 0.26;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(master);

  const nodes: AudioScheduledSourceNode[] = [];

  const track = <T extends AudioScheduledSourceNode>(n: T) => {
    nodes.push(n);
    return n;
  };

  const pad = (when: number, notes: number[]) => {
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1500;
    filter.Q.value = 0.6;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.1, when + 1.3);
    g.gain.setValueAtTime(0.1, when + CHORD_DUR - 1.4);
    g.gain.exponentialRampToValueAtTime(0.0001, when + CHORD_DUR + 0.2);
    filter.connect(g);
    g.connect(master);
    g.connect(delay);

    notes.forEach((f, i) => {
      [0, 7].forEach((detune, k) => {
        const o = track(ac.createOscillator());
        o.type = k === 0 ? 'sine' : 'triangle';
        o.frequency.value = f;
        o.detune.value = detune - 3.5;
        const og = ac.createGain();
        og.gain.value = k === 0 ? 0.62 : 0.16 + i * 0.03;
        o.connect(og);
        og.connect(filter);
        o.start(when);
        o.stop(when + CHORD_DUR + 0.3);
      });
    });
  };

  const bass = (when: number, f: number) => {
    const o = track(ac.createOscillator());
    o.type = 'sine';
    o.frequency.value = f / 2;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.14, when + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, when + CHORD_DUR - 0.2);
    o.connect(g);
    g.connect(master);
    o.start(when);
    o.stop(when + CHORD_DUR);
  };

  const bell = (when: number, f: number) => {
    const o = track(ac.createOscillator());
    o.type = 'sine';
    o.frequency.value = f * 4;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.045, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.1);
    o.connect(g);
    g.connect(master);
    g.connect(delay);
    o.start(when);
    o.stop(when + 1.2);
  };

  const boom = (when: number) => {
    const o = track(ac.createOscillator());
    o.type = 'sine';
    o.frequency.setValueAtTime(90, when);
    o.frequency.exponentialRampToValueAtTime(38, when + 0.55);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.32, when + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.1);
    o.connect(g);
    g.connect(master);
    o.start(when);
    o.stop(when + 1.2);
  };

  const playChord = (when: number, ci: number) => {
    const chord = CHORDS[ci % CHORDS.length];
    pad(when, chord.notes);
    bass(when, chord.bass);
    // أربع نقرات جرس خفيفة داخل الكورد
    for (let i = 0; i < 4; i++) {
      bell(when + i * (CHORD_DUR / 4), chord.notes[[0, 1, 2, 1][i]]);
    }
    if (ci % 2 === 0) boom(when);
  };

  let nextTime = ac.currentTime + 0.12;
  let ci = 0;
  const schedule = () => {
    while (nextTime < ac.currentTime + 2) {
      playChord(nextTime, ci);
      nextTime += CHORD_DUR;
      ci += 1;
    }
  };
  schedule();
  const timer = window.setInterval(schedule, 400);

  let stopped = false;
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      window.clearInterval(timer);
      const now = ac.currentTime;
      try {
        master.gain.cancelScheduledValues(now);
        master.gain.setTargetAtTime(0.0001, now, 0.12);
      } catch {
        /* تجاهل */
      }
      window.setTimeout(() => {
        nodes.forEach((n) => {
          try {
            n.stop();
          } catch {
            /* تجاهل */
          }
          try {
            n.disconnect();
          } catch {
            /* تجاهل */
          }
        });
        try {
          master.disconnect();
          comp.disconnect();
        } catch {
          /* تجاهل */
        }
      }, 700);
    },
  };
}
