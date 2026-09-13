(() => {
  'use strict';
  if (window.__moyuanLabInstalled) return;
  window.__moyuanLabInstalled = true;
  let dispose = () => {};

  function init() {
    dispose();
    const hero = document.querySelector('.home-hero-fullscreen');
    if (!hero) return;

    const controller = new AbortController();
    const { signal } = controller;
    const on = (node, event, fn) => node.addEventListener(event, fn, { signal });

    const open = document.querySelector('#shell-open');
    const interact = document.querySelector('#star-interact');
    const host = hero.querySelector('.starfield');

    // Vendor Marquee
    const vendors = document.querySelector('.ai-vendors');
    if (vendors) {
      if (!vendors.parentElement.classList.contains('vendor-marquee')) {
        const frame = document.createElement('div');
        frame.className = 'vendor-marquee';
        vendors.before(frame);
        frame.append(vendors);
      }
      vendors.querySelectorAll('[data-vendor-clone]').forEach(e => e.remove());
      [...vendors.children].forEach(el => {
        const clone = el.cloneNode(true);
        clone.dataset.vendorClone = 'true';
        clone.tabIndex = -1;
        clone.setAttribute('aria-hidden', 'true');
        vendors.append(clone);
      });
    }

    // AI Character Marquee & Selection
    const viewport = document.querySelector('.ai-character-grid');
    if (viewport && !viewport.parentElement.classList.contains('ai-marquee')) {
      const frame = document.createElement('div');
      frame.className = 'ai-marquee';
      viewport.before(frame);
      frame.append(viewport);
    }
    viewport?.querySelectorAll('[data-ai-clone]').forEach(e => e.remove());
    const originals = viewport ? [...viewport.children] : [];
    originals.forEach(el => {
      const clone = el.cloneNode(true);
      clone.dataset.aiClone = 'true';
      clone.tabIndex = -1;
      clone.setAttribute('aria-hidden', 'true');
      viewport.append(clone);
    });

    document.querySelectorAll('.ai-character').forEach(button => on(button, 'click', () => {
      document.querySelectorAll('.ai-character').forEach(other => {
        const selected = other === button;
        other.classList.toggle('is-selected', selected);
        other.setAttribute('aria-pressed', String(selected));
      });
      const desc = document.querySelector('#ai-description');
      if (desc) desc.textContent = button.querySelector('strong').textContent + ' · ' + button.dataset.description;
    }));

    let stars = null;
    let idle = null;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    const exitInteraction = () => {
      hero.classList.remove('star-interacting');
      if (interact) {
        interact.setAttribute('aria-pressed', 'false');
        interact.setAttribute('aria-label', '探索星场');
        interact.textContent = '✦ 探索星场';
      }
      if (host) {
        host.removeAttribute('tabindex');
        host.setAttribute('aria-hidden', 'true');
      }
    };

    const unavailable = () => {
      exitInteraction();
      if (interact) interact.hidden = true;
    };

    on(hero, 'starfield-unavailable', unavailable);

    if (interact && host) {
      on(interact, 'click', () => {
        if (!stars) return;
        const active = interact.getAttribute('aria-pressed') !== 'true';
        if (!active) {
          exitInteraction();
          return;
        }
        hero.classList.add('star-interacting');
        interact.setAttribute('aria-pressed', 'true');
        interact.textContent = '✕ 退出星场';
        interact.setAttribute('aria-label', '退出星场');
        host.removeAttribute('aria-hidden');
        host.setAttribute('tabindex', '0');
        host.setAttribute('role', 'application');
        host.setAttribute('aria-label', '拖拽或用方向键旋转星场，Escape 退出');
        host.focus();
      });
      on(host, 'keydown', e => {
        if (e.key === 'Escape') {
          exitInteraction();
          interact.focus();
        }
      });
    }

    // Launch Kali Desktop
    if (open) {
      on(open, 'click', () => {
        exitInteraction();
        if (window.__kaliDesktop) {
          window.__kaliDesktop.openDesktop();
        }
        stars?.pause(true);
      });
    }

    const start = async () => {
      if (signal.aborted || reduced.matches || !host) return;
      try {
        const module = await import('/js/starfield.js');
        if (signal.aborted || reduced.matches) return;
        stars = module.mountStarfield(host, hero, signal);
        if (interact) interact.disabled = false;
      } catch (_) {
        unavailable();
      }
    };

    if (interact) interact.disabled = true;
    if (!reduced.matches) idle = setTimeout(start, 350);
    else unavailable();

    on(reduced, 'change', () => {
      if (reduced.matches) {
        stars?.dispose();
        stars = null;
        host?.replaceChildren();
        unavailable();
      } else {
        if (interact) interact.hidden = false;
        start();
      }
    });

    dispose = () => {
      controller.abort();
      clearTimeout(idle);
      stars?.dispose();
      viewport?.querySelectorAll('[data-ai-clone]').forEach(e => e.remove());
      vendors?.querySelectorAll('[data-vendor-clone]').forEach(e => e.remove());
      if (window.__kaliDesktop) window.__kaliDesktop.exitDesktop();
    };
  }

  document.addEventListener('pjax:send', () => dispose());
  document.addEventListener('pjax:complete', init);
  window.addEventListener('pagehide', () => dispose());
  window.addEventListener('pageshow', e => { if (e.persisted) init(); });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
