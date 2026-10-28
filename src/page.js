// Page markup, rendered into index.html at build time (vite.config.js), so the whole
// page, its links and its copy work without JavaScript.
// Board positions (desktop) travel as inline custom properties: --x/--y/--w/--h for boxes,
// --x/--b/--fs/--sx for text lines (ink left, baseline, font size, horizontal scale), all
// in board px. The CSS only applies them from 1024 px up.
import images from './data/images.json';
import { site } from './data/site.js';
import { sections, plates, arc } from './data/board.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (n) => Number(n.toFixed(2));

function srcset(name, type) {
  const m = images[name];
  return m.widths.map((w) => `/img/${name}-${m.v}-${w}.${type} ${w}w`).join(', ');
}

function pic(name, { alt = '', cls = '', sizes = '100vw', lazy = true, priority = false, style = '' } = {}) {
  const m = images[name];
  const largest = m.widths[m.widths.length - 1];
  const h = Math.round((m.height * largest) / m.width);
  return `<picture class="${cls}"${style ? ` style="${style}"` : ''}><source type="image/avif" srcset="${srcset(name, 'avif')}" sizes="${sizes}"><source type="image/webp" srcset="${srcset(name, 'webp')}" sizes="${sizes}"><img src="/img/${name}-${m.v}-${largest}.webp" width="${largest}" height="${h}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''} decoding="async"${priority ? ' fetchpriority="high"' : ''}></picture>`;
}

const box = (p, dy = 0) => `--x:${num(p.x)};--y:${num(p.y - dy)};--w:${num(p.w)};--h:${num(p.h)}`;
const line = (x, b, fs, sx = 1) => `--x:${x};--b:${b};--fs:${fs};--sx:${sx}`;

// Split display words into masked characters for the scroll animations; the readable
// text stays in a visually hidden copy.
function chars(text, start = 0) {
  let i = start;
  return text.split(' ').map((word) => `<span class="w">${[...word].map((c) => `<span class="c" style="--i:${i++}">${esc(c)}</span>`).join('')}</span>`).join(' ');
}

const arrow = '<svg class="arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const pin = '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 15s5-4.6 5-8.6A5 5 0 0 0 3 6.4C3 10.4 8 15 8 15Z" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="6.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
const insta = '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="1.8" y="1.8" width="12.4" height="12.4" rx="3.6" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="11.7" cy="4.3" r=".8" fill="currentColor"/></svg>';
const ext = 'target="_blank" rel="noopener noreferrer"';
const book = (label, cls, style = '') => `<a class="${cls}" href="${site.booking}" ${ext}${style ? ` style="${style}"` : ''}>${label} ${arrow}</a>`;

// Arc polygon (fg clip) and rose line path, board px relative to a given origin.
const arcPoints = (dy) => arc.map(([x, y]) => [x, y - dy]);
const arcPath = (dy) => {
  const pts = arcPoints(dy).filter(([x]) => x >= 600);
  return 'M' + pts.map(([x, y]) => `${x} ${num(y)}`).join(' L');
};

// Mobile hero: the portrait box maps board px to mobile px (390-wide design) by this
// similarity, so the arc keeps cutting the same pixels of the D.
export const MOBILE = { x: 72, y: 405, k: 0.743 };
const toMobile = ([x, y]) => [MOBILE.x + (x - plates.portrait.x) * MOBILE.k, MOBILE.y + (y - plates.portrait.y) * MOBILE.k];

// Region above the arc (and right of it), in board px; main.js maps it to the hero-fg
// box in px (desktop frame or 390-wide mobile design) and lifts it by the rise.
const fgPoints = () => [[-700, -100], [1450, -100], [1450, 1300], [800, 1300], ...[...arc].reverse(), [-700, arc[0][1]]];

const HERO_M = num(toMobile([0, 508])[1]);
function arcPathMobile() {
  const pts = arc.filter(([x]) => x >= 600).map(toMobile).map(([x, y]) => [num(x), num(y - HERO_M)]);
  return 'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L');
}

function header() {
  return `
      <header class="site-header">
        <a class="brand b" href="#accueil" aria-label="La Dépendance, accueil" style="--x:89.7;--y:13;--w:74.5">${pic('logo', { alt: '', sizes: '120px', lazy: false })}</a>
        <nav class="nav" aria-label="Navigation principale">
          <a class="t m" href="#creations" style="${line(248, 34.9, 11.7)}">Ongles</a>
          <a class="t m" href="#prestations" data-service="regard" style="${line(323, 34.9, 11.9)}">Regard</a>
          <a class="t m" href="#lieu" style="${line(399, 34.9, 11.8)}">L’institut</a>
        </nav>
        ${book('Prendre rendez-vous', 'pill pill--line header-book b', '--x:534;--y:15;--w:170;--h:33;--fs:9.9')}
        <details class="menu">
          <summary>Menu <span aria-hidden="true" class="menu-plus"></span></summary>
          <nav aria-label="Navigation mobile"><a href="#lieu">L’institut</a><a href="#prestations">Prestations</a><a href="#creations">Réalisations</a><a href="#equipe">L’équipe</a><a href="#rendez-vous">Rendez-vous</a></nav>
        </details>
      </header>`;
}

