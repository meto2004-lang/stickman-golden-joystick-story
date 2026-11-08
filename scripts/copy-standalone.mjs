// ينسخ الملف المبني (HTML واحد) إلى جذر المشروع باسم story.html
// ليُفتح بضغطة مزدوجة على أي كمبيوتر بدون Node أو إنترنت.
import { copyFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const src = resolve('dist/index.html');
const dest = resolve('story.html');

if (!existsSync(src)) {
  console.error('✗ لم يُعثر على dist/index.html — شغّل "npm run build" أولًا.');
  process.exit(1);
}

copyFileSync(src, dest);
const kb = Math.round(statSync(dest).size / 1024);
console.log(`✓ story.html جاهز (${kb} ك.ب) — افتحه بضغطة مزدوجة.`);
