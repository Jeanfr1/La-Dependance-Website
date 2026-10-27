// README + share assets from the production build (npm run build && npm run preview):
// .github/assets/{banner.png, hero-scroll.gif, desktop-sections.jpg, mobile-screens.jpg}
// and public/og.jpg. Needs ffmpeg for the GIF.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BASE = process.env.QA_BASE || 'http://localhost:4357/';
const OUT = path.join(ROOT, '.github/assets');
const TMP = path.join(ROOT, 'scripts/out/readme');
await fs.mkdir(OUT, { recursive: true });
await fs.rm(TMP, { recursive: true, force: true });
await fs.mkdir(path.join(TMP, 'frames'), { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

async function load(width, height, query = '?nosmooth') {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(BASE + query, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(1900); // intro is 1.25 s
  return page;
}
async function at(page, y) {
  await page.evaluate((yy) => scrollTo(0, yy), y);
  await page.waitForTimeout(350);
  await settle(page);
}
const top = (page, sel, off = 0) => page.evaluate(([s, o]) => document.querySelector(s).getBoundingClientRect().top + scrollY + o, [sel, off]);

// banner
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 420 }, deviceScaleFactor: 2 });
  await page.goto(`file://${path.join(ROOT, 'scripts/banner.html')}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.locator('.banner').screenshot({ path: path.join(OUT, 'banner.png') });
  await page.close();
}

// rAF cadence check
{
  const page = await load(1440, 900);
  const ms = await page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => (++n < 30 ? requestAnimationFrame(f) : r((performance.now() - t0) / 30)); requestAnimationFrame(f); }));
  console.log('rAF', ms.toFixed(1), 'ms/frame');

  // hero GIF: the passage and the hand-off into the place section
  const end = await top(page, '.services', -120);
  const N = 60;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    await at(page, Math.round(end * (t * t * (3 - 2 * t))));
    await page.screenshot({ path: path.join(TMP, 'frames', `f_${String(i).padStart(4, '0')}.png`) });
  }
  // hold first and last frames
  const frames = path.join(TMP, 'frames');
  const list = [];
  for (let k = 0; k < 8; k++) list.push('f_0000.png');
  for (let i = 1; i < N - 1; i++) list.push(`f_${String(i).padStart(4, '0')}.png`);
  for (let k = 0; k < 10; k++) list.push(`f_${String(N - 1).padStart(4, '0')}.png`);
  await fs.mkdir(path.join(TMP, 'seq'), { recursive: true });
  for (let i = 0; i < list.length; i++) await fs.copyFile(path.join(frames, list[i]), path.join(TMP, 'seq', `s_${String(i).padStart(4, '0')}.png`));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '12', '-i', path.join(TMP, 'seq/s_%04d.png'), '-vf', 'fps=10,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle', '-loop', '0', path.join(OUT, 'hero-scroll.gif')]);

  await page.close();
}

// desktop sections, final states (?static = the board without the pin)
{
  const page = await load(1440, 900, '?static&nosmooth');
  const shots = [];
  for (const [sel, off] of [['.place', -58], ['.services', -58], ['.creations', -140], ['.booking', -300]]) {
    await at(page, await top(page, sel, off));
    shots.push(await page.screenshot());
  }
  const frame = async (buf) => {
    const w = 1440; const h = 900; const bar = 44;
    const chrome = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h + bar}"><rect width="${w}" height="${h + bar}" rx="14" fill="#2a1924"/><circle cx="26" cy="22" r="7" fill="#ff5f57"/><circle cx="50" cy="22" r="7" fill="#febc2e"/><circle cx="74" cy="22" r="7" fill="#28c840"/><rect x="520" y="10" width="400" height="24" rx="12" fill="#3d2435"/><text x="720" y="27" font-family="Helvetica" font-size="13" fill="#d4b4bb" text-anchor="middle">la-dependance-pontchateau.vercel.app</text></svg>`);
    return sharp(chrome).composite([{ input: buf, left: 0, top: bar }]).png().toBuffer();
  };
  const framed = await Promise.all(shots.map(frame));
  const cw = 1440; const ch = 944; const gap = 40;
  const sheet = await sharp({ create: { width: cw * 2 + gap * 3, height: ch * 2 + gap * 3, channels: 3, background: '#f5efe7' } })
    .composite(framed.map((input, i) => ({ input, left: gap + (i % 2) * (cw + gap), top: gap + Math.floor(i / 2) * (ch + gap) })))
    .png().toBuffer();
  await sharp(sheet).resize({ width: 1800 }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, 'desktop-sections.jpg'));
  await page.close();
}

// mobile screens
{
  const page = await load(390, 844);
  const shots = [await page.screenshot()];
  await page.close();
  const still = await load(390, 844, '?static&nosmooth');
  for (const [sel, off] of [['.services', -56], ['.booking', -10]]) {
    await at(still, await top(still, sel, off));
    shots.push(await still.screenshot());
  }
  await still.close();
  const phone = async (buf) => {
    const w = 390 + 28; const h = 844 + 28;
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="58" fill="#1f141b"/></svg>`);
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844"><rect width="390" height="844" rx="44" fill="#fff"/></svg>`);
    const screen = await sharp(buf).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    return sharp(svg).composite([{ input: screen, left: 14, top: 14 }]).png().toBuffer();
  };
  const framed = await Promise.all(shots.map(phone));
  const gap = 56;
  const sheet = await sharp({ create: { width: 418 * 3 + gap * 4, height: 872 + gap * 2, channels: 3, background: '#d4b4bb' } })
    .composite(framed.map((input, i) => ({ input, left: gap + i * (418 + gap), top: gap })))
    .png().toBuffer();
  await sharp(sheet).resize({ width: 1500 }).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(OUT, 'mobile-screens.jpg'));
}

// Open Graph image (hero at 1200 x 630)
{
  const page = await load(1200, 630);
  await sharp(await page.screenshot()).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(ROOT, 'public/og.jpg'));
  await page.close();
}

await browser.close();
for (const f of await fs.readdir(OUT)) console.log(f, ((await fs.stat(path.join(OUT, f))).size / 1024).toFixed(0), 'KB');
