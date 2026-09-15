/* Progressive enhancements; editorial content is build-time HTML. */
(() => {
  'use strict';
  if (window.__moyuanHomeInstalled) return;
  window.__moyuanHomeInstalled = true;
  let dispose = () => {};
  function init() {
    dispose();
    const root = document.querySelector('.home-shell');
    if (!root) return;
    const controller = new AbortController();
    const {signal} = controller;
    const subtitle = root.querySelector('.hero-subtitle');
    let typingTimer;
    if (subtitle && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const phrases = [subtitle.dataset.text, '网络安全 · 密码学 · CTF · AI', '记录 · 探索 · 成长'];
      let phrase = 0, count = phrases[0].length, deleting = true;
      const type = () => {
        if (signal.aborted) return;
        subtitle.classList.add('is-typing');
        count += deleting ? -1 : 1;
        const phraseText=window.MoyuanI18n?window.MoyuanI18n.t(phrases[phrase]):phrases[phrase];
        subtitle.textContent = phraseText.slice(0, Math.max(0,count));
        let delay = deleting ? 45 : 100;
        if (count <= 0) { phrase = (phrase + 1) % phrases.length; deleting = false; delay = 300; }
        if (!deleting && count >= phraseText.length) { deleting = true; delay = 2600; subtitle.classList.remove('is-typing'); }
        typingTimer = setTimeout(type,delay);
      };
      typingTimer = setTimeout(type,2600);
    }
    let request;
    const on = (el, event, fn) => el && el.addEventListener(event, fn, {signal});
    const form = root.querySelector('#history-form');
    const status = root.querySelector('#history-status');
    const events = root.querySelector('#history-events');
    const date = new Date();
    form.elements.month.value = date.getMonth() + 1;
    form.elements.day.value = date.getDate();
    async function history(today) {
      if (request) request.abort();
      request = new AbortController();
      const current = request;
      const timeout = setTimeout(() => current.abort(), 8000);
      form.querySelectorAll('button').forEach(b => b.disabled = true);
      status.textContent = '正在查询历史事件…';
      events.replaceChildren();
      try {
        const suffix = today ? '/today' : '?month=' + form.elements.month.value + '&day=' + form.elements.day.value;
        const response = await fetch('https://uapis.cn/api/v1/history/programmer' + suffix, {signal:current.signal});
        if (!response.ok) throw new Error('History unavailable');
        const result = await response.json();
        const data = result.data || result;
        status.textContent = data.events?.length ? '程序员历史 · ' + (data.date || '') : '这一天暂时没有收录的事件。';
        (data.events || []).slice(0,5).forEach(item => {
          const li = document.createElement('li');
          const title = document.createElement('strong');
          title.textContent = (item.year ? item.year + ' · ' : '') + (item.title || '历史事件');
          const p = document.createElement('p');
          p.textContent = item.description || '';
          li.append(title,p); events.append(li);
        });
      } catch (_) {
        if (!signal.aborted && request === current) status.textContent = '历史事件暂时无法加载，请点击“今天”或“查询”重试。';
      } finally {
        clearTimeout(timeout);
        if (request === current) form.querySelectorAll('button').forEach(b => b.disabled = false);
      }
    }
    const historyDetails = root.querySelector('#history-directory');
    let historyLoaded = false;
    on(historyDetails,'toggle',() => { if (historyDetails.open && !historyLoaded) { historyLoaded = true; history(true); } });
    on(form,'submit', e => { e.preventDefault(); if (form.reportValidity()) history(false); });
    on(root.querySelector('#history-today'),'click',() => history(true));
    const newsDetails = root.querySelector('#news-directory');
    const news = root.querySelector('#daily-news');
    const newsStatus = root.querySelector('#news-status');
    on(news,'load',() => { news.classList.add('is-loaded'); newsStatus.textContent = '今日热点'; });
    on(news,'error',() => { newsStatus.textContent = '今日热点暂时无法加载，稍后重新展开可重试。'; news.removeAttribute('src'); });
    on(newsDetails,'toggle',() => { if (newsDetails.open && !news.hasAttribute('src')) news.src = news.dataset.src; });
    const video = root.querySelector('.home-video');
    const finale = root.querySelector('.motivation-finale');
    const caption = root.querySelector('#motivation-caption');
    const playToggle = root.querySelector('#motivation-play-toggle');
    const audioToggle = root.querySelector('#motivation-audio-toggle');
    const clips = [
      {src:'/videos/motivation-01-web.mp4',text:'我以为这是我经历的最艰难时候，多年以后才发现，这仅仅是开始。'},
      {src:'/videos/motivation-02-web.mp4',text:'不要怕，坚持下去，坚持到最后的胜利。'}
    ];
    let clipIndex = 0;
    let inView = false;
    let userPaused = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    video.volume = .22;
    const play = () => video.play().catch(() => { playToggle.textContent = '播放'; });
    const setClip = index => {
      clipIndex = index;
      video.src = clips[index].src;
      caption.textContent = clips[index].text;
      video.load();
    };
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      inView = entry.isIntersecting;
      if (inView && !video.hasAttribute('src')) setClip(clipIndex);
      if (inView && !userPaused && !reducedMotion) play();
      if (!inView) video.pause();
    }), {threshold:.08});
    observer.observe(finale);
    on(video,'loadeddata',() => { if (inView && !userPaused && !reducedMotion) play(); });
    on(video,'ended',() => setClip((clipIndex + 1) % clips.length));
    on(video,'play',() => { playToggle.textContent = '暂停'; playToggle.setAttribute('aria-label','暂停视频'); });
    on(video,'pause',() => { playToggle.textContent = '播放'; playToggle.setAttribute('aria-label','播放视频'); });
    on(playToggle,'click',() => { userPaused = !video.paused; if (userPaused) video.pause(); else play(); });
    on(audioToggle,'click',() => {
      video.muted = !video.muted;
      audioToggle.textContent = video.muted ? '开启声音' : '关闭声音';
      audioToggle.setAttribute('aria-pressed',String(!video.muted));
      audioToggle.setAttribute('aria-label',video.muted ? '开启视频声音' : '关闭视频声音');
    });
    on(video,'error',() => { root.querySelector('.video-status').textContent = '短片暂时无法播放，请稍后重试。'; });
    on(document,'visibilitychange',() => { if (document.hidden) video.pause(); });
    dispose = () => { controller.abort(); clearTimeout(typingTimer); request?.abort(); observer.disconnect(); video.pause(); };
  }
  document.addEventListener('pjax:send', () => dispose());
  document.addEventListener('pjax:complete', init);
  window.addEventListener('pagehide', () => dispose());
  window.addEventListener('pageshow', e => { if (e.persisted) init(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
