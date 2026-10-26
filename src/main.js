// La Dépendance — motion and interactions.
// One rAF render per scroll/resize event (no loop while the page is still), Lenis for
// wheel smoothing. Every scroll scene writes its own inline styles; nothing is hidden
// until this module runs (the head script only switches the pinned layout on).
import Lenis from 'lenis';
import './styles/main.css';

const root = document.documentElement;
const data = JSON.parse(document.getElementById('site-data').textContent);
const desktop = matchMedia('(min-width: 1024px)');
const reducedMq = matchMedia('(prefers-reduced-motion: reduce)');
const params = new URLSearchParams(location.search);
const connection = navigator.connection;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (v, a, b) => clamp((v - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const out3 = (t) => 1 - (1 - t) ** 3;
const EASE = 'cubic-bezier(.2,.7,.2,1)';

// ---------- units (match the CSS) ----------
const pageW = () => document.body.clientWidth;
const unit = () => (desktop.matches ? Math.min(pageW(), 1600) / 1024 : pageW() / 390);
const heroHm = Number(getComputedStyle(document.querySelector('main')).getPropertyValue('--Hm')) || 746;
const heroH = () => (desktop.matches ? 508 : heroHm) * unit();

// ---------- motion preference ----------
let stored = false;
try { stored = localStorage.getItem('dependance.motion.off') === 'true'; } catch { /* storage optional */ }
const systemLock = () => reducedMq.matches || Boolean(connection && connection.saveData) || params.has('static');
let motionOn = root.classList.contains('motion');

// ---------- elements ----------
const hero = $('.hero');
const fg = $('[data-hero-fg]');
const fgPic = $('.fg-move picture');
const words = $('[data-hero-words]');
const copy = $('[data-hero-copy]');
const siteHeader = $('.site-header');
const studioImg = $('.studio img');
const place = $('.place');
const mini = $('[data-mini]');
const services = $('.services');
const creations = $('.creations');
const team = $('.team');
const booking = $('.booking');
const vh = () => window.innerHeight;

// Team copy: wrap words for the reading scrub (text content is unchanged).
$$('[data-words] .ln').forEach((ln) => {
  ln.innerHTML = ln.textContent.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
});

// ---------- clip polygons in px (Chrome does not repaint container-unit clip paths reliably) ----------
function fgPolygon(rise) {
  const u = unit();
  if (desktop.matches) {
    const fl = (pageW() - 734 * u) / 2;
    return `polygon(${data.fgD.map(([x, y]) => `${(fl + x * u).toFixed(1)}px ${(y * u - rise).toFixed(1)}px`).join(',')})`;
  }
  return `polygon(${data.fgM.map(([x, y]) => `${(x * u).toFixed(1)}px ${(y * u - rise).toFixed(1)}px`).join(',')})`;
}
function staticClips() {
  if (!desktop.matches) { team.style.clipPath = `polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - ${(40 * unit()).toFixed(1)}px))`; return; }
  const u = unit();
  const W = pageW();
  const fl = (W - 734 * u) / 2;
    const yAt = (px) => (300 + 0.102 * ((px - fl) / u)) * u;
  team.style.clipPath = `polygon(0 0, 100% 0, 100% ${yAt(W).toFixed(1)}px, 0 ${yAt(0).toFixed(1)}px)`;
}

// ---------- scroll scenes ----------
const pointer = { x: 0, y: 0 };

function renderHero() {
  const H = heroH();
  const fgTop = fg.getBoundingClientRect().top;
  const rise = clamp(H - (place.getBoundingClientRect().top - fgTop), 0, H);
  const p = rise / H > 0.997 ? 1 : rise / H;
  root.dataset.heroP = p.toFixed(3);
  fg.style.setProperty('--rise', `${rise.toFixed(1)}px`);
  fg.style.clipPath = fgPolygon(rise);
  const exit = smooth(range(p, 0.12, 0.6));
  const early = smooth(range(p, 0.02, 0.32));
  const portal = smooth(range(p, 0.42, 1));
  words.style.transform = `translate3d(${(-45 * exit).toFixed(1)}px,0,0)`;
  words.style.opacity = (1 - exit).toFixed(3);
  copy.style.transform = `translate3d(0,${(-20 * early).toFixed(1)}px,0)`;
  copy.style.opacity = (1 - early).toFixed(3);
  siteHeader.style.opacity = (1 - exit).toFixed(3);
  siteHeader.style.visibility = exit > 0.98 ? 'hidden' : 'visible';
  const shift = (desktop.matches ? 0.32 : 0.18) * innerWidth * portal;
  fgPic.style.setProperty('--fg-x', `${(shift - pointer.x * 7).toFixed(1)}px`);
  fgPic.style.setProperty('--fg-y', `${(-pointer.y * 5).toFixed(1)}px`);
  fgPic.style.setProperty('--fg-s', (1 + 0.045 * portal).toFixed(4));
  fgPic.style.setProperty('--fg-o', (1 - smooth(range(p, 0.55, 1))).toFixed(3));
  studioImg.style.setProperty('--studio-s', (1.015 + 0.018 * p).toFixed(4));
  // the header's booking pill fades out with the titles: the mini header takes over
  mini.classList.toggle('is-on', exit > 0.55 || place.getBoundingClientRect().top < 64);
}

function sceneProgress(el, from = 1, to = 0.2) {
  const top = el.getBoundingClientRect().top;
  return range(top, vh() * from, vh() * to);
}

function inView(el, margin = 80) {
  const r = el.getBoundingClientRect();
  return r.bottom > -margin && r.top < vh() + margin;
}

const serviceChars = $$('.services-title .c');
const seal = $('.seal');
const serviceFades = $$('.services [data-fade]');
function renderServices() {
  if (!inView(services)) return;
  const q = sceneProgress(services, 1, 0.12);
  const n = serviceChars.length;
  serviceChars.forEach((c, i) => {
    const e = out3(range(q, 0.02 + (i / n) * 0.42, 0.3 + (i / n) * 0.42));
    c.style.transform = e >= 1 ? '' : `translate3d(0,${((1 - e) * 108).toFixed(1)}%,0)`;
  });
  const s = out3(range(q, 0.4, 0.95));
  seal.style.transform = s >= 1 ? '' : `rotate(${(-150 * (1 - s)).toFixed(1)}deg) scale(${(0.45 + 0.55 * s).toFixed(3)})`;
  seal.style.opacity = s.toFixed(3);
  serviceFades.forEach((el, i) => {
    const f = smooth(range(q, 0.55 + i * 0.1, 0.85 + i * 0.1));
    el.style.opacity = f.toFixed(3);
    el.style.translate = f >= 1 ? '' : `0 ${(12 * (1 - f)).toFixed(1)}px`;
  });
}

const nailsBox = $('.nails-box');
const verbs = $$('.verb');
const underline = $('.verb--line .underline');
const creationsFades = $$('.creations [data-fade], .gallery-open');
function renderCreations() {
  if (!inView(creations)) return;
  const q = sceneProgress(creations, 1, 0.18);
  const wipe = out3(range(q, 0, 0.62));
  nailsBox.style.clipPath = wipe >= 1 ? '' : `inset(0 0 0 ${(58 * (1 - wipe)).toFixed(2)}%)`;
  const d = out3(range(q, 0.18, 0.52));
  verbs[0].style.clipPath = d >= 1 ? '' : `inset(-20% ${((1 - d) * 100).toFixed(2)}% -20% 0)`;
  const l = range(q, 0.34, 0.8);
  const lIn = out3(range(l, 0, 0.35));
  verbs[1].style.opacity = lIn.toFixed(3);
  verbs[1].style.translate = lIn >= 1 ? '' : `${(-24 * (1 - lIn)).toFixed(1)}px 0`;
  const sweep = l < 0.5 ? out3(range(l, 0.05, 0.5)) : 1 - out3(range(l, 0.55, 1));
  underline.style.setProperty('--ul-s', sweep.toFixed(3));
  underline.style.setProperty('--ul-o', l < 0.5 ? '0 0' : '100% 0');
  const r = smooth(range(q, 0.5, 0.88));
  verbs[2].style.opacity = r.toFixed(3);
  verbs[2].style.filter = r >= 1 ? '' : `blur(${(10 * (1 - r)).toFixed(2)}px)`;
  creationsFades.forEach((el, i) => {
    const f = smooth(range(q, i ? 0.8 : 0.08, i ? 1 : 0.35));
    el.style.opacity = f.toFixed(3);
  });
}

const teamBox = $('.team-box');
const teamWords = $$('.team [data-words] .w');
function renderTeam() {
  if (!inView(team)) return;
  const q = sceneProgress(team, 1, 0.2);
  const open = out3(range(q, 0, 0.7));
  teamBox.style.clipPath = open >= 1 ? '' : `inset(0 0 ${((1 - open) * 62).toFixed(2)}% 0)`;
  const n = teamWords.length;
  teamWords.forEach((w, i) => {
    const e = range(q, 0.15 + (i / n) * 0.6, 0.27 + (i / n) * 0.6);
    w.style.opacity = (0.16 + 0.84 * e).toFixed(3);
  });
}

const risers = $$('[data-rise]');
function renderBooking() {
  if (!inView(booking, 200)) return;
  const q = sceneProgress(booking, 1, 0.3);
  const e = out3(range(q, 0, 1));
  const lift = (desktop.matches ? 64 : 0) * unit() * (1 - e);
  risers.forEach((el) => el.style.setProperty('--rise-y', `${lift.toFixed(1)}px`));
}

const parallax = $$('[data-parallax]').map((box) => ({ box, pic: box.querySelector('picture'), k: Number(box.dataset.parallax) }));
function renderParallax() {
  parallax.forEach(({ box, pic, k }) => {
    const r = box.parentElement.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh() + 100) return;
    const t = clamp((r.top + r.height / 2 - vh() / 2) / (vh() + r.height), -0.6, 0.6);
    pic.style.transform = `translate3d(0,${(t * k * unit()).toFixed(2)}px,0) scale(1.03)`;
  });
}

let frame = 0;
function render() {
  frame = 0;
  if (!motionOn) return;
  renderHero();
  renderServices();
  renderCreations();
  renderTeam();
  renderBooking();
  renderParallax();
}
const requestRender = () => { if (!frame) frame = requestAnimationFrame(render); };

// ---------- smooth wheel (Lenis), only while moving ----------
let lenis = null;
let lenisRunning = false;
function lenisLoop(time) {
  lenis.raf(time);
  render();
  if (lenis.isScrolling) requestAnimationFrame(lenisLoop);
  else lenisRunning = false;
}
function kickLenis() {
  if (lenis && !lenisRunning) { lenisRunning = true; requestAnimationFrame(lenisLoop); }
}
function startLenis() {
  if (lenis || params.has('nosmooth')) return;
  lenis = new Lenis({ lerp: 0.12, smoothWheel: true, autoRaf: false, anchors: { offset: 0 } });
  lenis.on('scroll', kickLenis);
  addEventListener('wheel', kickLenis, { passive: true });
}
function stopLenis() {
  if (!lenis) return;
  lenis.destroy();
  lenis = null;
}

// ---------- intro (1.25 s, skipped when the page opens scrolled) ----------
let intro = [];
function finishIntro() { intro.forEach((a) => a.finish()); intro = []; }
function playIntro() {
  if (!motionOn || scrollY > 40 || document.hidden) return;
  const opts = (delay, duration = 900) => ({ delay, duration, easing: EASE, fill: 'backwards' });
  $$('.title .c').forEach((c, i) => intro.push(c.animate([{ transform: 'translate3d(0,108%,0)' }, { transform: 'none' }], opts(120 + i * 55, 950))));
  const script = $('.script');
  intro.push(script.animate([{ clipPath: 'inset(-30% 100% -30% 0)' }, { clipPath: 'inset(-30% 0 -30% 0)' }], opts(420, 1000)));
  intro.push(fgPic.animate([{ opacity: 0.15, translate: '35px 16px', scale: '1.025' }, { opacity: 1, translate: '0 0', scale: '1' }], opts(0, 1250)));
  intro.push(copy.animate([{ opacity: 0, transform: 'translate3d(0,14px,0)' }, { opacity: 1, transform: 'none' }], opts(520, 800)));
  intro.push(siteHeader.animate([{ opacity: 0, transform: 'translate3d(0,-10px,0)' }, { opacity: 1, transform: 'none' }], opts(0, 800)));
  const t = setTimeout(() => { intro = []; }, 1600);
  addEventListener('scroll', () => { clearTimeout(t); finishIntro(); }, { once: true, passive: true });
}

// ---------- one-shot line reveals (titles that are read, not scrubbed) ----------
let lineObserver = null;
function revealLines(group, delay = 0) {
  $$('.ln-in', group).forEach((el, i) => el.animate([{ transform: 'translate3d(0,108%,0)' }, { transform: 'none' }], { delay: delay + i * 140, duration: 950, easing: EASE, fill: 'backwards' }));
  const section = group.closest('section');
  $$('[data-fade], [data-stagger] > *', section).filter((el) => !el.closest('.services, .creations')).forEach((el, i) => {
    el.animate([{ opacity: 0 }, { opacity: 1 }], { delay: delay + 380 + i * 110, duration: 800, easing: EASE, fill: 'backwards' });
  });
}
function watchLines() {
  if (!('IntersectionObserver' in window)) return;
  lineObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    lineObserver.unobserve(entry.target);
    if (motionOn) revealLines(entry.target, entry.target.closest('.place') && scrollY < 40 ? 650 : 0);
  }), { rootMargin: '0px 0px -12% 0px' });
  $$('[data-lines]').forEach((el) => lineObserver.observe(el));
}