export function renderPage() {
  const S = sections;
  const H = S.hero.h;
  return `
  <a class="skip-link" href="#prestations">Aller aux prestations</a>
  <div class="mini-header" data-mini>
    <a class="mini-brand" href="#accueil" aria-label="La Dépendance, accueil">${pic('logo', { alt: '', sizes: '60px' })}</a>
    <nav class="mini-nav" aria-label="Navigation rapide"><a href="#lieu">L’institut</a><a href="#prestations">Prestations</a><a href="#creations">Réalisations</a><a href="#rendez-vous">Rendez-vous</a></nav>
    ${book('Prendre rendez-vous', 'pill pill--solid mini-book')}
  </div>
  <main style="--Hm:${HERO_M}">
    <section class="hero" id="accueil" data-scene="hero" aria-labelledby="hero-title">
      <div class="hero-stage">
        <div class="band studio">${pic('studio', { sizes: '100vw', lazy: false, priority: true })}</div>
        <div class="frame">
          ${header()}
          <div class="hero-words" data-hero-words>
            <p class="script t c-anim" style="${line(74, 192, 50, 0.86)}">votre beauté</p>
            <h1 id="hero-title" class="title t" style="${line(32, 369, 187.2, 0.597)}"><span class="sr-only">À part.</span><span class="split" aria-hidden="true">${chars('À PART.')}</span></h1>
          </div>
          <div class="hero-copy" data-hero-copy>
            <p class="lead"><span class="t m" style="${line(33, 396.3, 15.9)}">La beauté des ongles et du regard,</span> <span class="t m" style="${line(32, 417.8, 15.9)}">à Pontchâteau.</span></p>
            ${book('Réserver sur Planity', 'pill pill--solid hero-book b', '--x:31;--y:437;--w:195;--h:34;--fs:10.7')}
          </div>
        </div>
      </div>
      <div class="hero-fg" aria-hidden="true" data-hero-fg>
        <div class="frame">
          <div class="fg-move b" style="${box(plates.portrait)}">
            ${pic('portrait', { cls: 'portrait', sizes: '(min-width: 1024px) 50vw, 90vw', lazy: false, priority: true })}
          </div>
        </div>
      </div>
    </section>

    <section class="place" id="lieu" data-scene="place" aria-labelledby="place-title">
      <div class="band place-band">${pic('interieur-flou', { sizes: '220px' })}</div>
      <div class="frame">
        <div class="photo-box b" style="${box(plates.interior)}" data-parallax="10">
          ${pic('interieur', { cls: 'photo', alt: 'L’accueil de La Maison B : comptoir terracotta, plantes et miroirs dorés.', sizes: '(min-width: 1024px) 90vw, 140vw' })}
        </div>
        <div class="place-shade" aria-hidden="true"></div>
        <svg class="rose-arc rose-arc--d" aria-hidden="true" focusable="false" viewBox="0 0 734 ${S.place.h}" preserveAspectRatio="none" overflow="visible"><path d="${arcPath(S.place.top)}" vector-effect="non-scaling-stroke"/></svg>
        <svg class="rose-arc rose-arc--m" aria-hidden="true" focusable="false" viewBox="0 0 390 420" preserveAspectRatio="none" overflow="visible"><path d="${arcPathMobile()}" vector-effect="non-scaling-stroke"/></svg>
        <h2 id="place-title" class="place-title" data-lines>
          <span class="ln t" style="${line(37, 618.5 - S.place.top, 62.9, 0.764)}"><span class="ln-in">Une adresse.</span></span>
          <span class="ln t" style="${line(37, 681.6 - S.place.top, 62.9, 0.752)}"><span class="ln-in">Votre parenthèse.</span></span>
        </h2>
        <p class="place-sub t m" style="${line(37, 702.6 - S.place.top, 11.4)}" data-fade>La Dépendance · Au sein de ${site.address.venue}</p>
        <a class="place-addr text-link t m" style="${line(37, 724 - S.place.top, 10.6)}" href="${site.address.maps}" ${ext} data-fade>${site.address.street} · ${site.address.city} ${arrow}</a>
      </div>
    </section>

    <section class="services" id="prestations" data-scene="services" aria-labelledby="services-title">
      <div class="frame">
        <h2 id="services-title" class="services-title"><span class="sr-only">À chacune son éclat.</span>
          <span class="ln t split" aria-hidden="true" style="${line(49, 970.3 - S.services.top, 112, 0.882)}">${chars('À CHACUNE')}</span>
          <span class="ln t split" aria-hidden="true" style="${line(49, 1096.2 - S.services.top, 112, 0.884)}">${chars('SON ÉCLAT.', 9)}</span>
        </h2>
        <img class="seal b" src="/img/sceau-${images.sceau.v}-240.webp" width="240" height="${Math.round(240 * images.sceau.height / images.sceau.width)}" alt="" aria-hidden="true" loading="lazy" style="--x:634.8;--y:${1007 - S.services.top};--w:48.3">
        <p class="service-links" data-fade>
          <a class="t m" href="${site.booking}" data-service="ongles" style="${line(51, 1125.9 - S.services.top, 11.6)}">Onglerie</a><span class="sep t m" aria-hidden="true" style="${line(115, 1125.9 - S.services.top, 11.6)}">/</span><a class="t m" href="${site.booking}" data-service="regard" style="${line(137, 1125.9 - S.services.top, 11.6)}">Beauté du regard</a><span class="sep t m" aria-hidden="true" style="${line(248, 1125.9 - S.services.top, 11.6)}">/</span><a class="t m" href="${site.booking}" data-service="maquillage" style="${line(270, 1125.9 - S.services.top, 11.6)}">Maquillage semi-permanent</a>
        </p>
        <a class="services-cta text-link t m" href="${site.booking}" data-service="ongles" style="${line(506, 1125.8 - S.services.top, 11.2)}" data-fade>Découvrir les prestations ${arrow}</a>
      </div>
    </section>

    <section class="creations" id="creations" data-scene="creations" aria-labelledby="creations-title">
      <div class="band creations-band">${pic('ongles-flou', { sizes: '160px' })}</div>
      <div class="frame">
        <div class="photo-box nails-box b" style="${box(plates.nails)}" data-parallax="8">
          ${pic('ongles', { cls: 'photo', alt: 'Une réalisation de La Dépendance : ongles fuchsia et motifs floraux.', sizes: '(min-width: 1024px) 85vw, 130vw' })}
        </div>
        <div class="creations-shade" aria-hidden="true"></div>
        <p class="eyebrow t m" style="${line(31, 1202.9 - S.creations.top, 12.6)}" data-fade>Ongles &amp; regard</p>
        <h2 id="creations-title" class="creations-title">
          <span class="ln t verb verb--draw" style="${line(31, 1274.5 - S.creations.top, 69.7, 0.807)}">Dessiner.</span>
          <span class="ln t verb verb--line" style="${line(31, 1345 - S.creations.top, 69.7, 0.81)}">Souligner.<span class="underline" aria-hidden="true"></span></span>
          <span class="ln t verb verb--reveal" style="${line(31, 1414 - S.creations.top, 69.7, 0.814)}">Révéler.</span>
        </h2>
        <button type="button" class="gallery-open text-link text-link--light t m js-only" data-open-gallery style="${line(31, 1435 - S.creations.top, 10.6)}">Voir les réalisations ${arrow}</button>
      </div>
    </section>

    <section class="team" id="equipe" data-scene="team" aria-labelledby="team-title">
      <div class="band team-band">${pic('equipe-flou', { sizes: '160px' })}</div>
      <div class="frame">
        <div class="photo-box team-box b" style="${box(plates.team)}" data-parallax="12">
          ${pic('equipe', { cls: 'photo', alt: 'Un moment de travail à l’institut, avec l’équipe.', sizes: '(min-width: 1024px) 40vw, 100vw' })}
        </div>
        <div class="team-shade" aria-hidden="true"></div>
        <h2 id="team-title" class="team-title" data-words>
          <span class="ln t m" style="${line(43, 1516.6 - S.team.top, 24.1)}">Le sens du détail.</span>
          <span class="ln t m" style="${line(42, 1550.4 - S.team.top, 24.1)}">Le plaisir du lien.</span>
        </h2>
        <p class="team-sub" data-words><span class="ln t m" style="${line(43, 1584 - S.team.top, 12.4)}">Un moment pour vous,</span> <span class="ln t m" style="${line(43, 1602 - S.team.top, 12.4)}">une attention à chaque geste.</span></p>
      </div>
    </section>

    <section class="booking" id="rendez-vous" data-scene="booking" aria-labelledby="booking-title">
      <div class="band booking-band">${pic('studio', { sizes: '100vw' })}</div>
      <div class="band booking-band booking-band--right">${pic('reservation-flou', { sizes: '200px' })}</div>
      <div class="frame">
        <div class="booking-scene b" style="${box(plates.booking)}" data-rise>
          ${pic('reservation', { cls: 'photo', alt: 'Une main tient un téléphone ouvert sur la page de La Dépendance sur Planity.', sizes: '(min-width: 1024px) 70vw, 160vw' })}
        </div>
        <h2 id="booking-title" class="booking-title" data-lines>
          <span class="ln t" style="${line(35, 1882.2 - S.booking.top, 108, 0.809)}"><span class="ln-in">Votre</span></span>
          <span class="ln t" style="${line(38, 1984.2 - S.booking.top, 108, 0.74)}"><span class="ln-in">moment.</span></span>
        </h2>
        <div class="booking-copy" data-stagger>
          <p class="t m" style="${line(37, 2004.8 - S.booking.top, 13.2)}">Choisissez votre rendez-vous sur Planity.</p>
          ${book('Prendre rendez-vous', 'pill pill--solid booking-book b', `--x:37;--y:${2016 - S.booking.top};--w:212;--h:35;--fs:10.8`)}
          <address>
            <a class="t m" href="${site.address.maps}" ${ext} style="${line(39, 2084.8 - S.booking.top, 10.7)}">${pin}<span>${site.address.street} · ${site.address.postcode} ${site.address.city}</span></a>
            <a class="t m" href="${site.instagram.url}" ${ext} style="${line(38, 2108.4 - S.booking.top, 10.5)}">${insta}<span>${site.instagram.handle}</span></a>
          </address>
        </div>
      </div>
      <div class="frame frame--top">
        <div class="phone b" style="${box(plates.phone)}" data-rise aria-hidden="true">
          <img src="/img/telephone-${images.telephone.v}-${images.telephone.widths.at(-1)}.webp" width="${images.telephone.width}" height="${images.telephone.height}" alt="" loading="lazy" decoding="async">
        </div>
      </div>
    </section>
  </main>

  <!-- TODO(dependance): mentions légales (raison sociale, SIRET, hébergeur) once the institute sends them -->
  <footer class="site-footer">
    <p>${site.name} · ${site.tagline} · ${site.address.street}, ${site.address.postcode} ${site.address.city}</p>
    <nav aria-label="Pied de page"><button type="button" class="js-only" data-motion-toggle aria-pressed="false">Mettre en pause</button><a href="#accueil">Retour en haut <span aria-hidden="true">↑</span></a></nav>
  </footer>

  <dialog class="dialog service-dialog" id="services-dialog" aria-labelledby="service-dialog-title">
    <form method="dialog" class="dialog-head">${pic('logo', { alt: 'La Dépendance — La beauté du regard', sizes: '80px' })}<button class="dialog-close" aria-label="Fermer les prestations">Fermer <span aria-hidden="true">×</span></button></form>
    <p class="dialog-eyebrow">À chacune son éclat.</p>
    <h2 id="service-dialog-title">Choisir votre moment.</h2>
    <div class="tabs" role="tablist" aria-label="Catégories de prestations">
      ${Object.entries(site.services).map(([key, s], i) => `<button type="button" role="tab" id="tab-${key}" data-category="${key}" aria-selected="${i === 0}" aria-controls="service-panel"${i ? ' tabindex="-1"' : ''}>${esc(s.tab)}</button>`).join('')}
    </div>
    <div id="service-panel" role="tabpanel" aria-labelledby="tab-ongles" tabindex="0">
      <h3 id="service-name">${esc(site.services.ongles.title)}</h3>
      <p id="service-description">${esc(site.services.ongles.description)}</p>
      <ul id="service-list">${site.services.ongles.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>
    </div>
    <p class="dialog-note">Retrouvez le détail des prestations, les tarifs et les disponibilités directement sur Planity.</p>
    ${book('Choisir sur Planity', 'pill pill--solid')}
  </dialog>

  <dialog class="dialog gallery-dialog" id="gallery-dialog" aria-labelledby="gallery-title">
    <form method="dialog" class="dialog-head"><h2 id="gallery-title">Les réalisations.</h2><button class="dialog-close" aria-label="Fermer les réalisations">Fermer <span aria-hidden="true">×</span></button></form>
    <figure>
      <div class="gallery-stage">${site.gallery.map((g, i) => pic(g.image, { cls: `gallery-img${i ? '' : ' is-current'}`, alt: g.caption, sizes: '(min-width: 700px) 600px, 90vw' })).join('')}</div>
      <figcaption id="gallery-caption" aria-live="polite">${esc(site.gallery[0].caption)}</figcaption>
    </figure>
    <div class="gallery-controls"><button type="button" data-gallery-prev aria-label="Réalisation précédente">←</button><span data-gallery-pos>1 / ${site.gallery.length}</span><button type="button" data-gallery-next aria-label="Réalisation suivante">→</button></div>
  </dialog>
  <script type="application/json" id="site-data">${JSON.stringify({ services: site.services, gallery: site.gallery, fgD: fgPoints(), fgM: fgPoints().map(toMobile).map(([x, y]) => [num(x), num(y)]) })}</script>`;
}
