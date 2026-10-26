(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const stage = document.querySelector('.hero-stage');
  const runway = document.querySelector('.hero-runway');
  const header = document.querySelector('.site-header');
  const heroCopy = document.querySelector('.hero-copy');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 700px)');
  const connection = navigator.connection;
  const motionButtons = [...document.querySelectorAll('[data-motion-toggle]')];
  let preference = false;
  try { preference = localStorage.getItem('dependance.motion.off') === 'true'; } catch (_) { /* Optional local preference. */ }
  let off = false;
  let frame = 0;
  let introTimer = 0;
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const ease = t => t * t * (3 - 2 * t);

  function finishIntro() { clearTimeout(introTimer); stage.classList.remove('is-entering'); }
  function requestRender() { if (!frame && !off && !document.hidden) frame = requestAnimationFrame(render); }
  function applyPreference() {
    const ref = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    const section = ref && ref.closest('[data-scene]');
    const before = section && section !== runway ? section.getBoundingClientRect().top : null;
    const systemLock = reduced.matches || Boolean(connection && connection.saveData);
    off = preference || systemLock;
    root.classList.toggle('motion-off', off);
    if (off) {
      finishIntro();
      ['--hero-p', '--hero-exit', '--portal', '--pointer-x', '--pointer-y'].forEach(key => root.style.setProperty(key, '0'));
      header.inert = false;
      heroCopy.inert = false;
      document.querySelectorAll('.scene-photo').forEach(photo => photo.style.removeProperty('transform'));
    }
    motionButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(off));
      button.textContent = systemLock ? 'Mouvement réduit' : off ? 'Activer le mouvement' : 'Mettre en pause';
      button.disabled = systemLock;
      if (systemLock) button.title = 'Le réglage de votre appareil est respecté.';
      else button.removeAttribute('title');
    });
    if (before !== null) scrollBy({ top: section.getBoundingClientRect().top - before, behavior: 'instant' });
    requestRender();
  }
  function render() {
    frame = 0;
    if (off || document.hidden) return;
    const rect = runway.getBoundingClientRect();
    const distance = Math.max(1, runway.offsetHeight - stage.offsetHeight);
    const p = clamp(-rect.top / distance);
    const exit = ease(clamp((p - .25) / .48));
    const portal = ease(clamp((p - .48) / .52));
    root.style.setProperty('--hero-p', p.toFixed(4));
    root.style.setProperty('--hero-exit', exit.toFixed(4));
    root.style.setProperty('--portal', portal.toFixed(4));
    header.inert = exit > .96;
    heroCopy.inert = exit > .96;
    if (p > .035) finishIntro();
    document.querySelectorAll('.scene-photo').forEach(photo => {
      const r = photo.parentElement.getBoundingClientRect();
      if (r.top >= innerHeight + 60 || r.bottom <= -60) return;
      const t = clamp((r.top + r.height / 2 - innerHeight / 2) / Math.max(r.height, innerHeight), -.65, .65);
      photo.style.transform = `translateY(${(t * (narrow.matches ? 9 : 17)).toFixed(2)}px) scale(1.035)`;
    });
  }
  motionButtons.forEach(button => button.addEventListener('click', () => {
    preference = !off;
    try { localStorage.setItem('dependance.motion.off', String(preference)); } catch (_) { /* Works without storage. */ }
    applyPreference();
  }));
  reduced.addEventListener('change', applyPreference);
  if (connection && connection.addEventListener) connection.addEventListener('change', applyPreference);
  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', requestRender, { passive: true });
  addEventListener('pageshow', requestRender);
  document.addEventListener('visibilitychange', () => document.hidden ? finishIntro() : requestRender());
  stage.addEventListener('pointermove', event => {
    if (off || narrow.matches || event.pointerType !== 'mouse') return;
    const r = stage.getBoundingClientRect();
    root.style.setProperty('--pointer-x', ((event.clientX - r.left) / r.width * 2 - 1).toFixed(3));
    root.style.setProperty('--pointer-y', ((event.clientY - r.top) / r.height * 2 - 1).toFixed(3));
  }, { passive: true });
  stage.addEventListener('pointerleave', () => {
    root.style.setProperty('--pointer-x', '0');
    root.style.setProperty('--pointer-y', '0');
  });
  document.querySelectorAll('.mobile-nav a').forEach(a => a.addEventListener('click', () => document.querySelector('.mobile-nav').open = false));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('is-waiting');
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }), { threshold: .1, rootMargin: '0px 0px -15px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight) el.classList.add('is-waiting');
      observer.observe(el);
    });
  }

  const servicesDialog = document.getElementById('services-dialog');
  const galleryDialog = document.getElementById('gallery-dialog');
  const tabs = [...document.querySelectorAll('[data-category]')];
  let opener = null;
  let galleryIndex = 0;
  function openDialog(dialog, source) {
    if (typeof dialog.showModal !== 'function') return false;
    finishIntro();
    opener = source;
    dialog.showModal();
    document.body.classList.add('dialog-open');
    return true;
  }
  function selectCategory(key, focus = false) {
    const data = window.DEPENDANCE.services[key];
    if (!data) return;
    tabs.forEach(tab => {
      const active = tab.dataset.category === key;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    document.getElementById('service-panel').setAttribute('aria-labelledby', `tab-${key}`);
    document.getElementById('service-name').textContent = data.title;
    document.getElementById('service-description').textContent = data.description;
    document.getElementById('service-list').replaceChildren(...data.items.map(label => {
      const item = document.createElement('li');
      item.textContent = label;
      return item;
    }));
  }
  document.querySelectorAll('[data-service]').forEach(a => a.addEventListener('click', event => {
    if (typeof servicesDialog.showModal !== 'function') return;
    event.preventDefault();
    selectCategory(a.dataset.service);
    openDialog(servicesDialog, a);
  }));
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectCategory(tab.dataset.category));
    tab.addEventListener('keydown', event => {
      let n = i;
      if (event.key === 'ArrowRight') n = (i + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') n = 0;
      else if (event.key === 'End') n = tabs.length - 1;
      else return;
      event.preventDefault();
      selectCategory(tabs[n].dataset.category, true);
    });
  });
  function showGallery(index) {
    const list = window.DEPENDANCE.gallery;
    galleryIndex = (index + list.length) % list.length;
    const data = list[galleryIndex];
    const canvas = document.getElementById('gallery-canvas');
    const image = document.getElementById('gallery-image');
    canvas.setAttribute('viewBox', data.viewBox);
    image.setAttribute('href', data.file);
    image.setAttribute('width', String(data.width));
    image.setAttribute('height', String(data.height));
    document.getElementById('gallery-image-title').textContent = data.caption;
    document.getElementById('gallery-caption').textContent = data.caption;
    document.getElementById('gallery-position').textContent = `${galleryIndex + 1} / ${list.length}`;
  }
  document.querySelector('[data-open-gallery]').addEventListener('click', event => {
    showGallery(0);
    openDialog(galleryDialog, event.currentTarget);
  });
  document.getElementById('gallery-prev').addEventListener('click', () => showGallery(galleryIndex - 1));
  document.getElementById('gallery-next').addEventListener('click', () => showGallery(galleryIndex + 1));
  galleryDialog.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showGallery(galleryIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });
  [servicesDialog, galleryDialog].forEach(dialog => {
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      if (opener) opener.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
  });
  selectCategory('ongles');
  applyPreference();
  const portrait = document.querySelector('.hero-foreground img');
  Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), portrait.decode ? portrait.decode().catch(() => {}) : Promise.resolve()]).then(() => {
    if (off || scrollY > 60 || document.hidden) return;
    stage.classList.add('is-entering');
    introTimer = setTimeout(finishIntro, 1600);
  });
})();
