(function () {
  'use strict';

  var stage = document.getElementById('hw-stage');
  var canvas = document.getElementById('hw-canvas');
  var audioEl = document.getElementById('hw-audio');
  if (!stage || !canvas || !audioEl) return;

  var ctx = canvas.getContext('2d');
  var elIndex = document.getElementById('hw-index');
  var elCenter = document.getElementById('hw-center');
  var elEn = document.getElementById('hw-en');
  var elZh = document.getElementById('hw-zh');
  var elGreeting = document.getElementById('hw-greeting');
  var elNum = document.getElementById('hw-num');
  var elLine = document.getElementById('hw-line');
  var elPlayBtn = document.getElementById('hw-play-btn');
  var elPrevBtn = document.getElementById('hw-prev-btn');
  var elNextBtn = document.getElementById('hw-next-btn');
  var elProgress = document.getElementById('hw-progress');
  var elProgressFill = document.getElementById('hw-progress-fill');
  var elProgressThumb = document.getElementById('hw-progress-thumb');
  var elTimeCur = document.getElementById('hw-time-cur');
  var elTimeTot = document.getElementById('hw-time-tot');
  var elVoiceBtn = document.getElementById('hw-voice-btn');
  var elMp3Btn = document.getElementById('hw-mp3-btn');
  var elMp3Input = document.getElementById('hw-mp3-input');

  // Official QQ Music LRC stops & exact timestamps for "Hello in other countries - Prof. Belva Dorton" (00:46)
  var STOPS = [
    { t: 0.67, en: 'USA', zh: '美国', greet: 'Hello!', line: 'In the USA, we say “Hello!”', lat: 38.9, lon: -98.0, lang: 'en-US', speak: 'Hello' },
    { t: 3.35, en: 'France', zh: '法国', greet: 'Bonjour!', line: 'In France, we say “Bonjour!”', lat: 46.6, lon: 2.3, lang: 'fr-FR', speak: 'Bonjour' },
    { t: 5.69, en: 'Japan', zh: '日本', greet: 'Konnichiwa!', line: 'In Japan, we say “Konnichiwa!”', lat: 35.7, lon: 139.7, lang: 'ja-JP', speak: 'こんにちは' },
    { t: 8.26, en: 'Germany', zh: '德国', greet: 'Hallo!', line: 'In Germany, we say “Hallo!”', lat: 51.2, lon: 10.4, lang: 'de-DE', speak: 'Hallo' },
    { t: 10.90, en: 'Thailand', zh: '泰国', greet: 'Sawasdee!', line: 'In Thailand, we say “Sawasdee!”', lat: 13.8, lon: 100.5, lang: 'th-TH', speak: 'สวัสดี' },
    { t: 13.27, en: 'Brazil', zh: '巴西', greet: 'Olá!', line: 'In Brazil, we say “Olá!”', lat: -14.2, lon: -51.9, lang: 'pt-BR', speak: 'Olá' },
    { t: 15.85, en: 'China', zh: '中国', greet: 'Nǐ hǎo!', line: 'In China, we say “Nǐ hǎo!”', lat: 35.0, lon: 104.0, lang: 'zh-CN', speak: '你好' },
    { t: 18.68, en: 'Italy', zh: '意大利', greet: 'Ciao!', line: 'In Italy, we say “Ciao!”', lat: 41.9, lon: 12.5, lang: 'it-IT', speak: 'Ciao' },
    { t: 20.96, en: 'India', zh: '印度', greet: 'Namaste!', line: 'In India, we say “Namaste!”', lat: 21.1, lon: 78.9, lang: 'hi-IN', speak: 'नमस्ते' },
    { t: 23.64, en: 'Vietnam', zh: '越南', greet: 'Xin chào!', line: 'In Vietnam, we say “Xin chào!”', lat: 21.0, lon: 105.8, lang: 'vi-VN', speak: 'Xin chào' },
    { t: 26.23, en: 'Spain', zh: '西班牙', greet: '¡Hola!', line: 'In Spain, we say “¡Hola!”', lat: 40.4, lon: -3.7, lang: 'es-ES', speak: 'Hola' },
    { t: 28.51, en: 'South Korea', zh: '韩国', greet: 'Annyeong!', line: 'In South Korea, we say “Annyeong!”', lat: 37.5, lon: 127.0, lang: 'ko-KR', speak: '안녕' },
    { t: 31.14, en: 'Russia', zh: '俄罗斯', greet: 'Privet!', line: 'In Russia, we say “Privet!”', lat: 55.8, lon: 37.6, lang: 'ru-RU', speak: 'Привет' },
    { t: 33.57, en: 'Indonesia', zh: '印度尼西亚', greet: 'Halo!', line: 'In Indonesia, we say “Halo!”', lat: -6.2, lon: 106.8, lang: 'id-ID', speak: 'Halo' },
    { t: 36.20, en: 'Greece', zh: '希腊', greet: 'Yassas!', line: 'In Greece, we say “Yassas!”', lat: 38.0, lon: 23.7, lang: 'el-GR', speak: 'Γεια σας' },
    { t: 38.74, en: 'Mexico', zh: '墨西哥', greet: '¡Hola!', line: 'In Mexico, we say “¡Hola!”', lat: 19.4, lon: -99.1, lang: 'es-MX', speak: 'Hola' }
  ];

  var CONTINENTS = [
    [[-168,66],[-140,70],[-125,70],[-95,70],[-80,63],[-64,60],[-55,50],[-67,44],[-75,35],[-81,25],[-84,30],[-97,26],[-97,18],[-87,21],[-83,10],[-78,8],[-85,11],[-95,16],[-105,20],[-112,30],[-117,32],[-124,41],[-125,49],[-135,58],[-152,60],[-165,61]],
    [[-52,60],[-42,60],[-22,70],[-18,80],[-45,83],[-62,76],[-54,67]],
    [[-78,9],[-70,12],[-60,8],[-50,0],[-35,-6],[-38,-15],[-42,-23],[-52,-33],[-65,-42],[-68,-54],[-74,-50],[-72,-35],[-71,-18],[-81,-5],[-79,2]],
    [[-9,37],[-9,43],[-2,44],[-5,48],[2,51],[8,54],[10,58],[5,62],[18,69],[30,70],[40,66],[48,55],[40,47],[30,46],[24,38],[16,40],[12,44],[5,43],[-2,36]],
    [[-6,50],[1,51],[0,55],[-5,58],[-8,54]],
    [[-17,15],[-12,28],[-5,36],[10,37],[25,32],[33,31],[43,12],[51,11],[41,-2],[40,-15],[33,-26],[20,-35],[15,-28],[12,-12],[9,4],[-8,5],[-16,12]],
    [[44,-25],[47,-25],[50,-14],[47,-13],[44,-20]],
    [[27,41],[38,42],[48,47],[60,55],[68,70],[95,75],[125,73],[155,68],[175,65],[162,56],[142,54],[136,44],[129,35],[121,39],[122,31],[116,22],[108,20],[109,12],[102,10],[100,14],[96,17],[90,22],[80,8],[72,21],[62,25],[56,26],[48,30],[50,24],[58,22],[44,13],[35,29],[35,36]],
    [[130,31],[136,34],[141,36],[145,44],[140,42],[136,37],[131,34]],
    [[96,5],[105,-6],[115,-8],[125,-8],[118,-2],[105,0]],
    [[114,-22],[122,-17],[130,-12],[136,-12],[142,-11],[146,-19],[153,-26],[150,-37],[140,-38],[132,-32],[122,-34],[115,-34],[113,-26]],
    [[167,-46],[172,-43],[178,-37],[174,-35],[172,-41],[168,-45]]
  ];

  var TOTAL_DURATION = 46.0;

  function stopIndexAt(t) {
    var idx = 0;
    for (var i = 0; i < STOPS.length; i++) {
      if (t >= STOPS[i].t) idx = i;
      else break;
    }
    return idx;
  }
  var mapCache = document.createElement('canvas');
  var mapCtx = mapCache.getContext('2d');

  var state = {
    w: 1, h: 1, dpr: 1,
    playing: false, time: 0, duration: TOTAL_DURATION,
    activeIdx: 0, useMp3: true, voiceOn: false,
    lastFrame: 0, audioCtx: null, lastStepBeat: -1, spokenIdx: -1
  };

  function lonLatToXY(lon, lat) {
    var padX = state.w * 0.04;
    var mapW = state.w - padX * 2;
    var mapTop = state.h * 0.08;
    var mapH = state.h * 0.68;
    return {
      x: padX + ((lon + 180) / 360) * mapW,
      y: mapTop + ((82 - lat) / 140) * mapH
    };
  }

  function buildDottedMap() {
    mapCache.width = Math.max(1, Math.round(state.w * state.dpr));
    mapCache.height = Math.max(1, Math.round(state.h * state.dpr));
    mapCtx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    mapCtx.clearRect(0, 0, state.w, state.h);

    var mask = document.createElement('canvas');
    var mw = Math.max(1, Math.round(state.w));
    var mh = Math.max(1, Math.round(state.h));
    mask.width = mw;
    mask.height = mh;
    var mctx = mask.getContext('2d');
    mctx.fillStyle = '#ffffff';
    CONTINENTS.forEach(function (poly) {
      mctx.beginPath();
      poly.forEach(function (pt, i) {
        var p = lonLatToXY(pt[0], pt[1]);
        if (i === 0) mctx.moveTo(p.x, p.y);
        else mctx.lineTo(p.x, p.y);
      });
      mctx.closePath();
      mctx.fill();
    });

    var img = mctx.getImageData(0, 0, mw, mh).data;
    var step = state.w < 700 ? 6 : 7;
    mapCtx.fillStyle = 'rgba(148, 175, 224, 0.34)';
    for (var y = Math.round(state.h * 0.06); y < Math.round(state.h * 0.78); y += step) {
      for (var x = Math.round(state.w * 0.03); x < Math.round(state.w * 0.97); x += step) {
        if (img[(y * mw + x) * 4 + 3] > 128) {
          mapCtx.beginPath();
          mapCtx.arc(x, y, 1.35, 0, Math.PI * 2);
          mapCtx.fill();
        }
      }
    }
  }

  var MELODY = [261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 329.63, 293.66];
  function playChimeNote(stepIdx) {
    if (state.useMp3) return;
    if (!state.audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) state.audioCtx = new AC();
    }
    if (!state.audioCtx) return;
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume().catch(function () {});
    var now = state.audioCtx.currentTime;
    var freq = MELODY[stepIdx % MELODY.length] * (stepIdx % 16 >= 8 ? 1.122 : 1);
    var osc = state.audioCtx.createOscillator();
    var gain = state.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  function speakGreeting(stop) {
    if (!state.voiceOn || state.useMp3 || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(stop.speak);
      u.lang = stop.lang;
      u.rate = 0.96;
      u.volume = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  function updateStopUI(idx, shouldSpeak) {
    var stop = STOPS[idx] || STOPS[0];
    var numStr = String(idx + 1).padStart(2, '0');
    elIndex.textContent = numStr;
    elEn.textContent = stop.en;
    elZh.textContent = stop.zh;
    elGreeting.textContent = stop.greet;
    elNum.textContent = numStr;
    elLine.textContent = stop.line;
    elCenter.classList.remove('is-pop');
    void elCenter.offsetWidth;
    elCenter.classList.add('is-pop');
    setTimeout(function () { elCenter.classList.remove('is-pop'); }, 260);
    if (shouldSpeak) speakGreeting(stop);
  }

  function updateProgressUI() {
    var ratio = state.duration > 0 ? Math.max(0, Math.min(1, state.time / state.duration)) : 0;
    var pct = (ratio * 100).toFixed(2) + '%';
    elProgressFill.style.width = pct;
    elProgressThumb.style.left = pct;
    elProgress.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    elTimeCur.textContent = formatTime(state.time);
    elTimeTot.textContent = formatTime(state.duration);
  }

  function drawFlightArc(p0, p1, progress, isActive) {
    var mx = (p0.x + p1.x) * 0.5;
    var dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    var my = Math.min(p0.y, p1.y) - Math.min(145, Math.max(36, dist * 0.28));

    ctx.save();
    ctx.beginPath();
    var steps = 32;
    var maxStep = Math.max(1, Math.floor(steps * progress));
    var head = p0;
    for (var i = 0; i <= maxStep; i++) {
      var t = i / steps;
      if (t > progress) t = progress;
      var inv = 1 - t;
      var x = inv * inv * p0.x + 2 * inv * t * mx + t * t * p1.x;
      var y = inv * inv * p0.y + 2 * inv * t * my + t * t * p1.y;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      head = { x: x, y: y };
    }
    ctx.strokeStyle = isActive ? 'rgba(147, 197, 253, 0.92)' : 'rgba(96, 165, 250, 0.36)';
    ctx.lineWidth = isActive ? 2.2 : 1.25;
    if (isActive) {
      ctx.shadowColor = 'rgba(96, 165, 250, 0.9)';
      ctx.shadowBlur = 12;
    }
    ctx.stroke();

    if (isActive && progress < 0.98) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(head.x, head.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function render(now) {
    requestAnimationFrame(render);
    var dt = state.lastFrame ? Math.min(0.05, (now - state.lastFrame) / 1000) : 0.016;
    state.lastFrame = now;
    var segDur = state.duration / STOPS.length;

    if (state.playing) {
      if (state.useMp3) {
        state.time = audioEl.currentTime || 0;
        if (audioEl.ended) togglePlay(false);
      } else {
        state.time += dt;
        if (state.time >= state.duration) {
          state.time = 0;
          state.lastStepBeat = -1;
          state.spokenIdx = -1;
        }
        var beatIdx = Math.floor(state.time * 2.1);
        if (beatIdx !== state.lastStepBeat) {
          state.lastStepBeat = beatIdx;
          playChimeNote(beatIdx);
        }
      }
      var newIdx = stopIndexAt(state.time);
      if (newIdx !== state.activeIdx) {
        state.activeIdx = newIdx;
        updateStopUI(newIdx, true);
      }
      updateProgressUI();
    }

    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, state.w, state.h);
    ctx.drawImage(mapCache, 0, 0, state.w, state.h);

    var curStart = STOPS[state.activeIdx].t;
    var nextStart = STOPS[state.activeIdx + 1] ? STOPS[state.activeIdx + 1].t : state.duration;
    var segProgress = Math.min(1, ((state.time - curStart) / Math.max(0.5, nextStart - curStart)) * 1.55);
    var pts = STOPS.map(function (s) { return lonLatToXY(s.lon, s.lat); });

    for (var i = 1; i <= state.activeIdx; i++) {
      var isLatest = i === state.activeIdx;
      drawFlightArc(pts[i - 1], pts[i], isLatest ? Math.max(0.05, segProgress) : 1, isLatest);
    }

    for (var j = 0; j <= state.activeIdx; j++) {
      var p = pts[j];
      ctx.save();
      ctx.fillStyle = j === state.activeIdx ? '#ffffff' : 'rgba(147, 197, 253, 0.85)';
      ctx.shadowColor = 'rgba(96, 165, 250, 0.9)';
      ctx.shadowBlur = j === state.activeIdx ? 16 : 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, j === state.activeIdx ? 4.5 : 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    var curPt = pts[state.activeIdx];
    var pulse = (now * 0.0012) % 1;
    ctx.save();
    var rg = ctx.createRadialGradient(curPt.x, curPt.y, 2, curPt.x, curPt.y, 44);
    rg.addColorStop(0, 'rgba(147, 197, 253, 0.55)');
    rg.addColorStop(0.5, 'rgba(59, 130, 246, 0.18)');
    rg.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(curPt.x, curPt.y, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(147, 197, 253, ' + (1 - pulse).toFixed(3) + ')';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(curPt.x, curPt.y, 8 + pulse * 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function togglePlay(forceState) {
    var next = typeof forceState === 'boolean' ? forceState : !state.playing;
    state.playing = next;
    elPlayBtn.innerHTML = next ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    if (state.useMp3) {
      if (next) audioEl.play().catch(function () {});
      else audioEl.pause();
    } else if (next && state.spokenIdx !== state.activeIdx) {
      state.spokenIdx = state.activeIdx;
      speakGreeting(STOPS[state.activeIdx]);
    }
  }

  function jumpToStop(idx) {
    idx = (idx + STOPS.length) % STOPS.length;
    state.activeIdx = idx;
    state.time = STOPS[idx].t + 0.02;
    if (state.useMp3) audioEl.currentTime = state.time;
    updateStopUI(idx, state.playing);
    updateProgressUI();
  }

  function resize() {
    state.w = Math.max(1, stage.clientWidth);
    state.h = Math.max(1, stage.clientHeight);
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(state.w * state.dpr);
    canvas.height = Math.round(state.h * state.dpr);
    buildDottedMap();
  }

  elPlayBtn.addEventListener('click', function () { togglePlay(); });
  canvas.addEventListener('click', function () { togglePlay(); });
  elPrevBtn.addEventListener('click', function () { jumpToStop(state.activeIdx - 1); });
  elNextBtn.addEventListener('click', function () { jumpToStop(state.activeIdx + 1); });
  if (elVoiceBtn) {
    elVoiceBtn.addEventListener('click', function () {
      state.voiceOn = !state.voiceOn;
      elVoiceBtn.classList.toggle('is-on', state.voiceOn);
      elVoiceBtn.setAttribute('aria-pressed', String(state.voiceOn));
    });
  }
  audioEl.addEventListener('loadedmetadata', function () {
    if (Number.isFinite(audioEl.duration) && audioEl.duration > 5) {
      state.duration = audioEl.duration;
      updateProgressUI();
    }
  });
  elMp3Btn.addEventListener('click', function () { elMp3Input.click(); });
  elMp3Input.addEventListener('change', function () {
    var file = elMp3Input.files && elMp3Input.files[0];
    if (!file) return;
    audioEl.src = URL.createObjectURL(file);
    state.useMp3 = true;
    elMp3Btn.textContent = '已导入原曲 ✓';
    elMp3Btn.classList.add('is-on');
    audioEl.addEventListener('loadedmetadata', function () {
      if (Number.isFinite(audioEl.duration) && audioEl.duration > 5) state.duration = audioEl.duration;
      state.time = 0; state.activeIdx = 0;
      updateStopUI(0, false); updateProgressUI(); togglePlay(true);
    }, { once: true });
  });

  function scrubAt(clientX) {
    var rect = elProgress.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    state.time = ratio * state.duration;
    if (state.useMp3) audioEl.currentTime = state.time;
    var idx = stopIndexAt(state.time);
    if (idx !== state.activeIdx) { state.activeIdx = idx; updateStopUI(idx, false); }
    updateProgressUI();
  }

  var dragging = false;
  elProgress.addEventListener('pointerdown', function (e) { dragging = true; elProgress.setPointerCapture(e.pointerId); scrubAt(e.clientX); });
  elProgress.addEventListener('pointermove', function (e) { if (dragging) scrubAt(e.clientX); });
  elProgress.addEventListener('pointerup', function () { dragging = false; });

  window.addEventListener('resize', resize);
  resize();
  updateStopUI(0, false);
  updateProgressUI();
  requestAnimationFrame(render);
})();

