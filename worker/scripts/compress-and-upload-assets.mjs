// One-off migration: compress the static site images in public/assets/ to
// WebP and upload them to the classorbit-images R2 bucket under the "site/"
// prefix. Run with `pnpm assets:upload` from worker/ (requires `wrangler
// login` first — R2 object put talks to the Cloudflare API directly).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const BUCKET = 'classorbit-images';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_ASSETS = path.resolve(__dirname, '../../public/assets');

// [source filename, output name, max width]
const ASSETS = [
  ['home_hero_cosmic.jpg', 'home_hero_cosmic', 1920],
  ['teacher_portrait.jpg', 'teacher_portrait', 1200],
  ['teacher_class.jpg', 'teacher_class', 1200],
  ['teacher_students.jpg', 'teacher_students', 1200],
  ['home_feature_orbit.png', 'home_feature_orbit', 1920],
  ['blog_cover_chatgpt_vs_claude.png', 'blog_cover_chatgpt_vs_claude', 1200],
  ['blog_cover_worksheets.png', 'blog_cover_worksheets', 1200],
  ['blog_cover_slides.png', 'blog_cover_slides', 1200],
];

const scratch = mkdtempSync(path.join(tmpdir(), 'classorbit-assets-'));

try {
  for (const [srcName, outName, maxWidth] of ASSETS) {
    const srcPath = path.join(PUBLIC_ASSETS, srcName);
    const outPath = path.join(scratch, `${outName}.webp`);
    await sharp(srcPath)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outPath);

    const key = `site/${outName}.webp`;
    console.log(`Uploading ${key}...`);
    execFileSync('npx', [
      'wrangler', 'r2', 'object', 'put', `${BUCKET}/${key}`,
      `--file=${outPath}`, '--content-type=image/webp', '--remote',
    ], { stdio: 'inherit', shell: true });
  }
  console.log('Done. Verify objects in the R2 dashboard under the "site/" prefix.');
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
