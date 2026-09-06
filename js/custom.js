(function () {
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function ensureStatusbar() {
    if (document.getElementById('blog-statusbar')) return;

    var bar = document.createElement('div');
    bar.id = 'blog-statusbar';
    bar.innerHTML = [
      '<span id="sb-weather">天气加载中...</span>',
      '<span class="sb-sep">·</span>',
      '<span id="sb-github">GitHub</span>',
      '<span class="sb-sep">·</span>',
      '<span id="sb-time"></span>'
    ].join('');
    document.body.prepend(bar);
  }

  function ensureQuoteWidget() {
    if (document.getElementById('daily-quote-widget')) return;

    var html = [
      '<div id="daily-quote-widget">',
      '  <div class="dq-inner">',
      '    <div class="dq-text">',
      '      <p id="dq-content" class="dq-quote">获取中...</p>',
      '      <span id="dq-author" class="dq-author"></span>',
      '    </div>',
      '    <button id="dq-close" class="dq-close" type="button" aria-label="关闭">×</button>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function tick() {
    setText('sb-time', new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
  }

  function fetchWithTimeout(url, timeout) {
    var controller = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, timeout || 3000);

    return fetch(url, controller ? { signal: controller.signal } : {})
      .finally(function () {
        clearTimeout(timer);
      });
  }

  function loadWeather() {
    if (window.__blogWeatherLoaded) return;
    window.__blogWeatherLoaded = true;

    var weatherNames = {
      0: '晴',
      1: '少云',
      2: '多云',
      3: '阴',
      45: '雾',
      51: '小雨',
      61: '雨',
      80: '阵雨',
      95: '雷雨'
    };

    fetchWithTimeout('https://api.open-meteo.com/v1/forecast?latitude=23.13&longitude=113.26&current=temperature_2m,weather_code&timezone=Asia/Shanghai', 3000)
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('weather failed')); })
      .then(function (data) {
        var current = data.current || {};
        var weather = weatherNames[current.weather_code] || '天气';
        var temp = Number.isFinite(current.temperature_2m) ? Math.round(current.temperature_2m) + '°C' : '--°C';
        setText('sb-weather', weather + ' ' + temp + ' 广州');
      })
      .catch(function () {
        setText('sb-weather', '广州天气');
        window.__blogWeatherLoaded = false;
      });
  }

  function loadGithub() {
    if (window.__blogGithubLoaded) return;
    window.__blogGithubLoaded = true;

    fetchWithTimeout('https://api.github.com/users/moyuan10086/repos?per_page=100', 3500)
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('github failed')); })
      .then(function (repos) {
        var stars = repos.reduce(function (sum, repo) {
          return sum + (repo.stargazers_count || 0);
        }, 0);
        setText('sb-github', repos.length + ' repos · ' + stars + ' stars');
      })
      .catch(function () {
        setText('sb-github', 'GitHub');
        window.__blogGithubLoaded = false;
      });
  }

  var fallbackQuotes = [
    { content: '不积跬步，无以至千里。', author: '荀子' },
    { content: '凡是过往，皆为序章。', author: '莎士比亚' },
    { content: '知不足而奋进，望远山而前行。', author: '佚名' },
    { content: '人心谁也无法预测，随心所欲的行动难以预料，运是随着自己的作为而产生。', author: '佚名' }
  ];

  function setQuote(content, author) {
    setText('dq-content', '“' + content + '”');
    setText('dq-author', '—— ' + (author || '佚名'));
  }

  function setFallbackQuote() {
    var quote = fallbackQuotes[new Date().getDate() % fallbackQuotes.length];
    setQuote(quote.content, quote.author);
  }

  function loadPoemQuote() {
    return fetchWithTimeout('https://v2.jinrishici.com/one.json', 2800)
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('poem failed')); })
      .then(function (data) {
        var content = data && data.data && data.data.content;
        if (!content) throw new Error('poem missing');
        var origin = data.data.origin || {};
        setQuote(content, origin.author || origin.dynasty || '今日诗词');
      });
  }

  function normalizeHitokoto(data) {
    if (!data) throw new Error('quote missing');

    if (data.hitokoto) {
      var from = data.from || '佚名';
      var author = data.from_who ? data.from_who + ' · ' + from : from;
      return { content: data.hitokoto, author: author };
    }

    if (data.text) {
      return { content: data.text, author: data.source || data.author || '一言' };
    }

    throw new Error('quote missing');
  }

  function fetchHitokotoFrom(url) {
    return fetchWithTimeout(url, 2800)
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('quote failed')); })
      .then(normalizeHitokoto);
  }

  function loadHitokotoQuoteData() {
    var urls = [
      'https://v1.hitokoto.cn/?c=d&c=i&c=k&encode=json',
      'https://international.v1.hitokoto.cn/?c=d&c=i&c=k&encode=json',
      'https://uapis.cn/api/v1/saying'
    ];

    return urls.reduce(function (promise, url) {
      return promise.catch(function () {
        return fetchHitokotoFrom(url);
      });
    }, Promise.reject(new Error('start quote chain')));
  }

  function loadHitokotoQuote() {
    return loadHitokotoQuoteData().then(function (quote) {
      setQuote(quote.content, quote.author);
    });
  }

  function bindQuoteActions() {
    var quote = document.getElementById('dq-content');
    if (quote) {
      quote.onclick = function () {
        if (window.confetti) {
          window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.8 } });
        }
      };
    }

    var close = document.getElementById('dq-close');
    if (close) {
      close.onclick = function () {
        var widget = document.getElementById('daily-quote-widget');
        if (widget) widget.style.display = 'none';
      };
    }
  }

  function loadQuote() {
    var quote = document.getElementById('dq-content');
    if (quote && (!quote.textContent || quote.textContent === '获取中...')) {
      setFallbackQuote();
    }

    if (window.__dailyQuoteLoading) return;
    window.__dailyQuoteLoading = true;

    loadHitokotoQuote()
      .catch(loadPoemQuote)
      .catch(setFallbackQuote)
      .finally(function () {
        window.__dailyQuoteLoading = false;
      });
  }

  function initBlogWidgets() {
    ensureStatusbar();
    ensureQuoteWidget();

    if (!window.__blogClockStarted) {
      window.__blogClockStarted = true;
      setInterval(tick, 1000);
    }

    tick();
    loadWeather();
    loadGithub();
    loadQuote();
    bindQuoteActions();
  }

  function initPostTitleTyping() {
    if (window.__postTitleTypingReady) return;
    var title = document.querySelector('#post-info .post-title');
    if (!title) return;
    window.__postTitleTypingReady = true;

    var text = title.textContent.trim();
    if (!text) return;

    title.dataset.text = text;
    title.classList.remove('is-done');
    title.classList.add('is-typing');
    title.textContent = text.slice(0, 1);

    var index = 1;
    var timer = 0;
    function tick() {
      index += 1;
      title.textContent = text.slice(0, index);
      if (index < text.length) {
        timer = window.setTimeout(tick, 60);
        return;
      }
      timer = 0;
      title.classList.remove('is-typing');
      title.classList.add('is-done');
    }
    timer = window.setTimeout(tick, 200);
  }

  window.initBlogWidgets = initBlogWidgets;
  initBlogWidgets();
  initPostTitleTyping();
  document.addEventListener('pjax:complete', function () {
    initBlogWidgets();
    window.__postTitleTypingReady = false;
    window.setTimeout(initPostTitleTyping, 50);
  });
  document.addEventListener('pjax:success', initBlogWidgets);
  window.addEventListener('pageshow', initBlogWidgets);
})();
