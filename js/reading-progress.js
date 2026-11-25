(function () {
  'use strict';

  var bar = null;
  var rafId = 0;

  function ensureBar() {
    if (bar && document.body.contains(bar)) return bar;
    var existing = document.getElementById('reading-progress-bar');
    if (existing) {
      bar = existing;
      return bar;
    }
    var wrap = document.createElement('div');
    wrap.id = 'reading-progress-bar';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<i></i>';
    document.body.appendChild(wrap);
    bar = wrap;
    return bar;
  }

  function isPostPage() {
    return Boolean(document.getElementById('post') && document.getElementById('article-container') && !document.getElementById('intro'));
  }

  function update() {
    rafId = 0;
    var el = ensureBar();
    if (!isPostPage()) {
      el.classList.remove('is-visible');
      return;
    }
    var article = document.getElementById('article-container');
    var rect = article.getBoundingClientRect();
    var articleTop = rect.top + window.scrollY;
    var total = Math.max(1, article.offsetHeight - window.innerHeight * 0.7);
    var ratio = Math.max(0, Math.min(1, (window.scrollY - articleTop + window.innerHeight * 0.15) / total));
    el.classList.toggle('is-visible', window.scrollY > 40);
    var fill = el.firstElementChild;
    if (fill) fill.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
  }

  function schedule() {
    if (!rafId) rafId = window.requestAnimationFrame(update);
  }

  function init() {
    ensureBar();
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('pjax:complete', init);
})();

