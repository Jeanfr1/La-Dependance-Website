// Board check: renders the static desktop layout (?static), crops the board frame,
// scales it to the board's 734 px and writes qa/board-compare.png
// (board | page | 50 % blend) plus the mean absolute difference per section.
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BASE = process.env.QA_BASE || 'http://localhost:4357/';
const W = Number(process.env.W || 1440);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 });
await page.goto(`${BASE}?static&nosmooth`, { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  scrollTo(0, 0);
  await document.fonts.ready;
  const pending = [...document.querySelectorAll('main img')].filter((img) => !img.complete);
  await Promise.race([Promise.all(pending.map((img) => new Promise((r) => { img.onload = img.onerror = r; }))), new Promise((r) => setTimeout(r, 4000))]);
});
await page.waitForTimeout(500);
const { fl, u, H } = await page.evaluate(() => {
  const w = document.body.clientWidth; const u = Math.min(w, 1600) / 1024;
  return { fl: (w - 734 * u) / 2, u, H: document.querySelector('.site-footer').getBoundingClientRect().top + scrollY };
});
const shot = await page.screenshot({ fullPage: true });
await browser.close();
const boardW = 734;
const cropW = Math.round(734 * u);
const cropH = Math.min(Math.round(2141 * u), Math.floor(H));
const outH = Math.min(2141, Math.round((cropH * boardW) / cropW));
const pageCrop = await sharp(shot).extract({ left: Math.round(fl), top: 0, width: cropW, height: cropH })
  .resize({ width: boardW, height: outH, fit: 'fill' }).png().toBuffer();
const meta = await sharp(pageCrop).metadata();
const board = await sharp(path.join(ROOT, 'references/Modele3-A-Part-Approuve.png')).extract({ left: 0, top: 0, width: 734, height: Math.min(2141, meta.height) }).png().toBuffer();
const blend = await sharp(board).composite([{ input: await sharp(pageCrop).ensureAlpha(0.5).png().toBuffer(), blend: 'over' }]).png().toBuffer();
await fs.mkdir(path.join(ROOT, 'qa'), { recursive: true });
await sharp({ create: { width: boardW * 3 + 40, height: meta.height, channels: 3, background: '#ffffff' } })
  .composite([{ input: board, left: 0, top: 0 }, { input: pageCrop, left: boardW + 20, top: 0 }, { input: blend, left: boardW * 2 + 40, top: 0 }])
  .png().toFile(path.join(ROOT, 'qa/board-compare.png'));
const a = await sharp(board).removeAlpha().raw().toBuffer();
const b = await sharp(pageCrop).removeAlpha().raw().toBuffer();
const rows = { hero: [0, 508], place: [508, 851], services: [851, 1163], creations: [1163, 1447], team: [1447, 1745], booking: [1745, 2141] };
for (const [name, [y0, y1]] of Object.entries(rows)) {
  let sum = 0; let n = 0;
  for (let y = y0; y < Math.min(y1, meta.height); y++) for (let x = 0; x < boardW; x++) for (let c = 0; c < 3; c++) { const i = (y * boardW + x) * 3 + c; sum += Math.abs(a[i] - b[i]); n++; }
  console.log(name.padEnd(10), 'mean |diff|', (sum / n).toFixed(1));
}
console.log('wrote qa/board-compare.png');