// ---------- pointer parallax on the portrait (desktop mouse only) ----------
hero.addEventListener('pointermove', (e) => {
  if (!motionOn || !desktop.matches || e.pointerType !== 'mouse') return;
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = (e.clientY / innerHeight) * 2 - 1;
  requestRender();
}, { passive: true });
hero.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; requestRender(); });

// ---------- motion on / off ----------
const animated = () => [words, copy, siteHeader, fg, fgPic, studioImg, seal, nailsBox, teamBox, underline, ...serviceChars, ...serviceFades, ...verbs, ...creationsFades, ...teamWords, ...risers, ...parallax.map((p) => p.pic)];
function clearInline() {
  animated().forEach((el) => {
    ['transform', 'opacity', 'clip-path', 'filter', 'translate', 'visibility', '--rise', '--fg-x', '--fg-y', '--fg-s', '--fg-o', '--studio-s', '--ul-s', '--ul-o', '--rise-y'].forEach((p) => el.style.removeProperty(p));
  });
  mini.classList.toggle('is-on', scrollY > heroH());
  fg.style.clipPath = fgPolygon(0);
}
const toggles = $$('[data-motion-toggle]');
function applyMotion(keepPlace = true) {
  const ref = keepPlace ? $$('main > section').find((s) => s.getBoundingClientRect().bottom > vh() * 0.4) : null;
  const before = ref && ref !== hero ? ref.getBoundingClientRect().top : null;
  motionOn = !stored && !systemLock();
  root.classList.toggle('motion', motionOn);
  root.classList.toggle('motion-off', !motionOn);
  if (motionOn) { root.classList.add('anim-ready'); startLenis(); } else { finishIntro(); stopLenis(); clearInline(); }
  toggles.forEach((b) => {
    const lock = systemLock();
    b.disabled = lock;
    b.setAttribute('aria-pressed', String(!motionOn));
    b.textContent = lock ? 'Mouvement réduit' : motionOn ? 'Mettre en pause' : 'Activer le mouvement';
  });
  if (before !== null) scrollBy({ top: ref.getBoundingClientRect().top - before, behavior: 'instant' });
  requestRender();
}
toggles.forEach((b) => b.addEventListener('click', () => {
  stored = motionOn;
  try { localStorage.setItem('dependance.motion.off', String(stored)); } catch { /* storage optional */ }
  applyMotion();
}));
reducedMq.addEventListener('change', () => applyMotion());
connection?.addEventListener?.('change', () => applyMotion());

