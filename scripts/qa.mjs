// QA against a running build: QA_BASE=http://localhost:4357/ npm run qa
// Layout (overflow, scale), links, dialogs (keyboard), passage states, no-JS,
// reduced motion and process words. Exit code 1 when a check fails.
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE || 'http://localhost:4357/';
const BOOKING = 'https://www.planity.com/la-dependance-beaute-du-regard-44160-pontchateau';
const PROCESS_WORDS = /\b(conceptuel|conceptual|illustrati|g[ée]n[ée]r[ée]|generated|edited|retouch|original photo|photo d.origine|campagne|campaign|mockup|maquette|IA\b|AI\b|placeholder|lorem)/i;
let failed = 0;
const ok = (cond, label, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`); if (!cond) failed++; };

const browser = await chromium.launch({ channel: 'chrome' });

async function open(width, height, { query = '?nosmooth', js = true, reduced = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: js, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE + query, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(300);
  return { ctx, page, errors };
}

// ---------- layout at five widths ----------
for (const [w, h] of [[1280, 720], [1440, 900], [1920, 1080], [390, 844], [360, 740]]) {
  const { ctx, page, errors } = await open(w, h);
  const m = await page.evaluate(async () => {
    const out = { overflow: [] };
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.6)) {
      scrollTo(0, y); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (document.documentElement.scrollWidth > innerWidth) out.overflow.push(y);
    }
    scrollTo(0, 0); await new Promise((r) => setTimeout(r, 100));
    const sec = (s) => document.querySelector(s).getBoundingClientRect().height;
    out.hero = document.querySelector('.hero-stage').getBoundingClientRect().height / innerHeight;
    out.sections = ['.place', '.services', '.creations', '.team', '.booking'].map((s) => [s, sec(s) / innerHeight]);
    out.small = [...document.querySelectorAll('main a, main p, main span, main button, address a')]
      .filter((el) => el.offsetParent && el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
      .map((el) => [el.textContent.trim().slice(0, 30), parseFloat(getComputedStyle(el).fontSize)])
      .filter(([, fs]) => fs < 11);
    return out;
  });
  ok(m.overflow.length === 0, `${w}x${h} no horizontal overflow`, m.overflow.join(','));
  if (w >= 1024) {
    ok(m.hero <= 1.05, `${w}x${h} hero <= 1.05 screen`, m.hero.toFixed(2));
    ok(m.sections.every(([, r]) => r <= 0.8), `${w}x${h} sections <= 0.8 screen`, m.sections.map(([s, r]) => `${s} ${r.toFixed(2)}`).join(' '));
  }
  ok(m.small.length === 0, `${w}x${h} text >= 11 px`, m.small.slice(0, 4).map(([t, f]) => `${t}:${f}`).join(' | '));
  ok(errors.length === 0, `${w}x${h} no console errors`, errors.join(' | '));
  await ctx.close();
}

// ---------- passage, links, dialogs (desktop) ----------
{
  const { ctx, page } = await open(1440, 900);
  const p0 = await page.evaluate(() => document.documentElement.dataset.heroP);
  ok(p0 === '0.000', 'hero passage starts at 0', p0);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(400);
  const mid = await page.evaluate(() => ({ p: Number(document.documentElement.dataset.heroP), fgTop: document.querySelector('.hero-fg').getBoundingClientRect().top, clip: document.querySelector('.hero-fg').style.clipPath.length }));
  ok(mid.p > 0.3 && mid.p < 0.9 && Math.abs(mid.fgTop) < 1 && mid.clip > 50, 'pinned hero + rising arc mid-passage', JSON.stringify(mid));
  await page.evaluate(() => scrollTo(0, document.querySelector('.place').getBoundingClientRect().top + scrollY));
  await page.waitForTimeout(300);
  const end = await page.evaluate(() => ({ p: document.documentElement.dataset.heroP, mini: document.querySelector('[data-mini]').classList.contains('is-on') }));
  ok(end.p === '1.000' && end.mini, 'passage ends at #lieu, mini header on', JSON.stringify(end));

  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.href));
  const book = links.filter((h) => h === BOOKING || h === `${BOOKING}/`);
  ok(book.length >= 5, 'Planity links', String(book.length));
  ok(links.some((h) => h.startsWith('https://www.instagram.com/ladependance_beauteduregard')), 'Instagram link');
  ok(links.some((h) => h.startsWith('https://www.google.com/maps/')), 'Maps link');
  ok(!links.some((h) => h.startsWith('tel:')), 'no phone link (none confirmed)');
  const ext = await page.evaluate(() => [...document.querySelectorAll('a[target="_blank"]')].every((a) => /noopener/.test(a.rel)));
  ok(ext, 'external links have rel=noopener');

  // services dialog by keyboard: open from "Beauté du regard", arrows, Escape, focus back
  await page.evaluate(() => scrollTo(0, document.querySelector('.services').getBoundingClientRect().top + scrollY - 100));
  await page.waitForTimeout(400);
  const trigger = page.locator('.service-links a[data-service="regard"]');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  let st = await page.evaluate(() => ({ open: document.getElementById('services-dialog').open, sel: document.querySelector('[role=tab][aria-selected=true]').dataset.category }));
  ok(st.open && st.sel === 'regard', 'services dialog opens on the chosen tab', JSON.stringify(st));
  await page.locator('[role=tab][aria-selected=true]').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('End');
  await page.keyboard.press('Home');
  st = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').dataset.category);
  ok(st === 'ongles', 'tabs: arrows / End / Home', st);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  st = await page.evaluate(() => ({ open: document.getElementById('services-dialog').open, focus: document.activeElement.dataset.service }));
  ok(!st.open && st.focus === 'regard', 'Escape closes, focus returns', JSON.stringify(st));

  // gallery: four slides with captions, arrow keys
  await page.evaluate(() => scrollTo(0, document.querySelector('.creations').getBoundingClientRect().top + scrollY - 200));
  await page.waitForTimeout(400);
  await page.locator('[data-open-gallery]').click();
  await page.waitForTimeout(300);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  st = await page.evaluate(() => ({ pos: document.querySelector('[data-gallery-pos]').textContent, cap: document.getElementById('gallery-caption').textContent, n: document.querySelectorAll('.gallery-img').length }));
  ok(st.pos === '3 / 4' && st.n === 4 && st.cap.length > 5, 'gallery: 4 slides, arrows, caption', JSON.stringify(st));
  await page.keyboard.press('Escape');

  // primary CTA is clickable with a real pointer at the top of the page and mid-passage
  for (const y of [0, 300]) {
    await page.evaluate((yy) => scrollTo(0, yy), y);
    await page.waitForTimeout(250);
    const hit = await page.evaluate(() => {
      const a = [...document.querySelectorAll('.hero-book, .mini-book')].find((el) => { const r = el.getBoundingClientRect(); return r.width && r.top >= 0 && r.bottom <= innerHeight && getComputedStyle(el).visibility !== 'hidden' && Number(getComputedStyle(el.closest('[data-hero-copy]') || el).opacity) > 0.5; });
      if (!a) return 'none';
      const r = a.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return top && (top === a || a.contains(top)) ? 'ok' : `covered by ${top && top.className}`;
    });
    ok(hit === 'ok' || (y > 0 && hit === 'none'), `booking CTA hit-test at scroll ${y}`, hit);
  }

  // process words in visible text and alt attributes
  const text = await page.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('[alt]')].map((i) => i.alt).join(' '));
  const hit = text.match(PROCESS_WORDS);
  ok(!hit, 'no production notes on the page', hit ? hit[0] : '');
  await ctx.close();
}

// ---------- reduced motion: static board, no pin ----------
{
  const { ctx, page } = await open(1440, 900, { reduced: true });
  const r = await page.evaluate(() => ({ motion: document.documentElement.classList.contains('motion'), hero: document.querySelector('.hero').getBoundingClientRect().height, stage: getComputedStyle(document.querySelector('.hero-stage')).position, btn: document.querySelector('[data-motion-toggle]').textContent }));
  ok(!r.motion && r.stage !== 'sticky' && r.hero < 800, 'reduced motion: no pinned runway', JSON.stringify(r));
  await ctx.close();
}

// ---------- no JavaScript: everything readable ----------
{
  const { ctx, page } = await open(1440, 900, { js: false, query: '' });
  const r = await page.evaluate(() => ({
    titles: [...document.querySelectorAll('h1, h2')].map((h) => h.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).length,
    hidden: [...document.querySelectorAll('h1, h2, .lead, address')].filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length,
    book: [...document.querySelectorAll('a')].filter((a) => a.href.includes('planity.com')).length,
  }));
  ok(r.titles >= 6 && r.hidden === 0 && r.book >= 5, 'no-JS: titles, copy and booking links present', JSON.stringify(r));
  await ctx.close();
}

// ---------- kit stays out of the deploy ----------
{
  const { ctx, page } = await open(800, 600, { query: '' });
  for (const p of ['LEIA-ME-KIT.md', 'roteiros/01-implementacao.md', 'site/index.html', 'references/Modele3-A-Part-Approuve.png', 'images/originals/equipe-original.png']) {
    const res = await page.request.get(BASE + p);
    const body = await res.text();
    const served = res.status() === 200 && !body.includes('id="site-data"');
    ok(!served, `kit file not served: ${p}`, String(res.status()));
  }
  await ctx.close();
}

await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
