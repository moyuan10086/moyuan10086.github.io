/* Cao Zhi's Luoshen Fu, a quiet marginal texture. CSS owns all motion. */
(() => {
  'use strict';
  if (window.__moyuanLuoshen) { window.__moyuanLuoshen.refresh(); return; }
  const passages = [
    '黃初三年余朝京師還濟洛川古人有言斯水之神名曰宓妃感宋玉對楚王神女之事遂作斯賦其辭曰',
    '余從京域言歸東藩背伊闕越轘轅經通谷陵景山日既西傾車殆馬煩爾乃稅駕乎蘅皋秣駟乎芝田',
    '於是精移神駭忽焉思散俯則未察仰以殊觀睹一麗人於巖之畔乃援御者而告之曰爾有覿於彼者乎',
    '其形也翩若驚鴻婉若游龍榮曜秋菊華茂春松髣髴兮若輕雲之蔽月飄颻兮若流風之回雪',
    '遠而望之皎若太陽升朝霞迫而察之灼若芙蕖出淥波穠纖得衷修短合度肩若削成腰如約素',
    '延頸秀項皓質呈露芳澤無加鉛華弗御雲髻峨峨修眉聯娟丹脣外朗皓齒內鮮明眸善睞靨輔承權',
    '瑰姿豔逸儀靜體閑柔情綽態媚於語言奇服曠世骨像應圖披羅衣之璀粲兮珥瑤碧之華琚',
    '踐遠遊之文履曳霧綃之輕裾微幽蘭之芳藹兮步踟躕於山隅於是忽焉縱體以遨以嬉',
    '凌波微步羅襪生塵動無常則若危若安進止難期若往若還轉眄流精光潤玉顏含辭未吐氣若幽蘭',
    '屏翳收風川后靜波馮夷鳴鼓女媧清歌騰文魚以警乘鳴玉鸞以偕逝六龍儼其齊首載雲車之容裔'
  ];
  const root = document.createElement('div');
  root.id = 'luoshen-texture';
  root.hidden = true;
  root.setAttribute('aria-hidden', 'true');
  root.setAttribute('inert', '');
  // Repeatable irregularity: navigation never reshuffles the whole composition.
  const noise = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  function buildColumn(i, sideIndex) {
      const column = document.createElement('div');
      const seed = i + sideIndex * 37 + 1;
      const depth = noise(seed + 4);
      // Reuse a small set of glyph sizes instead of rasterising hundreds of sizes.
      const size = [11, 13, 15, 17, 19][Math.min(4, Math.floor(depth * 5))];
      column.className = `luoshen-column${i % 4 === 1 ? ' luoshen-column--cursive' : ''}`;
      column.style.cssText = `--x:${1 + i * 7 + (noise(seed) - .5) * 3}%;--size:${size}px;--top:${-80 - noise(seed + 2) * 280}px;--duration:${(76 + (1 - depth) * 100 + noise(seed + 3) * 32).toFixed(2)}s;--delay:-${(noise(seed + 8) * 150).toFixed(2)}s;--ink:${(.28 + depth * .30).toFixed(3)};--z:${(-260 + depth * 290).toFixed(1)}px;--tilt:${((noise(seed + 5) - .5) * 5).toFixed(2)}deg;--yaw:${((noise(seed + 6) - .5) * 14).toFixed(2)}deg;`;
      const text = passages[(i + sideIndex * 3) % passages.length] + passages[(i + 4) % passages.length].slice(0, 22);
      const scroll = document.createElement('div');
      scroll.className = 'luoshen-scroll';
      // Identical halves make the downward loop seamless at any viewport height.
      for (let copy = 0; copy < 2; copy++) {
        const run = document.createElement('div');
        run.className = 'luoshen-run';
        for (let j = 0; j < text.length;) {
          const part = seed * 101 + j;
          const length = 3 + Math.floor(noise(part) * 7);
          const fragment = document.createElement('span');
          fragment.className = `luoshen-fragment${noise(part + 1) < .24 ? ' luoshen-fragment--outline' : ''}${noise(part + 2) > .88 ? ' luoshen-fragment--champagne' : ''}`;
          fragment.style.cssText = `--trace:${(.58 + noise(part + 3) * .42).toFixed(3)};--scale:${[.9, 1, 1.1][Math.floor(noise(part + 4) * 3)]};--tracking:${(.04 + noise(part + 5) * .34).toFixed(3)}em;--gap:${(4 + noise(part + 6) ** 3 * 35).toFixed(1)}px;--offset:${Math.round((noise(part + 7) - .5) * 4)}px;--lean:${Math.round((noise(part + 8) - .5) * 2)}deg;`;
          fragment.textContent = text.slice(j, j + length);
          run.appendChild(fragment);
          j += length;
        }
        scroll.appendChild(run);
      }
      column.appendChild(scroll);
      return column;
  }
  const sides = ['left', 'right'].map(side => {
    const field = document.createElement('div');
    field.className = `luoshen-field luoshen-field--${side}`;
    root.appendChild(field);
    return field;
  });
  document.body.appendChild(root);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let timer, layoutFrame = 0, buildFrame = 0;
  const desiredCounts = [0, 0];
  const eligible = () => !document.body.classList.contains('my-landing-only') &&
    !/^\/(?:portfolio|games|music)(?:\/|$)/.test(location.pathname);
  function position(column, index, count) {
    column.hidden = index >= count;
    if (!column.hidden) column.style.setProperty('--x', `${(index + .5) / count * 100 + (noise(index + 1) - .5) * 2}%`);
  }
  function queueBuild() {
    if (buildFrame || root.hidden || document.hidden || typeof requestAnimationFrame !== 'function') return;
    if (!sides.some((field, i) => field.children.length < desiredCounts[i])) return;
    buildFrame = requestAnimationFrame(() => {
      buildFrame = 0;
      if (root.hidden || document.hidden) return;
      // Spread initial text shaping and rasterisation across frames, one lane at a time.
      const sideIndex = sides.findIndex((field, i) => field.children.length < desiredCounts[i]);
      if (sideIndex < 0) return;
      const field = sides[sideIndex], index = field.children.length;
      const column = buildColumn(index, sideIndex);
      position(column, index, desiredCounts[sideIndex]);
      field.appendChild(column);
      queueBuild();
    });
  }
  function layout() {
    const content = document.querySelector('.home-section .section-heading') || document.querySelector('.home-section') || document.querySelector('.about-page') || document.querySelector('#content-inner');
    const rect = content?.getBoundingClientRect();
    // Entire reading column stays clear, even when it is wider or off-centre.
    sides[0].style.width = `${Math.max(0, Math.min(460, (rect?.left ?? 0) - 28))}px`;
    sides[1].style.width = `${Math.max(0, Math.min(460, innerWidth - (rect?.right ?? innerWidth) - 28))}px`;
    // Small desktop margins should hold a few distinct strokes, never 14 overlaps.
    for (const [sideIndex, field] of sides.entries()) {
      const width = parseFloat(field.style.width);
      const count = width < 28 ? 0 : Math.min(14, Math.max(1, Math.floor(width / 20)));
      desiredCounts[sideIndex] = count;
      // Only create columns that can actually be seen; the cover loads no fonts.
      if (typeof requestAnimationFrame !== 'function') {
        while (field.children.length < count) field.appendChild(buildColumn(field.children.length, sideIndex));
      }
      [...field.children].forEach((column, index) => {
        position(column, index, count);
      });
    }
    queueBuild();
  }
  function refresh() {
    root.hidden = !eligible() || motion.matches || innerWidth <= 760;
    if (!root.hidden) {
      let top = 82;
      for (const cover of document.querySelectorAll('#page-header, .home-hero-fullscreen')) {
        const rect = cover.getBoundingClientRect();
        if (rect.width > innerWidth * .8 && rect.height > 100) top = Math.max(top, rect.bottom);
      }
      root.style.top = `${top}px`;
      root.hidden = top >= innerHeight - 32;
    }
    root.classList.toggle('is-paused', root.hidden || document.hidden || !!document.querySelector('[data-spiral-toggle][aria-pressed="true"]'));
    if (!root.hidden) layout();
  }
  function scheduleLayout() {
    if (!layoutFrame) layoutFrame = requestAnimationFrame(() => { layoutFrame = 0; refresh(); });
  }
  function pause() { root.classList.add('is-paused'); }
  document.addEventListener('pjax:send', () => { pause(); root.hidden = true; });
  document.addEventListener('pjax:complete', refresh);
  document.addEventListener('visibilitychange', refresh);
  document.addEventListener('click', e => { if (e.target.closest('[data-spiral-toggle]')) setTimeout(refresh, 0); });
  addEventListener('pageshow', refresh);
  addEventListener('scroll', scheduleLayout, {passive: true});
  addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(refresh, 150); });
  motion.addEventListener('change', refresh);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(scheduleLayout).observe(document.body);
  window.__moyuanLuoshen = { refresh, pause };
  refresh();
})();