addEventListener('scroll', requestRender, { passive: true });
addEventListener('resize', () => { staticClips(); requestRender(); }, { passive: true });
addEventListener('pageshow', requestRender);
desktop.addEventListener('change', () => { staticClips(); requestRender(); });
document.addEventListener('visibilitychange', () => (document.hidden ? finishIntro() : requestRender()));

// ---------- mobile menu ----------
const menu = $('.menu');
$$('a', menu).forEach((a) => a.addEventListener('click', () => { menu.open = false; }));
document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });

// ---------- dialogs: services (tabs) and gallery ----------
const servicesDialog = $('#services-dialog');
const galleryDialog = $('#gallery-dialog');
const tabs = $$('[data-category]');
let opener = null;
function openDialog(dialog, source) {
  if (typeof dialog.showModal !== 'function') return false;
  finishIntro();
  opener = source;
  dialog.showModal();
  document.body.classList.add('dialog-open');
  lenis?.stop();
  return true;
}
function selectCategory(key, focus = false) {
  const s = data.services[key];
  if (!s) return;
  tabs.forEach((tab) => {
    const on = tab.dataset.category === key;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) tab.focus();
  });
  $('#service-panel').setAttribute('aria-labelledby', `tab-${key}`);
  $('#service-name').textContent = s.title;
  $('#service-description').textContent = s.description;
  $('#service-list').replaceChildren(...s.items.map((label) => Object.assign(document.createElement('li'), { textContent: label })));
}
$$('[data-service]').forEach((a) => a.addEventListener('click', (e) => {
  if (typeof servicesDialog.showModal !== 'function') return;
  e.preventDefault();
  selectCategory(a.dataset.service);
  openDialog(servicesDialog, a);
}));
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectCategory(tab.dataset.category));
  tab.addEventListener('keydown', (e) => {
    const map = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    selectCategory(tabs[map[e.key]].dataset.category, true);
  });
});
const slides = $$('.gallery-img');
let slide = 0;
function showSlide(i) {
  slide = (i + slides.length) % slides.length;
  slides.forEach((s, n) => s.classList.toggle('is-current', n === slide));
  $('#gallery-caption').textContent = data.gallery[slide].caption;
  $('[data-gallery-pos]').textContent = `${slide + 1} / ${slides.length}`;
}
$('[data-open-gallery]').addEventListener('click', (e) => { showSlide(0); openDialog(galleryDialog, e.currentTarget); });
$('[data-gallery-prev]').addEventListener('click', () => showSlide(slide - 1));
$('[data-gallery-next]').addEventListener('click', () => showSlide(slide + 1));
galleryDialog.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  e.preventDefault();
  showSlide(slide + (e.key === 'ArrowRight' ? 1 : -1));
});
[servicesDialog, galleryDialog].forEach((dialog) => {
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    lenis?.start();
    opener?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });
});

// ---------- start ----------
staticClips();
applyMotion(false);
watchLines();
render();
const portraitImg = $('.portrait img');
Promise.all([document.fonts?.ready, portraitImg.decode?.().catch(() => {})]).then(() => { playIntro(); requestRender(); });
root.dataset.ready = '1';
