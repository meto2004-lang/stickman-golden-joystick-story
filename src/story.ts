// تعريف أجزاء القصة وشخصياتها
import type { Scene } from './engine';
import { scenesA } from './scenes1';
import { scenesB } from './scenes2';
import { scenesC } from './scenes3';
import { scenesD } from './scenes4';
import { scenesE } from './scenes5';
import { scenesF } from './scenes6';

export interface StoryChar {
  name: string;
  role: string;
  color: string;
  emoji: string;
  desc: string;
}

export interface StoryPart {
  id: 'part1' | 'part2';
  /** رقم الجزء (١ أو ٢) */
  num: number;
  /** اسم قصير للتبويب: «الجزء الأول» */
  label: string;
  /** عنوان الجزء: «عصا التحكم الذهبية» */
  title: string;
  /** اسم الجزء الفرعي: «الختم القديم» */
  subtitle: string;
  /** سطر تعريفي على الغلاف */
  tagline: string;
  icon: string;
  accent: string;
  scenes: Scene[];
  chars: StoryChar[];
}

export const PART1_CHARS: StoryChar[] = [
  { name: 'الأزرق', role: 'البطل', color: '#3b82f6', emoji: '🟦', desc: 'شجاع وذكي، يجد الخريطة التي تغيّر كل شيء.' },
  { name: 'الأحمر', role: 'الخصم', color: '#ef4444', emoji: '🟥', desc: 'طامع في القوة، يلاحق العصا بأي ثمن.' },
  { name: 'الأصفر', role: 'الصديق', color: '#facc15', emoji: '🟨', desc: 'الصديق الوفي الذي لا يترك البطل أبداً.' },
  { name: 'الأسود', role: 'الغامض', color: '#a78bfa', emoji: '⚫', desc: 'يعرف سرّ العصا... وسرّ الختم القديم.' },
];

export const PART2_CHARS: StoryChar[] = [
  { name: 'الأزرق', role: 'البطل', color: '#3b82f6', emoji: '🟦', desc: 'صار حاملاً لمفتاح الختم... وعليه إغلاقه.' },
  { name: 'الأسود', role: 'الحارس', color: '#a78bfa', emoji: '⚫', desc: 'آخر حرّاس الختم، يكشف الحقيقة أخيراً.' },
  { name: 'الأصفر', role: 'الصديق', color: '#facc15', emoji: '🟨', desc: 'لا يتراجع، ويحمي أصدقاءه في المعركة.' },
  { name: 'الأحمر', role: 'التائب', color: '#ef4444', emoji: '🟥', desc: 'فتح الصدع بطمعه... ويبحث عن الخلاص.' },
  { name: 'الحارس الفارغ', role: 'الظل', color: '#7c3aed', emoji: '⬛', desc: 'كيان لا يشبع، يسكن العالم المقلوب.' },
];

export const PARTS: StoryPart[] = [
  {
    id: 'part1',
    num: 1,
    label: 'الجزء الأول',
    title: 'عصا التحكم الذهبية',
    subtitle: 'المعركة على العصا',
    tagline: 'يُقال إن من يمتلك العصا الذهبية يستطيع التحكم في قوانين العالم... فمن سيصل إليها أولاً؟',
    icon: '🔱',
    accent: '#fbbf24',
    scenes: [...scenesA, ...scenesB, ...scenesC],
    chars: PART1_CHARS,
  },
  {
    id: 'part2',
    num: 2,
    label: 'الجزء الثاني',
    title: 'الختم القديم',
    subtitle: 'مفتاح العالم المقلوب',
    tagline: 'لم تكن العصا قوة... بل مفتاحاً لقفلٍ قديم. والآن وقد انكسر الختم، يستيقظ الحارس الفارغ.',
    icon: '🗝️',
    accent: '#a78bfa',
    scenes: [...scenesD, ...scenesE, ...scenesF],
    chars: PART2_CHARS,
  },
];

export const ALL_SCENES: Scene[] = PARTS.flatMap((p) => p.scenes);

export const partDuration = (p: StoryPart) => p.scenes.reduce((a, s) => a + s.duration, 0);
export const storyDuration = () => PARTS.reduce((a, p) => a + partDuration(p), 0);
