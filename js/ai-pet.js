(function () {
  'use strict';

  var SKINS = [
    { id: 'deepseek', name: '鲸鱼娘', img: '/images/ai-girls/crosspet/deepseek-eat.webp', reactImg: '/images/ai-girls/crosspet/deepseek-oops.webp', mode: 'cutout', lines: [
      'Let me go~ I\'m making the calls~ Let me write the JSON~',
      '谁说我是蓝色大肥鱼的！吃了大白饭就能变 Pro！',
      '正在帮你巡逻检查有没有 SQL 注入…',
      '今天也在认真写代码吗？别忘了多喝水~',
      '检测到墨鵷来访，好感度 +1！'
    ]},
    { id: 'claude', name: 'Claude 大小姐', img: '/images/ai-girls/crosspet/claude-sorry.webp', reactImg: '/images/ai-girls/crosspet/claude-proud.webp', mode: 'cutout', lines: [
      '边界条件和异常处理都检查过了吗？',
      '长文档慢慢看，我帮你把关键证据标出来。',
      '（微笑）代码写得这么工整，可以给你加分哦~'
    ]},
    { id: 'gpt', name: '白龙娘 GPT', img: '/images/ai-girls/crosspet/gpt-greet.webp', reactImg: '/images/ai-girls/crosspet/gpt-proud.webp', mode: 'cutout', lines: [
      '早安！今天要一起拆解什么新想法？',
      '工具调用与插件生态随时待命~',
      '白龙娘来给你加油打气啦！'
    ]},
    { id: 'gemini', name: 'Gemini 猫娘', img: '/images/ai-girls/crosspet/gemini-thinking.webp', reactImg: '/images/ai-girls/crosspet/gemini-drawing.webp', mode: 'cutout', lines: [
      '图片、音频还是长视频，统统交给我处理喵~',
      '百万级上下文展开中，别想藏住任何细节！',
      '喵呜~ 正在帮你整理多模态灵感板！'
    ]},
    { id: 'glm', name: 'GLM 黑狐娘', img: '/images/ai-girls/crosspet/glm-chibi.webp', mode: 'cutout', lines: [
      '背景、约束和验收条件明确后，效率立刻翻倍~',
      '黑狐执事正在翻阅智谱文档库…',
      '需要 Agent 帮你自动跑一轮流程吗？'
    ]},
    { id: 'kimi', name: 'Kimi 月影娘', img: '/images/ai-girls/crosspet/kimi-chibi.webp', mode: 'cutout', lines: [
      '长文精读交给我，每一条结论都给你标好出处~',
      '月光下的长笛声，能让写代码更专注哦！',
      '正在整理参考资料与关键引用…'
    ]}
  ];

  var STORAGE_KEY = 'moyuan_ai_pet_v3';
  var dock = null;
  var bubbleTimer = 0;
  var reactTimer = 0;

  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        skinIdx: typeof raw.skinIdx === 'number' ? raw.skinIdx % SKINS.length : 0,
        affection: typeof raw.affection === 'number' ? raw.affection : 10,
        collapsed: Boolean(raw.collapsed)
      };
    } catch (e) {
      return { skinIdx: 0, affection: 10, collapsed: false };
    }
  }

  function saveState(st) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); } catch (e) {}
  }

  function shouldHideRoute() {
    var p = window.location.pathname || '/';
    return p === '/' || p === '/index.html' || p.indexOf('/score') === 0 || p.indexOf('/portfolio') === 0 || Boolean(document.getElementById('intro'));
  }

  function mount() {
    if (dock && document.body.contains(dock)) {
      dock.classList.toggle('is-hidden-route', shouldHideRoute());
      return;
    }

    var st = loadState();
    dock = document.createElement('aside');
    dock.className = 'ai-pet-dock' + (st.collapsed ? ' is-collapsed' : '') + (shouldHideRoute() ? ' is-hidden-route' : '');
    dock.setAttribute('aria-label', 'AI 桌面陪伴宠物');
    dock.innerHTML = [
      '<div class="ai-pet-bubble" id="ai-pet-bubble" role="status"></div>',
      '<div class="ai-pet-body">',
      '  <button type="button" class="ai-pet-sprite-btn" id="ai-pet-sprite-btn" title="点击摸头互动">',
      '    <img class="ai-pet-figure" id="ai-pet-figure" alt="AI 桌宠">',
      '    <div class="ai-pet-sprite" id="ai-pet-sprite" hidden></div>',
      '  </button>',
      '  <div class="ai-pet-bar">',
      '    <button type="button" class="ai-pet-action" id="ai-pet-feed" title="投喂小鱼干">🐟 喂鱼干</button>',
      '    <button type="button" class="ai-pet-action" id="ai-pet-skin" title="切换角色皮肤">✨ 换肤</button>',
      '    <span class="ai-pet-affection" id="ai-pet-affection" title="好感度">♥ ' + st.affection + '</span>',
      '    <button type="button" class="ai-pet-action" id="ai-pet-hide" title="收纳到角落">−</button>',
      '  </div>',
      '</div>',
      '<button type="button" class="ai-pet-pill" id="ai-pet-expand" title="呼出 AI 桌宠">🐳 <span id="ai-pet-pill-name"></span></button>'
    ].join('');

    document.body.appendChild(dock);

    var elBubble = dock.querySelector('#ai-pet-bubble');
    var elSpriteBtn = dock.querySelector('#ai-pet-sprite-btn');
    var elFigure = dock.querySelector('#ai-pet-figure');
    var elSprite = dock.querySelector('#ai-pet-sprite');
    var elFeed = dock.querySelector('#ai-pet-feed');
    var elSkin = dock.querySelector('#ai-pet-skin');
    var elAff = dock.querySelector('#ai-pet-affection');
    var elHide = dock.querySelector('#ai-pet-hide');
    var elExpand = dock.querySelector('#ai-pet-expand');
    var elPillName = dock.querySelector('#ai-pet-pill-name');

    function currentSkin() { return SKINS[st.skinIdx] || SKINS[0]; }

    function applySkin() {
      var skin = currentSkin();
      elFigure.src = skin.img;
      elFigure.hidden = false;
      elSprite.hidden = true;
      elPillName.textContent = skin.name;
      elAff.textContent = '♥ ' + st.affection;
    }

    function say(msg) {
      elBubble.textContent = msg;
      elBubble.classList.add('is-show');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function () { elBubble.classList.remove('is-show'); }, 3600);
    }

    function popEmoji(emoji) {
      var span = document.createElement('span');
      span.className = 'ai-pet-float';
      span.textContent = emoji;
      elSpriteBtn.appendChild(span);
      setTimeout(function () { span.remove(); }, 950);
    }

    function hop(kind) {
      var skin = currentSkin();
      var pool = (kind === 2 && skin.feedImgs) ? skin.feedImgs
        : (skin.reactImgs ? skin.reactImgs : (skin.reactImg ? [skin.reactImg] : null));
      if (pool && pool.length) {
        var nextImg = pool[Math.floor(Math.random() * pool.length)];
        elFigure.src = nextImg;
        clearTimeout(reactTimer);
        reactTimer = setTimeout(function () {
          if (currentSkin().id === skin.id) elFigure.src = skin.img;
        }, skin.reactMs || 1500);
      }
      elSpriteBtn.classList.remove('is-happy');
      void elSpriteBtn.offsetWidth;
      elSpriteBtn.classList.add('is-happy');
    }

    // Subtle 2.5D pointer tilt so the transparent cutout feels alive & dimensional
    elSpriteBtn.addEventListener('pointermove', function (e) {
      var r = elSpriteBtn.getBoundingClientRect();
      var nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      var ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      elSpriteBtn.style.transform = 'rotateY(' + (nx * 14).toFixed(1) + 'deg) rotateX(' + (-ny * 10).toFixed(1) + 'deg) translateY(-3px)';
    });
    elSpriteBtn.addEventListener('pointerleave', function () {
      elSpriteBtn.style.transform = '';
    });

    elSpriteBtn.addEventListener('click', function () {
      st.affection += 1;
      saveState(st);
      elAff.textContent = '♥ ' + st.affection;
      var lines = currentSkin().lines;
      say(lines[Math.floor(Math.random() * lines.length)]);
      popEmoji('♥');
      hop(1);
    });

    elFeed.addEventListener('click', function () {
      st.affection += 3;
      saveState(st);
      elAff.textContent = '♥ ' + st.affection;
      say(currentSkin().name + ' 开心吃掉了小鱼干！好感度 +3~');
      popEmoji('🐟');
      hop(2);
    });

    elSkin.addEventListener('click', function () {
      st.skinIdx = (st.skinIdx + 1) % SKINS.length;
      saveState(st);
      applySkin();
      say('已切换为「' + currentSkin().name + '」陪你浏览！');
      hop(1);
    });

    elHide.addEventListener('click', function () {
      st.collapsed = true;
      saveState(st);
      dock.classList.add('is-collapsed');
    });

    elExpand.addEventListener('click', function () {
      st.collapsed = false;
      saveState(st);
      dock.classList.remove('is-collapsed');
      say(currentSkin().name + ' 回来啦~');
    });

    applySkin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
  document.addEventListener('pjax:complete', mount);
})();
