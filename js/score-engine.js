(function () {
  'use strict';

  var stage = document.getElementById('score-stage');
  var canvas = document.getElementById('score-canvas');
  var audioEl = document.getElementById('score-audio');
  if (!stage || !canvas || !audioEl || !window.MOYUAN_SCORES) return;

  var ctx = canvas.getContext('2d');
  var elKicker = document.getElementById('score-kicker');
  var elTitle = document.getElementById('score-title');
  var elSubtitle = document.getElementById('score-subtitle');
  var elPlayBtn = document.getElementById('score-play-btn');
  var elRestartBtn = document.getElementById('score-restart-btn');
  var elStartHint = document.getElementById('score-start-hint');
  var elStartBtn = document.getElementById('score-start-btn');
  var elProgress = document.getElementById('score-progress');
  var elProgressFill = document.getElementById('score-progress-fill');
  var elProgressThumb = document.getElementById('score-progress-thumb');
  var elTimeCur = document.getElementById('score-time-cur');
  var elTimeTot = document.getElementById('score-time-tot');
  var elSpeedBtn = document.getElementById('score-speed-btn');
  var elVolume = document.getElementById('score-volume');
  var elToggleTreble = document.getElementById('score-toggle-treble');
  var elToggleBass = document.getElementById('score-toggle-bass');
  var elToggleTilt = document.getElementById('score-toggle-tilt');
  var elTogglePiano = document.getElementById('score-toggle-piano');
  var pieceBtns = Array.prototype.slice.call(document.querySelectorAll('.score-piece-btn'));

  var DIATONIC_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  var SEMITONE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function parsePitch(name) {
    var m = /^([A-G])([#b]?)(\d)$/.exec(name);
    if (!m) return { diatonic: 28, accidental: '', midi: 60 };
    var oct = parseInt(m[3], 10);
    var acc = m[2];
    var midi = (oct + 1) * 12 + SEMITONE_INDEX[m[1]] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0);
    return {
      diatonic: oct * 7 + DIATONIC_INDEX[m[1]],
      accidental: acc,
      midi: midi
    };
  }

  // Engraving metrics
  var STAFF_GAP = 12;
  var TREBLE_BASS_GAP = 68;
  var SYSTEM_HEIGHT = 250;
  var BARS_PER_SYSTEM = 4;
  var BAR_WIDTH = 270;
  var CLEF_MARGIN = 76;
  var PAD_X = 360;
  var PAD_Y = 280;

  // Offscreen static engraved score cache (rendered ONCE per piece -> locked 60/120 FPS)
  var scoreCache = document.createElement('canvas');
  var cacheCtx = scoreCache.getContext('2d');
  var bgCache = document.createElement('canvas');
  var bgCtx = bgCache.getContext('2d');

  var state = {
    pieceId: 'lalapiano',
    piece: null,
    layout: null,
    playing: false,
    beat: 0,
    speed: 1,
    speeds: [0.75, 1, 1.25],
    speedIdx: 1,
    showTreble: true,
    showBass: true,
    tilted: true,
    viewMode: 'concert', // unified tilted grand staff + translucent 3D perspective piano underneath
    keyStates: {},
    pianoSparks: [],
    laneFlashes: [0, 0, 0, 0, 0, 0],
    laneColors: ['cyan', 'cyan', 'cyan', 'gold', 'cyan', 'cyan'],
    hitDiamonds: [],
    hitNoteSet: {},
    combo: 0,
    scoreVal: 0,
    judgeText: '',
    judgeColor: 'perfect',
    judgeTimer: 0,
    comboPop: 0,
    audioCtx: null,
    syncCtxTime: 0,
    syncMediaTime: 0,
    syncValid: false,
    lastFrame: 0,
    lastTrebleIdx: -1,
    lastBassIdx: -1,
    trebleTrail: [],
    bassTrail: [],
    sparks: [],
    camX: 0,
    camY: 0,
    camInit: false,
    smoothTime: 0,
    dpr: 1,
    w: 1,
    h: 1
  };

  function buildLayout(piece) {
    var beatsPerBar = piece.timeSig[0];
    var totalBeats = piece.bars * beatsPerBar;
    var systems = Math.ceil(piece.bars / BARS_PER_SYSTEM);

    function noteCoords(pitchName, beatStart, clef) {
      var p = parsePitch(pitchName);
      var bar = Math.min(piece.bars - 1, Math.floor(beatStart / beatsPerBar));
      var beatInBar = beatStart - bar * beatsPerBar;
      var sys = Math.floor(bar / BARS_PER_SYSTEM);
      var barInSys = bar % BARS_PER_SYSTEM;
      var x = PAD_X + CLEF_MARGIN + barInSys * BAR_WIDTH + 28 + (beatInBar / beatsPerBar) * (BAR_WIDTH - 46);
      var sysY = PAD_Y + sys * SYSTEM_HEIGHT;
      var bottomLineY = clef === 'treble'
        ? sysY + 4 * STAFF_GAP
        : sysY + 4 * STAFF_GAP + TREBLE_BASS_GAP + 4 * STAFF_GAP;
      var refDiatonic = clef === 'treble' ? 30 : 18;
      var stepsFromBottom = p.diatonic - refDiatonic;
      return {
        x: x,
        y: bottomLineY - stepsFromBottom * (STAFF_GAP / 2),
        accidental: p.accidental,
        midi: p.midi,
        stepsFromBottom: stepsFromBottom,
        sys: sys,
        bar: bar
      };
    }

    function mapVoice(list, clef) {
      return list.map(function (item, idx) {
        var c = noteCoords(item[0], item[1], clef);
        return {
          idx: idx,
          beat: item[1],
          dur: item[2],
          midi: c.midi,
          staccato: item[4] === 's',
          clef: clef,
          x: c.x,
          y: c.y,
          accidental: c.accidental,
          stepsFromBottom: c.stepsFromBottom,
          sys: c.sys,
          bar: c.bar
        };
      }).sort(function (a, b) { return a.beat - b.beat; });
    }

    var pedals = (piece.pedals || []).map(function (pd) {
      var bar = Math.min(piece.bars - 1, Math.floor(pd[0] / beatsPerBar));
      var sys = Math.floor(bar / BARS_PER_SYSTEM);
      var barInSys = bar % BARS_PER_SYSTEM;
      var beatInBar = pd[0] - bar * beatsPerBar;
      var endBeatInBar = Math.min(beatsPerBar - 0.15, beatInBar + pd[1]);
      return {
        x1: PAD_X + CLEF_MARGIN + barInSys * BAR_WIDTH + 22 + (beatInBar / beatsPerBar) * (BAR_WIDTH - 46),
        x2: PAD_X + CLEF_MARGIN + barInSys * BAR_WIDTH + 22 + (endBeatInBar / beatsPerBar) * (BAR_WIDTH - 46),
        y: PAD_Y + sys * SYSTEM_HEIGHT + 8 * STAFF_GAP + TREBLE_BASS_GAP + 34
      };
    });

    return {
      beatsPerBar: beatsPerBar,
      totalBeats: totalBeats,
      systems: systems,
      width: PAD_X * 2 + CLEF_MARGIN + BARS_PER_SYSTEM * BAR_WIDTH,
      height: PAD_Y * 2 + systems * SYSTEM_HEIGHT,
      treble: mapVoice(piece.treble, 'treble'),
      bass: mapVoice(piece.bass, 'bass'),
      pedals: pedals
    };
  }

  function renderScoreToCache(layout) {
    var scale = 1.5;
    scoreCache.width = Math.round(layout.width * scale);
    scoreCache.height = Math.round(layout.height * scale);
    cacheCtx.setTransform(scale, 0, 0, scale, 0, 0);
    cacheCtx.clearRect(0, 0, layout.width, layout.height);

    var piece = state.piece;
    var ink = 'rgba(20, 17, 14, 0.88)';
    var lineInk = 'rgba(20, 17, 14, 0.58)';
    var ghostInk = 'rgba(20, 17, 14, 0.24)';

    // Draw full-bleed ambient decorative staves above/below/left/right so no empty margins appear
    for (var row = -1; row <= layout.systems; row++) {
      var yT = PAD_Y + row * SYSTEM_HEIGHT;
      var yB = yT + 4 * STAFF_GAP + TREBLE_BASS_GAP;
      var isMain = row >= 0 && row < layout.systems;
      var xStart = isMain ? PAD_X + 20 : 40;
      var xEnd = isMain
        ? PAD_X + CLEF_MARGIN + Math.min(BARS_PER_SYSTEM, piece.bars - row * BARS_PER_SYSTEM) * BAR_WIDTH
        : layout.width - 40;

      // Subtle continuous staff extension left of main systems for full-screen parchment aesthetic
      if (isMain) {
        cacheCtx.strokeStyle = ghostInk;
        cacheCtx.lineWidth = 1;
        cacheCtx.beginPath();
        for (var gl = 0; gl < 5; gl++) {
          cacheCtx.moveTo(40, yT + gl * STAFF_GAP);
          cacheCtx.lineTo(xStart - 24, yT + gl * STAFF_GAP);
          cacheCtx.moveTo(40, yB + gl * STAFF_GAP);
          cacheCtx.lineTo(xStart - 24, yB + gl * STAFF_GAP);
          cacheCtx.moveTo(xEnd + 24, yT + gl * STAFF_GAP);
          cacheCtx.lineTo(layout.width - 40, yT + gl * STAFF_GAP);
          cacheCtx.moveTo(xEnd + 24, yB + gl * STAFF_GAP);
          cacheCtx.lineTo(layout.width - 40, yB + gl * STAFF_GAP);
        }
        cacheCtx.stroke();
      }

      cacheCtx.strokeStyle = isMain ? lineInk : ghostInk;
      cacheCtx.lineWidth = 1.1;
      cacheCtx.beginPath();
      for (var l = 0; l < 5; l++) {
        cacheCtx.moveTo(xStart, yT + l * STAFF_GAP);
        cacheCtx.lineTo(xEnd, yT + l * STAFF_GAP);
        cacheCtx.moveTo(xStart, yB + l * STAFF_GAP);
        cacheCtx.lineTo(xEnd, yB + l * STAFF_GAP);
      }
      cacheCtx.stroke();

      if (!isMain) continue;

      // Brace & barline
      cacheCtx.strokeStyle = ink;
      cacheCtx.lineWidth = 2.2;
      cacheCtx.beginPath();
      cacheCtx.moveTo(xStart, yT);
      cacheCtx.lineTo(xStart, yB + 4 * STAFF_GAP);
      cacheCtx.stroke();

      cacheCtx.lineWidth = 1.6;
      var midY = (yT + yB + 4 * STAFF_GAP) / 2;
      cacheCtx.beginPath();
      cacheCtx.moveTo(xStart - 4, yT);
      cacheCtx.bezierCurveTo(xStart - 16, yT + 28, xStart - 4, midY - 12, xStart - 14, midY);
      cacheCtx.bezierCurveTo(xStart - 4, midY + 12, xStart - 16, yB + 4 * STAFF_GAP - 28, xStart - 4, yB + 4 * STAFF_GAP);
      cacheCtx.stroke();

      // Measure number & Pno. label like printed sheet music
      cacheCtx.fillStyle = 'rgba(20, 17, 14, 0.78)';
      cacheCtx.font = 'italic 600 15px Georgia, "Times New Roman", serif';
      cacheCtx.fillText(String(row * BARS_PER_SYSTEM + 1), xStart - 2, yT - 10);
      cacheCtx.font = '600 18px Georgia, "Times New Roman", serif';
      cacheCtx.fillText('Pno.', xStart - 56, midY + 6);
      if (row === 0) {
        cacheCtx.font = 'italic 700 19px Georgia, "Times New Roman", serif';
        cacheCtx.fillText('mf', xStart + 64, yT + 4 * STAFF_GAP + TREBLE_BASS_GAP * 0.52);
      }

      cacheCtx.fillStyle = ink;
      cacheCtx.font = '56px "Segoe UI Symbol", "Apple Symbols", Georgia, serif';
      cacheCtx.fillText('\uD834\uDD1E', xStart + 6, yT + 43);
      cacheCtx.font = '40px "Segoe UI Symbol", "Apple Symbols", Georgia, serif';
      cacheCtx.fillText('\uD834\uDD22', xStart + 10, yB + 33);

      if (row === 0) {
        cacheCtx.font = '700 22px Georgia, serif';
        cacheCtx.fillText(String(piece.timeSig[0]), xStart + 42, yT + 22);
        cacheCtx.fillText(String(piece.timeSig[1]), xStart + 42, yT + 44);
        cacheCtx.fillText(String(piece.timeSig[0]), xStart + 42, yB + 22);
        cacheCtx.fillText(String(piece.timeSig[1]), xStart + 42, yB + 44);
      }

      var barsInRow = Math.min(BARS_PER_SYSTEM, piece.bars - row * BARS_PER_SYSTEM);
      cacheCtx.strokeStyle = lineInk;
      cacheCtx.lineWidth = 1.25;
      for (var b = 1; b <= barsInRow; b++) {
        var bx = PAD_X + CLEF_MARGIN + b * BAR_WIDTH;
        cacheCtx.beginPath();
        cacheCtx.moveTo(bx, yT);
        cacheCtx.lineTo(bx, yB + 4 * STAFF_GAP);
        cacheCtx.stroke();
      }
    }

    cacheCtx.fillStyle = 'rgba(24, 21, 18, 0.72)';
    layout.pedals.forEach(function (pd) {
      cacheCtx.font = 'italic 600 18px Georgia, serif';
      cacheCtx.fillText('Ped.', pd.x1 - 8, pd.y);
      cacheCtx.font = '15px Georgia, serif';
      cacheCtx.fillText('✻', pd.x2 - 6, pd.y);
    });

    engraveVoice(cacheCtx, layout.treble);
    engraveVoice(cacheCtx, layout.bass);
  }

  function engraveVoice(c, notes) {
    var ink = 'rgba(20, 17, 14, 0.9)';
    var i = 0;
    while (i < notes.length) {
      var n = notes[i];
      var beamGroup = [n];
      if (n.dur <= 0.5) {
        var j = i + 1;
        while (
          j < notes.length &&
          notes[j].dur <= 0.5 &&
          notes[j].bar === n.bar &&
          notes[j].beat - notes[j - 1].beat <= 0.55 &&
          beamGroup.length < 4
        ) {
          beamGroup.push(notes[j]);
          j++;
        }
      }

      var avgSteps = beamGroup.reduce(function (sum, item) { return sum + item.stepsFromBottom; }, 0) / beamGroup.length;
      var stemUp = avgSteps < 4;
      var stemLen = 34;
      var stemTips = [];

      beamGroup.forEach(function (item) {
        var isHollow = item.dur >= 2;
        var staffBottom = item.clef === 'treble'
          ? PAD_Y + item.sys * SYSTEM_HEIGHT + 4 * STAFF_GAP
          : PAD_Y + item.sys * SYSTEM_HEIGHT + 8 * STAFF_GAP + TREBLE_BASS_GAP;
        var staffTop = staffBottom - 4 * STAFF_GAP;

        c.strokeStyle = 'rgba(22, 19, 16, 0.72)';
        c.lineWidth = 1.2;
        if (item.y > staffBottom + STAFF_GAP * 0.5) {
          for (var ly = staffBottom + STAFF_GAP; ly <= item.y + 1; ly += STAFF_GAP) {
            c.beginPath(); c.moveTo(item.x - 10, ly); c.lineTo(item.x + 10, ly); c.stroke();
          }
        } else if (item.y < staffTop - STAFF_GAP * 0.5) {
          for (var hy = staffTop - STAFF_GAP; hy >= item.y - 1; hy -= STAFF_GAP) {
            c.beginPath(); c.moveTo(item.x - 10, hy); c.lineTo(item.x + 10, hy); c.stroke();
          }
        }

        if (item.accidental) {
          c.fillStyle = ink;
          c.font = '15px Georgia, serif';
          c.fillText(item.accidental === '#' ? '♯' : '♭', item.x - 17, item.y + 5);
        }

        c.save();
        c.translate(item.x, item.y);
        c.rotate(-0.32);
        c.beginPath();
        c.ellipse(0, 0, 6.2, 4.4, 0, 0, Math.PI * 2);
        if (isHollow) {
          c.strokeStyle = ink;
          c.lineWidth = 1.8;
          c.stroke();
        } else {
          c.fillStyle = ink;
          c.fill();
        }
        c.restore();

        if (item.staccato) {
          c.fillStyle = ink;
          c.beginPath();
          c.arc(item.x, stemUp ? item.y + 11 : item.y - 11, 2, 0, Math.PI * 2);
          c.fill();
        }

        if (item.dur < 4) {
          stemTips.push({
            x: stemUp ? item.x + 5.6 : item.x - 5.6,
            y: stemUp ? item.y - stemLen : item.y + stemLen,
            baseY: item.y
          });
        }
      });

      if (stemTips.length === 1) {
        c.strokeStyle = ink;
        c.lineWidth = 1.35;
        c.beginPath();
        c.moveTo(stemTips[0].x, stemTips[0].baseY);
        c.lineTo(stemTips[0].x, stemTips[0].y);
        c.stroke();
      } else if (stemTips.length > 1) {
        var first = stemTips[0], last = stemTips[stemTips.length - 1];
        var slope = Math.max(-0.22, Math.min(0.22, (last.y - first.y) / Math.max(1, last.x - first.x)));
        var extremeY = stemUp
          ? Math.min.apply(null, stemTips.map(function (t) { return t.y; }))
          : Math.max.apply(null, stemTips.map(function (t) { return t.y; }));
        var midX = (first.x + last.x) / 2;
        var y1 = extremeY + (first.x - midX) * slope;
        var y2 = extremeY + (last.x - midX) * slope;

        c.strokeStyle = ink;
        c.lineWidth = 1.35;
        stemTips.forEach(function (t) {
          var frac = (t.x - first.x) / Math.max(1, last.x - first.x);
          c.beginPath();
          c.moveTo(t.x, t.baseY);
          c.lineTo(t.x, y1 + (y2 - y1) * frac);
          c.stroke();
        });

        c.lineWidth = 4.2;
        c.beginPath();
        c.moveTo(first.x, y1);
        c.lineTo(last.x, y2);
        c.stroke();

        if (beamGroup.every(function (item) { return item.dur <= 0.25; })) {
          var off = stemUp ? 6.5 : -6.5;
          c.lineWidth = 3.2;
          c.beginPath();
          c.moveTo(first.x, y1 + off);
          c.lineTo(last.x, y2 + off);
          c.stroke();
        }
      }

      i += beamGroup.length;
    }
  }

  function renderBgCache() {
    bgCache.width = Math.max(1, Math.round(state.w));
    bgCache.height = Math.max(1, Math.round(state.h));
    var g = bgCtx.createRadialGradient(state.w * 0.48, state.h * 0.48, 24, state.w * 0.5, state.h * 0.5, Math.max(state.w, state.h) * 0.72);
    g.addColorStop(0, '#9e9992');
    g.addColorStop(0.36, '#7a756e');
    g.addColorStop(0.7, '#413d39');
    g.addColorStop(1, '#181614');
    bgCtx.fillStyle = g;
    bgCtx.fillRect(0, 0, state.w, state.h);

    // Subtle tactile parchment paper grain (cached once per resize -> zero runtime cost)
    bgCtx.fillStyle = 'rgba(255, 250, 240, 0.032)';
    for (var y = 0; y < state.h; y += 6) {
      for (var x = (y % 4) * 3; x < state.w; x += 21) {
        if (((x * 37 + y * 17) & 7) === 0) bgCtx.fillRect(x, y, 2, 1);
      }
    }
    bgCtx.fillStyle = 'rgba(15, 12, 10, 0.036)';
    for (var y2 = 1; y2 < state.h; y2 += 6) {
      for (var x2 = 2; x2 < state.w; x2 += 18) {
        if (((x2 * 29 + y2 * 43) & 7) === 1) bgCtx.fillRect(x2, y2, 1.5, 1.5);
      }
    }
  }

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    var s = Math.floor(sec);
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function loadPiece(id, autoPlay) {
    var piece = window.MOYUAN_SCORES[id] || window.MOYUAN_SCORES.lalapiano;
    state.pieceId = piece.id;
    state.piece = piece;
    state.layout = buildLayout(piece);
    renderScoreToCache(state.layout);
    state.beat = 0;
    state.lastTrebleIdx = -1;
    state.lastBassIdx = -1;
    state.trebleTrail = [];
    state.bassTrail = [];
    state.sparks = [];
    state.camInit = false;
    resetRhythmStats();

    elKicker.textContent = piece.kicker;
    elTitle.textContent = piece.title;
    elSubtitle.textContent = piece.subtitle;

    pieceBtns.forEach(function (btn) {
      var active = btn.dataset.piece === piece.id;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    audioEl.pause();
    audioEl.src = piece.audioUrl;
    audioEl.playbackRate = state.speed;
    audioEl.volume = (Number(elVolume.value) || 80) / 100;
    audioEl.load();

    updateTimeUI();
    if (autoPlay) startPlayback();
    else pausePlayback();
  }

  function updateTimeUI() {
    var dur = Number.isFinite(audioEl.duration) && audioEl.duration > 0 ? audioEl.duration : 0;
    var cur = audioEl.currentTime || 0;
    var ratio = dur ? Math.max(0, Math.min(1, cur / dur)) : 0;
    var pct = (ratio * 100).toFixed(2) + '%';
    elProgressFill.style.width = pct;
    elProgressThumb.style.left = pct;
    elProgress.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    elTimeCur.textContent = formatTime(cur);
    elTimeTot.textContent = dur ? formatTime(dur) : '--:--';
  }

  function ensureAudioClock() {
    if (!state.audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) state.audioCtx = new AC();
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume().catch(function () {});
    }
  }

  function resetRhythmStats() {
    state.hitNoteSet = {};
    state.combo = 0;
    state.scoreVal = 0;
    state.judgeTimer = 0;
    state.comboPop = 0;
    state.hitDiamonds = [];
    state.pianoSparks = [];
    state.laneFlashes = [0, 0, 0, 0, 0, 0];
    state.syncValid = false;
  }

  function startPlayback() {
    if (elStartHint) elStartHint.classList.add('is-hidden');
    ensureAudioClock();
    audioEl.playbackRate = state.speed;
    var p = audioEl.play();
    if (p && typeof p.then === 'function') {
      p.then(function () {
        state.playing = true;
        if (state.audioCtx) {
          state.syncCtxTime = state.audioCtx.currentTime;
          state.syncMediaTime = audioEl.currentTime || 0;
          state.syncValid = true;
        }
        elPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
      }).catch(function () {
        state.playing = false;
        elPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
      });
    } else {
      state.playing = true;
      elPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
  }

  function pausePlayback() {
    audioEl.pause();
    state.playing = false;
    state.syncValid = false;
    elPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
  }

  function orbPositionAt(notes, beat) {
    if (!notes.length) return null;
    var curIdx = 0;
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].beat <= beat) curIdx = i;
      else break;
    }
    var cur = notes[curIdx];
    var next = notes[curIdx + 1] || cur;
    if (cur === next || cur.sys !== next.sys) {
      return { x: cur.x, y: cur.y, sys: cur.sys, idx: curIdx, noteX: cur.x, noteY: cur.y, t: 0 };
    }
    var span = Math.max(0.001, next.beat - cur.beat);
    var t = Math.max(0, Math.min(1, (beat - cur.beat) / span));
    // Flowing legato X advance (never stalls to 0 velocity at note boundaries) + lively parabolic hop
    var smooth = t * t * (3 - 2 * t);
    var xLerp = 0.76 * t + 0.24 * smooth;
    var dist = Math.hypot(next.x - cur.x, next.y - cur.y);
    var hop = Math.min(30, Math.max(10, dist * 0.28));
    var arc = 4 * t * (1 - t) * hop;
    return {
      x: cur.x + (next.x - cur.x) * xLerp,
      y: cur.y + (next.y - cur.y) * smooth - arc,
      sys: cur.sys,
      idx: curIdx,
      noteX: cur.x,
      noteY: cur.y,
      t: t
    };
  }

  function spawnSparks(x, y, color) {
    if (state.sparks.length > 48) return;
    for (var i = 0; i < 4; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 14 + Math.random() * 32;
      state.sparks.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 8,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        r: 1.3 + Math.random() * 1.8,
        color: color
      });
    }
  }

  function drawOrbAndTrail(pos, trail, coreColor, glowRgba, outerRgba) {
    if (!pos) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Illuminated active notehead halo (like printed score lit from within)
    if (typeof pos.noteX === 'number') {
      var noteFade = Math.max(0, 1 - (pos.t || 0) * 1.15);
      if (noteFade > 0.02) {
        var ng = ctx.createRadialGradient(pos.noteX, pos.noteY, 1, pos.noteX, pos.noteY, 18);
        ng.addColorStop(0, glowRgba.replace('ALPHA', (noteFade * 0.85).toFixed(3)));
        ng.addColorStop(0.55, glowRgba.replace('ALPHA', (noteFade * 0.32).toFixed(3)));
        ng.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.arc(pos.noteX, pos.noteY, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Silky luminous parabolic trail
    if (trail.length > 2) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (var i = 1; i < trail.length; i++) {
        var p0 = trail[i - 1], p1 = trail[i];
        if (Math.abs(p1.x - p0.x) > 120 || Math.abs(p1.y - p0.y) > 120) continue;
        var frac = i / trail.length;
        ctx.strokeStyle = glowRgba.replace('ALPHA', (frac * frac * 0.62).toFixed(3));
        ctx.lineWidth = 1.2 + frac * 4.4;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    }

    // Refined jewel-like glowing orb (tight white core + soft atmospheric bloom)
    var g = ctx.createRadialGradient(pos.x, pos.y, 0.5, pos.x, pos.y, 24);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.18, coreColor);
    g.addColorStop(0.48, outerRgba);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function resize() {
    state.w = Math.max(1, stage.clientWidth);
    state.h = Math.max(1, stage.clientHeight);
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(state.w * state.dpr);
    canvas.height = Math.round(state.h * state.dpr);
    renderBgCache();
  }

  function render(now) {
    requestAnimationFrame(render);
    var dt = state.lastFrame ? Math.min(0.05, (now - state.lastFrame) / 1000) : 0.016;
    state.lastFrame = now;

    var layout = state.layout;
    if (!layout) return;

    if (!audioEl.paused) {
      // Sub-millisecond AudioContext.currentTime clock anchored to media playback
      var rate = audioEl.playbackRate || 1;
      if (state.audioCtx && state.syncValid) {
        var predicted = state.syncMediaTime + (state.audioCtx.currentTime - state.syncCtxTime) * rate;
        var drift = audioEl.currentTime - predicted;
        if (Math.abs(drift) > 0.08) {
          state.syncCtxTime = state.audioCtx.currentTime;
          state.syncMediaTime = audioEl.currentTime;
          state.smoothTime = audioEl.currentTime;
        } else {
          state.syncMediaTime += drift * Math.min(1, dt * 6);
          state.smoothTime = predicted;
        }
      } else {
        state.smoothTime += dt * rate;
        var d2 = audioEl.currentTime - state.smoothTime;
        if (Math.abs(d2) > 0.12) state.smoothTime = audioEl.currentTime;
        else state.smoothTime += d2 * Math.min(1, dt * 16);
      }
      var offset = state.piece.audioOffset || 0;
      var effectiveTime = Math.max(0, state.smoothTime - offset);
      var rawBeats = (effectiveTime * state.piece.bpm) / 60;
      state.rawBeats = rawBeats;
      state.beat = rawBeats % layout.totalBeats;
      updateTimeUI();
    } else {
      state.smoothTime = audioEl.currentTime || 0;
    }

    for (var k = state.sparks.length - 1; k >= 0; k--) {
      var sp = state.sparks[k];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) state.sparks.splice(k, 1);
    }

    var treblePos = state.showTreble ? orbPositionAt(layout.treble, state.beat) : null;
    var bassPos = state.showBass ? orbPositionAt(layout.bass, state.beat) : null;

    if (!audioEl.paused) {
      if (treblePos) {
        if (treblePos.idx !== state.lastTrebleIdx) {
          state.lastTrebleIdx = treblePos.idx;
          spawnSparks(treblePos.x, treblePos.y, '#c4b5fd');
        }
        state.trebleTrail.push({ x: treblePos.x, y: treblePos.y });
        if (state.trebleTrail.length > 22) state.trebleTrail.shift();
      }
      if (bassPos) {
        if (bassPos.idx !== state.lastBassIdx) {
          state.lastBassIdx = bassPos.idx;
          spawnSparks(bassPos.x, bassPos.y, '#fdba74');
        }
        state.bassTrail.push({ x: bassPos.x, y: bassPos.y });
        if (state.bassTrail.length > 22) state.bassTrail.shift();
      }
    }

    var focus = treblePos || bassPos || { x: PAD_X + CLEF_MARGIN + 220, y: PAD_Y + 80, sys: 0 };
    var targetX = focus.x;
    var targetY = PAD_Y + focus.sys * SYSTEM_HEIGHT + 74;
    if (!state.camInit) {
      state.camX = targetX;
      state.camY = targetY;
      state.camInit = true;
    } else {
      var smooth = 1 - Math.exp(-dt * 4.5);
      state.camX += (targetX - state.camX) * smooth;
      state.camY += (targetY - state.camY) * smooth;
    }

    // Ultra-fast frame draw
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    if (state.viewMode === 'rhythm') {
      drawPjskRhythmStage(layout, dt);
      return;
    }

    ctx.drawImage(bgCache, 0, 0, state.w, state.h);

    ctx.save();
    var isConcert = state.viewMode === 'concert';
    ctx.translate(state.w * 0.5, isConcert ? state.h * 0.36 : state.h * 0.52);
    var scale = state.w < 700
      ? (isConcert ? 0.72 : 0.82)
      : (isConcert ? Math.min(1.16, Math.max(0.92, state.w / 1220)) : Math.min(1.36, Math.max(1.06, state.w / 1080)));
    ctx.scale(scale, scale);
    if (state.tilted) ctx.rotate(-0.195);
    ctx.translate(-state.camX, -state.camY);

    ctx.drawImage(scoreCache, 0, 0, layout.width, layout.height);

    if (state.sparks.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (var s = 0; s < state.sparks.length; s++) {
        var p = state.sparks[s];
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawOrbAndTrail(treblePos, state.trebleTrail, '#c4b5fd', 'rgba(167,139,250,ALPHA)', 'rgba(139,92,246,0.34)');
    drawOrbAndTrail(bassPos, state.bassTrail, '#fdba74', 'rgba(251,146,60,ALPHA)', 'rgba(234,88,12,0.34)');
    ctx.restore();

    if (isConcert) {
      updatePianoKeys(layout, dt);
      draw3DPerspectivePiano(dt);
    }
  }

  // 3D Perspective Grand Piano (tilted cinema angle, beveled 3D keys, rising light beams)
  function draw3DPerspectivePiano(dt) {
    var w = state.w;
    var h = state.h;
    var topY = h - Math.max(180, Math.min(235, h * 0.295));
    var botY = h - 78;
    var frontH = 14;
    var topW = Math.min(w * 0.72, 860);
    var botW = Math.min(w * 0.90, 1140);
    // Subtle cinema skew so the 3D piano feels photographed from the pianist's right-front angle
    var topLeft = (w - topW) * 0.5 + Math.min(34, w * 0.025);
    var botLeft = (w - botW) * 0.5 - Math.min(14, w * 0.01);

    function pt(u, v, yDrop) {
      var xTop = topLeft + u * topW;
      var xBot = botLeft + u * botW;
      // Perspective foreshortening curve on v
      var vp = Math.pow(v, 1.18);
      return {
        x: xTop + (xBot - xTop) * vp,
        y: topY + (botY - topY) * vp + (yDrop || 0)
      };
    }

    ctx.save();
    // 1. Translucent smoked-glass stage vignette blending seamlessly over the sheet music
    var stageGrad = ctx.createLinearGradient(0, topY - 64, 0, h);
    stageGrad.addColorStop(0, 'rgba(14, 12, 12, 0)');
    stageGrad.addColorStop(0.5, 'rgba(12, 10, 11, 0.36)');
    stageGrad.addColorStop(1, 'rgba(8, 8, 10, 0.68)');
    ctx.fillStyle = stageGrad;
    ctx.fillRect(0, topY - 64, w, h - (topY - 64));

    // 2. Translucent 3D Glass Piano Body (keeps the sheet music breathing underneath)
    ctx.globalAlpha = 0.84;
    var bTL = pt(-0.028, -0.22, 0), bTR = pt(1.028, -0.22, 0);
    var bBL = pt(-0.028, 1.04, frontH + 6), bBR = pt(1.028, 1.04, frontH + 6);
    ctx.fillStyle = 'rgba(12, 11, 16, 0.62)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = -8;
    ctx.beginPath();
    ctx.moveTo(bTL.x, bTL.y);
    ctx.lineTo(bTR.x, bTR.y);
    ctx.lineTo(bBR.x, bBR.y);
    ctx.lineTo(bBL.x, bBL.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Glossy fallboard specular reflection + brass brand line
    var fTL = pt(-0.015, -0.18, 0), fTR = pt(1.015, -0.18, 0);
    var fBL = pt(-0.015, 0, 0), fBR = pt(1.015, 0, 0);
    var fallGrad = ctx.createLinearGradient(0, fTL.y, 0, fBL.y);
    fallGrad.addColorStop(0, 'rgba(255, 245, 230, 0.16)');
    fallGrad.addColorStop(0.45, 'rgba(255, 245, 230, 0.04)');
    fallGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = fallGrad;
    ctx.beginPath();
    ctx.moveTo(fTL.x, fTL.y);
    ctx.lineTo(fTR.x, fTR.y);
    ctx.lineTo(fBR.x, fBR.y);
    ctx.lineTo(fBL.x, fBL.y);
    ctx.closePath();
    ctx.fill();

    // Subtle gold inlay label on the fallboard
    var midF = pt(0.5, -0.09, 0);
    ctx.fillStyle = 'rgba(226, 198, 146, 0.45)';
    ctx.font = '600 9.5px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('M O Y U A N   G R A N D', midF.x, midF.y + 3);
    ctx.textAlign = 'start';

    // Crimson felt strip in perspective
    var cTL = pt(0, -0.025, 0), cTR = pt(1, -0.025, 0);
    var cBL = pt(0, 0.005, 0), cBR = pt(1, 0.005, 0);
    ctx.fillStyle = '#881b1b';
    ctx.beginPath();
    ctx.moveTo(cTL.x, cTL.y); ctx.lineTo(cTR.x, cTR.y);
    ctx.lineTo(cBR.x, cBR.y); ctx.lineTo(cBL.x, cBL.y);
    ctx.closePath();
    ctx.fill();

    // Build white & black key lists (C2..C6 = 29 whites, 20 blacks)
    var whites = [], blacks = [], wIdx = 0;
    for (var m = PIANO_START_MIDI; m <= PIANO_END_MIDI; m++) {
      if (IS_BLACK[m % 12]) blacks.push({ midi: m, afterWhite: wIdx - 1 });
      else whites.push({ midi: m, idx: wIdx++ });
    }
    var nW = whites.length;

    // 3. Draw 3D Perspective Ivory White Keys (top face + 3D front lip)
    for (var i = 0; i < nW; i++) {
      var wk = whites[i];
      var ks = state.keyStates[wk.midi];
      var press = ks ? ks.press : 0;
      var u0 = (i + 0.03) / nW;
      var u1 = (i + 0.97) / nW;
      var drop = press * 5.5;

      var pTL = pt(u0, 0, drop * 0.25), pTR = pt(u1, 0, drop * 0.25);
      var pBL = pt(u0, 1, drop), pBR = pt(u1, 1, drop);

      // Top face
      var wg = ctx.createLinearGradient(0, pTL.y, 0, pBL.y);
      if (press > 0.05) {
        var isTr = ks.voice === 'treble';
        wg.addColorStop(0, isTr ? '#d8ccff' : '#ffe3be');
        wg.addColorStop(0.55, isTr ? '#c4b5fd' : '#fdba74');
        wg.addColorStop(1, isTr ? '#8b5cf6' : '#ea580c');
      } else {
        wg.addColorStop(0, '#cfc9be');
        wg.addColorStop(0.16, '#f6f2ea');
        wg.addColorStop(0.86, '#eae4d9');
        wg.addColorStop(1, '#d6cfc2');
      }
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(pTL.x, pTL.y); ctx.lineTo(pTR.x, pTR.y);
      ctx.lineTo(pBR.x, pBR.y); ctx.lineTo(pBL.x, pBL.y);
      ctx.closePath();
      ctx.fill();

      // 3D front vertical face (drops down as the key is pressed!)
      var lipH = Math.max(4, frontH - drop);
      ctx.fillStyle = press > 0.05
        ? (ks.voice === 'treble' ? '#6d28d9' : '#c2410c')
        : '#b5ada0';
      ctx.beginPath();
      ctx.moveTo(pBL.x, pBL.y); ctx.lineTo(pBR.x, pBR.y);
      ctx.lineTo(pBR.x, pBR.y + lipH); ctx.lineTo(pBL.x, pBL.y + lipH);
      ctx.closePath();
      ctx.fill();

      // Rising concert light column blooming upward from struck key
      if (press > 0.08) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var col = ks.voice === 'treble' ? 'rgba(167,139,250,' : 'rgba(251,146,60,';
        var beamTop = pt((u0 + u1) * 0.5, -0.55, 0);
        var beamBot = pt((u0 + u1) * 0.5, 0.25, 0);
        var bgBeam = ctx.createLinearGradient(beamBot.x, beamBot.y, beamTop.x, beamTop.y);
        bgBeam.addColorStop(0, col + (press * 0.48).toFixed(3) + ')');
        bgBeam.addColorStop(1, col + '0)');
        ctx.fillStyle = bgBeam;
        var bwHalf = (pTR.x - pTL.x) * 0.8;
        ctx.beginPath();
        ctx.moveTo(beamBot.x - bwHalf, beamBot.y);
        ctx.lineTo(beamBot.x + bwHalf, beamBot.y);
        ctx.lineTo(beamTop.x + bwHalf * 0.65, beamTop.y);
        ctx.lineTo(beamTop.x - bwHalf * 0.65, beamTop.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // 4. Draw 3D Perspective Ebony Black Keys (cast shadow + top + 3D front face)
    for (var j = 0; j < blacks.length; j++) {
      var bk = blacks[j];
      var bks = state.keyStates[bk.midi];
      var bPress = bks ? bks.press : 0;
      var cu = (bk.afterWhite + 1) / nW;
      var halfU = 0.31 / nW;
      var lift = (1 - bPress) * 6.5;

      // Cast shadow on white keys
      var sTL = pt(cu - halfU, 0, 1), sTR = pt(cu + halfU + 0.08 / nW, 0, 1);
      var sBL = pt(cu - halfU, 0.62, 3), sBR = pt(cu + halfU + 0.14 / nW, 0.62, 3);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
      ctx.beginPath();
      ctx.moveTo(sTL.x, sTL.y); ctx.lineTo(sTR.x, sTR.y);
      ctx.lineTo(sBR.x, sBR.y); ctx.lineTo(sBL.x, sBL.y);
      ctx.closePath();
      ctx.fill();

      // 3D raised ebony top face
      var kTL = pt(cu - halfU, 0, -lift), kTR = pt(cu + halfU, 0, -lift);
      var kBL = pt(cu - halfU * 0.92, 0.58, -lift * 0.85), kBR = pt(cu + halfU * 0.92, 0.58, -lift * 0.85);
      var kg = ctx.createLinearGradient(0, kTL.y, 0, kBL.y);
      if (bPress > 0.05) {
        var bTr = bks.voice === 'treble';
        kg.addColorStop(0, bTr ? '#7c3aed' : '#c2410c');
        kg.addColorStop(0.7, bTr ? '#a78bfa' : '#fb923c');
        kg.addColorStop(1, bTr ? '#ede9fe' : '#ffedd5');
      } else {
        kg.addColorStop(0, '#312e30');
        kg.addColorStop(0.3, '#171517');
        kg.addColorStop(1, '#09090b');
      }
      ctx.fillStyle = kg;
      ctx.beginPath();
      ctx.moveTo(kTL.x, kTL.y); ctx.lineTo(kTR.x, kTR.y);
      ctx.lineTo(kBR.x, kBR.y); ctx.lineTo(kBL.x, kBL.y);
      ctx.closePath();
      ctx.fill();

      // 3D front slanted face of the black key
      var fBL = pt(cu - halfU, 0.61, 0), fBR = pt(cu + halfU, 0.61, 0);
      ctx.fillStyle = bPress > 0.05
        ? (bks.voice === 'treble' ? '#5b21b6' : '#9a3412')
        : '#232024';
      ctx.beginPath();
      ctx.moveTo(kBL.x, kBL.y); ctx.lineTo(kBR.x, kBR.y);
      ctx.lineTo(fBR.x, fBR.y); ctx.lineTo(fBL.x, fBL.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // =========================================================================
  // PJSK / Project SEKAI-inspired 3D Perspective Rhythm Highway
  // =========================================================================
  var LANE_COUNT = 6;

  function noteToLane(nt, voice) {
    // Map pitch cleanly into 6 balanced SEKAI lanes (0-2 left/bass, 3-5 right/treble)
    if (voice === 'bass') {
      return Math.max(0, Math.min(2, Math.floor((nt.midi - 36) / 8)));
    }
    return Math.max(3, Math.min(5, 3 + Math.floor((nt.midi - 60) / 7)));
  }

  function triggerSekaiHit(lane, isCritical, hitX, hitY, laneW) {
    state.laneFlashes[lane] = 1.0;
    state.laneColors[lane] = isCritical ? 'gold' : 'cyan';
    state.combo += 1;
    state.scoreVal += isCritical ? 1250 : 1000;
    state.comboPop = 1.0;
    state.judgeText = isCritical ? 'CRITICAL' : 'PERFECT';
    state.judgeColor = isCritical ? 'critical' : 'perfect';
    state.judgeTimer = 0.58;

    // Expanding rotated diamond shockwaves (signature PJSK hit ring)
    state.hitDiamonds.push({
      x: hitX, y: hitY,
      size: laneW * 0.36,
      maxSize: laneW * 1.15,
      life: 0.34, maxLife: 0.34,
      color: isCritical ? '#fde047' : '#67e8f9'
    });

    // Diamond-shard particle burst emitter
    if (state.pianoSparks.length < 130) {
      var palette = isCritical
        ? ['#fef08a', '#facc15', '#fb923c', '#ffffff']
        : ['#a5f3fc', '#38bdf8', '#c084fc', '#ffffff'];
      for (var i = 0; i < 11; i++) {
        var ang = -Math.PI * (0.15 + Math.random() * 0.7);
        var spd = 95 + Math.random() * 195;
        state.pianoSparks.push({
          x: hitX + (Math.random() - 0.5) * laneW * 0.65,
          y: hitY,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0.36 + Math.random() * 0.34,
          maxLife: 0.7,
          r: 2.2 + Math.random() * 3.4,
          color: palette[i % palette.length],
          diamond: true
        });
      }
    }
  }

  function drawPjskRhythmStage(layout, dt) {
    var w = state.w;
    var h = state.h;
    var topY = Math.max(52, h * 0.09);
    var judgeY = h - Math.max(118, Math.min(152, h * 0.19));
    var botY = h - 72;
    var topW = Math.min(w * 0.16, 175);
    var judgeW = Math.min(w * 0.70, 820);
    var cx = w * 0.5;
    var lookaheadBeats = 4.6;

    // True 3D perspective depth projection: z=0 at top horizon, z=1 at judgment line
    function proj(u, z) {
      // Exponential perspective curve so notes accelerate naturally toward the viewer
      var p = Math.pow(Math.max(0, Math.min(1.18, z)), 2.15);
      var y = topY + (judgeY - topY) * p;
      var halfW = (topW + (judgeW - topW) * p) * 0.5;
      return {
        x: cx + (u - 0.5) * 2 * halfW,
        y: y,
        scale: 0.22 + 0.78 * p,
        halfW: halfW
      };
    }

    // 1. Deep SEKAI cyber-indigo stage backdrop + twin aurora wings + animated equalizer
    var bg = ctx.createRadialGradient(cx, judgeY * 0.48, 10, cx, judgeY * 0.56, Math.max(w, h) * 0.78);
    bg.addColorStop(0, '#2a2466');
    bg.addColorStop(0.42, '#14153a');
    bg.addColorStop(1, '#060712');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Luminous violet-cyan stage aurora wings flaring out beside the 3D highway
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var wingL = ctx.createRadialGradient(cx - judgeW * 0.48, judgeY * 0.72, 10, cx - judgeW * 0.42, judgeY * 0.65, w * 0.32);
    wingL.addColorStop(0, 'rgba(99, 102, 241, 0.24)');
    wingL.addColorStop(0.5, 'rgba(56, 189, 248, 0.09)');
    wingL.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = wingL;
    ctx.fillRect(0, 0, w, h);

    var wingR = ctx.createRadialGradient(cx + judgeW * 0.48, judgeY * 0.72, 10, cx + judgeW * 0.42, judgeY * 0.65, w * 0.32);
    wingR.addColorStop(0, 'rgba(192, 132, 252, 0.24)');
    wingR.addColorStop(0.5, 'rgba(244, 114, 182, 0.08)');
    wingR.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = wingR;
    ctx.fillRect(0, 0, w, h);

    // Floating starlight bokeh particles across the cyber stage
    var tNow = (state.rawBeats || 0) * 0.6;
    for (var st = 0; st < 28; st++) {
      var sx = ((st * 197.3 + tNow * (12 + (st % 5) * 3)) % w);
      var sy = ((st * 113.7 - tNow * (18 + (st % 4) * 5)) % judgeY + judgeY) % judgeY;
      var sr = 1.2 + (st % 3) * 0.9;
      ctx.fillStyle = st % 2 === 0 ? 'rgba(165, 243, 252, 0.28)' : 'rgba(216, 180, 254, 0.26)';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Animated neon equalizer silhouette behind the highway
    ctx.save();
    var bars = 48;
    var barStep = w / bars;
    var tBeat = (state.rawBeats || 0) * Math.PI;
    for (var eb = 0; eb < bars; eb++) {
      var distCenter = Math.abs(eb - bars * 0.5) / (bars * 0.5);
      var wave = 0.32 + 0.68 * Math.abs(Math.sin(eb * 0.55 + tBeat * 0.85) * Math.cos(eb * 0.27 - tBeat * 0.45));
      var bh = (54 + 132 * wave) * (0.45 + 0.55 * distCenter);
      var segs = Math.floor(bh / 8);
      for (var sg = 0; sg < segs; sg++) {
        var sy2 = judgeY - sg * 8;
        ctx.fillStyle = sg > segs * 0.72
          ? 'rgba(216, 180, 254, 0.22)'
          : 'rgba(56, 189, 248, 0.14)';
        ctx.fillRect(eb * barStep + 2, sy2, barStep - 5, 5);
      }
    }
    ctx.restore();

    // 2. Translucent 3D Highway Deck (trapezoid glass)
    var dTL = proj(0, 0), dTR = proj(1, 0);
    var dBL = proj(0, 1.12), dBR = proj(1, 1.12);
    var deckGrad = ctx.createLinearGradient(0, topY, 0, botY);
    deckGrad.addColorStop(0, 'rgba(10, 12, 28, 0.45)');
    deckGrad.addColorStop(0.55, 'rgba(12, 15, 36, 0.78)');
    deckGrad.addColorStop(1, 'rgba(18, 20, 48, 0.90)');
    ctx.fillStyle = deckGrad;
    ctx.beginPath();
    ctx.moveTo(dTL.x, dTL.y); ctx.lineTo(dTR.x, dTR.y);
    ctx.lineTo(dBR.x, dBR.y); ctx.lineTo(dBL.x, dBL.y);
    ctx.closePath();
    ctx.fill();

    // 3. Per-lane glowing beam flashes when notes hit (signature PJSK vertical light pillars!)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var l = 0; l < LANE_COUNT; l++) {
      state.laneFlashes[l] = Math.max(0, state.laneFlashes[l] - dt * 3.8);
      var fl = state.laneFlashes[l];
      if (fl <= 0.01) continue;
      var u0 = l / LANE_COUNT, u1 = (l + 1) / LANE_COUNT;
      var fTL = proj(u0, 0.05), fTR = proj(u1, 0.05);
      var fBL = proj(u0, 1.0), fBR = proj(u1, 1.0);
      var fg = ctx.createLinearGradient(0, judgeY, 0, topY);
      if (state.laneColors[l] === 'gold') {
        fg.addColorStop(0, 'rgba(253, 224, 71, ' + (fl * 0.55).toFixed(3) + ')');
        fg.addColorStop(0.4, 'rgba(251, 146, 60, ' + (fl * 0.24).toFixed(3) + ')');
        fg.addColorStop(1, 'rgba(251, 146, 60, 0)');
      } else {
        fg.addColorStop(0, 'rgba(103, 232, 249, ' + (fl * 0.52).toFixed(3) + ')');
        fg.addColorStop(0.4, 'rgba(139, 92, 246, ' + (fl * 0.24).toFixed(3) + ')');
        fg.addColorStop(1, 'rgba(139, 92, 246, 0)');
      }
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(fTL.x, fTL.y); ctx.lineTo(fTR.x, fTR.y);
      ctx.lineTo(fBR.x, fBR.y); ctx.lineTo(fBL.x, fBL.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 4. Perspective lane dividers + glowing side rails
    ctx.save();
    for (var dl = 0; dl <= LANE_COUNT; dl++) {
      var u = dl / LANE_COUNT;
      var a = proj(u, 0), b = proj(u, 1.12);
      var isEdge = dl === 0 || dl === LANE_COUNT;
      ctx.strokeStyle = isEdge ? 'rgba(167, 139, 250, 0.82)' : 'rgba(148, 163, 255, 0.24)';
      ctx.lineWidth = isEdge ? 2.4 : 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Perspective scrolling beat & bar lines
    var firstBeat = Math.floor(state.beat);
    for (var gb = firstBeat; gb <= firstBeat + Math.ceil(lookaheadBeats) + 1; gb++) {
      var z = 1 - (gb - state.beat) / lookaheadBeats;
      if (z < 0.02 || z > 1.05) continue;
      var gl = proj(0, z), gr = proj(1, z);
      var isBar = (gb % layout.beatsPerBar) === 0;
      ctx.strokeStyle = isBar ? 'rgba(226, 232, 255, 0.26)' : 'rgba(148, 163, 255, 0.09)';
      ctx.lineWidth = isBar ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(gl.x, gl.y);
      ctx.lineTo(gr.x, gr.y);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Neon Judgment Line (dual-layer cyan-magenta glow)
    ctx.save();
    var jlL = proj(0, 1), jlR = proj(1, 1);
    ctx.shadowColor = 'rgba(167, 139, 250, 0.9)';
    ctx.shadowBlur = 18;
    var jGrad = ctx.createLinearGradient(jlL.x, judgeY, jlR.x, judgeY);
    jGrad.addColorStop(0, '#c084fc');
    jGrad.addColorStop(0.25, '#67e8f9');
    jGrad.addColorStop(0.5, '#ffffff');
    jGrad.addColorStop(0.75, '#67e8f9');
    jGrad.addColorStop(1, '#c084fc');
    ctx.strokeStyle = jGrad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(jlL.x, judgeY);
    ctx.lineTo(jlR.x, judgeY);
    ctx.stroke();
    ctx.restore();

    // 6. Real millisecond-accurate acoustic note chart (or fallback loop)
    var realChart = window.MOYUAN_SCORE_CHARTS && window.MOYUAN_SCORE_CHARTS[state.pieceId];
    var lookaheadSec = 2.05;

    function drawSekaiNote(relSec, durSec, midi, isCrit, hitKey) {
      var lane = isCrit
        ? Math.max(0, Math.min(2, Math.floor((midi - 36) / 8)))
        : Math.max(3, Math.min(5, 3 + Math.floor((midi - 59) / 8)));
      var u0 = (lane + 0.06) / LANE_COUNT;
      var u1 = (lane + 0.94) / LANE_COUNT;

      // Trigger exact hit particle & PERFECT/CRITICAL popup at t = 0
      if (!audioEl.paused && relSec <= 0.025 && relSec > -0.14) {
        if (!state.hitNoteSet[hitKey]) {
          state.hitNoteSet[hitKey] = true;
          var hp = proj((u0 + u1) * 0.5, 1);
          triggerSekaiHit(lane, isCrit, hp.x, judgeY, judgeW / LANE_COUNT);
        }
      }

      if (relSec + durSec < -0.04 || relSec > lookaheadSec) return;

      // Translucent glowing Hold Ribbon for sustained notes (>= 0.45s)
      if (durSec >= 0.45) {
        var zStart = Math.min(1, 1 - relSec / lookaheadSec);
        var zEnd = Math.max(0.02, 1 - (relSec + durSec) / lookaheadSec);
        if (zStart > zEnd) {
          var hTL = proj(u0 + 0.015, zEnd), hTR = proj(u1 - 0.015, zEnd);
          var hBL = proj(u0 + 0.015, zStart), hBR = proj(u1 - 0.015, zStart);
          ctx.save();
          ctx.fillStyle = isCrit ? 'rgba(250, 204, 21, 0.30)' : 'rgba(56, 189, 248, 0.30)';
          ctx.beginPath();
          ctx.moveTo(hTL.x, hTL.y); ctx.lineTo(hTR.x, hTR.y);
          ctx.lineTo(hBR.x, hBR.y); ctx.lineTo(hBL.x, hBL.y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      var zHead = 1 - relSec / lookaheadSec;
      if (zHead < 0.02 || zHead > 1.03) return;
      var pL = proj(u0, zHead), pR = proj(u1, zHead);
      var nw = Math.max(10, pR.x - pL.x);
      var nh = Math.max(4, 15 * pL.scale);
      var nx = pL.x;
      var ny = pL.y - nh * 0.5;

      ctx.save();
      ctx.shadowColor = isCrit ? 'rgba(250, 204, 21, 0.9)' : 'rgba(56, 189, 248, 0.9)';
      ctx.shadowBlur = 12 * pL.scale;
      var ng = ctx.createLinearGradient(nx, ny, nx, ny + nh);
      if (isCrit) {
        ng.addColorStop(0, '#fef9c3');
        ng.addColorStop(0.5, '#fde047');
        ng.addColorStop(1, '#f59e0b');
      } else {
        ng.addColorStop(0, '#ffffff');
        ng.addColorStop(0.55, '#cffafe');
        ng.addColorStop(1, '#38bdf8');
      }
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.roundRect(nx, ny, nw, nh, Math.min(4, nh * 0.4));
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = isCrit ? '#ea580c' : '#0284c7';
      var capW = Math.max(2, nw * 0.08);
      ctx.fillRect(nx + 1, ny + 1, capW, nh - 2);
      ctx.fillRect(nx + nw - capW - 1, ny + 1, capW, nh - 2);
      ctx.restore();
    }

    if (realChart && realChart.length) {
      var nowSec = state.smoothTime;
      for (var ri = 0; ri < realChart.length; ri++) {
        var rn = realChart[ri]; // [tSec, durSec, midi, isBass]
        var rel = rn[0] - nowSec;
        if (rel > lookaheadSec) break;
        if (rel + rn[1] < -0.15) continue;
        var isB = rn[3] === 1;
        if ((isB && !state.showBass) || (!isB && !state.showTreble)) continue;
        drawSekaiNote(rel, rn[1], rn[2], isB, 'r:' + ri);
      }
    } else {
      var spb = 60 / state.piece.bpm;
      var cycle = Math.floor((state.rawBeats || 0) / layout.totalBeats);
      if (state.showBass) {
        layout.bass.forEach(function (nt, idx) {
          drawSekaiNote((nt.beat - state.beat) * spb, nt.dur * spb, nt.midi, true, cycle + ':b:' + idx);
        });
      }
      if (state.showTreble) {
        layout.treble.forEach(function (nt, idx) {
          drawSekaiNote((nt.beat - state.beat) * spb, nt.dur * spb, nt.midi, false, cycle + ':t:' + idx);
        });
      }
    }

    // 7. Expanding Diamond Shockwaves + Diamond Shard Particles
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var d = state.hitDiamonds.length - 1; d >= 0; d--) {
      var dm = state.hitDiamonds[d];
      dm.life -= dt;
      if (dm.life <= 0) { state.hitDiamonds.splice(d, 1); continue; }
      var prog = 1 - dm.life / dm.maxLife;
      var sz = dm.size + (dm.maxSize - dm.size) * prog;
      ctx.save();
      ctx.translate(dm.x, dm.y);
      ctx.scale(1.25, 0.62); // foreshortened on highway plane
      ctx.rotate(Math.PI * 0.25);
      ctx.strokeStyle = dm.color;
      ctx.globalAlpha = (1 - prog) * 0.85;
      ctx.lineWidth = 2.4 * (1 - prog * 0.5);
      ctx.strokeRect(-sz * 0.5, -sz * 0.5, sz, sz);
      ctx.restore();
    }

    for (var s = state.pianoSparks.length - 1; s >= 0; s--) {
      var sp = state.pianoSparks[s];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 180 * dt;
      sp.life -= dt;
      if (sp.life <= 0) { state.pianoSparks.splice(s, 1); continue; }
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(Math.PI * 0.25);
      ctx.globalAlpha = Math.max(0, sp.life / sp.maxLife);
      ctx.fillStyle = sp.color;
      ctx.fillRect(-sp.r * 0.6, -sp.r * 0.6, sp.r * 1.2, sp.r * 1.2);
      ctx.restore();
    }
    ctx.restore();

    // 8. PERFECT / CRITICAL Judgment Popup + COMBO Counter + AUTO LIVE Badge
    if (state.judgeTimer > 0) {
      state.judgeTimer = Math.max(0, state.judgeTimer - dt);
      var jAlpha = Math.min(1, state.judgeTimer * 4);
      var jScale = 1 + Math.max(0, (state.judgeTimer - 0.45) * 1.8);
      ctx.save();
      ctx.translate(cx, judgeY - 58);
      ctx.scale(jScale, jScale);
      ctx.globalAlpha = jAlpha;
      ctx.font = 'italic 900 28px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      var tg = ctx.createLinearGradient(-70, -14, 70, 14);
      if (state.judgeColor === 'critical') {
        tg.addColorStop(0, '#fef08a');
        tg.addColorStop(0.5, '#facc15');
        tg.addColorStop(1, '#fb923c');
      } else {
        tg.addColorStop(0, '#f472b6');
        tg.addColorStop(0.5, '#e0f2fe');
        tg.addColorStop(1, '#38bdf8');
      }
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = tg;
      ctx.fillText(state.judgeText, 0, 0);
      ctx.restore();
    }

    // COMBO counter on right side (exact PJSK placement)
    if (state.combo > 0) {
      state.comboPop = Math.max(0, state.comboPop - dt * 6);
      var cX = Math.min(w - 92, cx + judgeW * 0.5 + 78);
      var cY = judgeY * 0.58;
      var cScale = 1 + state.comboPop * 0.14;
      ctx.save();
      ctx.translate(cX, cY);
      ctx.scale(cScale, cScale);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(196, 181, 253, 0.9)';
      ctx.font = '800 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('COMBO', 0, -30);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(56, 189, 248, 0.75)';
      ctx.shadowBlur = 16;
      ctx.font = '900 44px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(String(state.combo), 0, 14);
      ctx.restore();
    }

    // Score display & AUTO LIVE mint badge
    ctx.save();
    var badgeX = w - 142, badgeY = judgeY + 26;
    ctx.fillStyle = 'rgba(45, 212, 191, 0.92)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, 114, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#042f2e';
    ctx.font = '800 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('♫ AUTO LIVE', badgeX + 57, badgeY + 18);

    // Clean score counter positioned neatly below the subtitle (zero overlap!)
    ctx.textAlign = 'start';
    ctx.fillStyle = 'rgba(196, 181, 253, 0.78)';
    ctx.font = '700 12px Consolas, "SF Mono", monospace';
    ctx.fillText('SCORE  ' + String(state.scoreVal).padStart(7, '0'), Math.max(24, w * 0.045), 174);
    ctx.restore();
  }
  var PIANO_START_MIDI = 36;
  var PIANO_END_MIDI = 84;
  var IS_BLACK = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];

  function buildKeyboardGeometry(w, h) {
    var kbW = Math.min(w - 44, 1120);
    var kbH = Math.max(106, Math.min(144, h * 0.21));
    var kbX = (w - kbW) * 0.5;
    var kbY = h - kbH - 84;
    var whites = [];
    var blacks = [];
    var map = {};
    var wIdx = 0;
    for (var m = PIANO_START_MIDI; m <= PIANO_END_MIDI; m++) {
      if (IS_BLACK[m % 12]) {
        blacks.push({ midi: m, afterWhite: wIdx - 1 });
      } else {
        whites.push({ midi: m, idx: wIdx++ });
      }
    }
    var kw = kbW / whites.length;
    var bw = kw * 0.62;
    var bh = kbH * 0.61;
    whites.forEach(function (wk) {
      map[wk.midi] = { x: kbX + wk.idx * kw + 1.5, w: kw - 3, cx: kbX + (wk.idx + 0.5) * kw, black: false };
    });
    blacks.forEach(function (bk) {
      var bx = kbX + (bk.afterWhite + 1) * kw - bw * 0.5;
      map[bk.midi] = { x: bx, w: bw, cx: bx + bw * 0.5, black: true };
    });
    return { kbX: kbX, kbY: kbY, kbW: kbW, kbH: kbH, kw: kw, bw: bw, bh: bh, whites: whites, blacks: blacks, map: map };
  }

  function updatePianoKeys(layout, dt) {
    var decay = Math.exp(-dt * 11);
    var active = {};
    var realChart = window.MOYUAN_SCORE_CHARTS && window.MOYUAN_SCORE_CHARTS[state.pieceId];
    if (!audioEl.paused) {
      if (realChart && realChart.length) {
        var nowT = state.smoothTime;
        for (var r = 0; r < realChart.length; r++) {
          var rn = realChart[r]; // [tSec, durSec, midi, isBass]
          if (rn[0] > nowT + 0.02) break;
          if (nowT >= rn[0] - 0.02 && nowT < rn[0] + rn[1]) {
            var isB = rn[3] === 1;
            if ((isB && state.showBass) || (!isB && state.showTreble)) {
              active[rn[2]] = isB ? 'bass' : 'treble';
            }
          }
        }
      } else {
        var b = state.beat;
        if (state.showTreble) {
          for (var i = 0; i < layout.treble.length; i++) {
            var nt = layout.treble[i];
            if (b >= nt.beat && b < nt.beat + Math.max(0.28, nt.dur * 0.92)) active[nt.midi] = 'treble';
          }
        }
        if (state.showBass) {
          for (var j = 0; j < layout.bass.length; j++) {
            var nb = layout.bass[j];
            if (b >= nb.beat && b < nb.beat + Math.max(0.28, nb.dur * 0.92)) {
              if (!active[nb.midi]) active[nb.midi] = 'bass';
            }
          }
        }
      }
    }
    for (var m = PIANO_START_MIDI; m <= PIANO_END_MIDI; m++) {
      var cur = state.keyStates[m] || { press: 0, voice: 'treble', wasActive: false };
      if (active[m]) {
        if (!cur.wasActive && state.viewMode === 'rhythm') {
          spawnKeySparks(m, active[m]);
        }
        cur.press = Math.min(1, cur.press + dt * 26);
        cur.voice = active[m];
        cur.wasActive = true;
      } else {
        cur.press *= decay;
        if (cur.press < 0.01) cur.press = 0;
        cur.wasActive = false;
      }
      state.keyStates[m] = cur;
    }
  }

  function spawnKeySparks(midi, voice) {
    if (state.pianoSparks.length > 90) return;
    var geo = buildKeyboardGeometry(state.w, state.h);
    var k = geo.map[midi];
    if (!k) return;
    var col = voice === 'treble' ? '#c4b5fd' : '#fdba74';
    for (var i = 0; i < 6; i++) {
      state.pianoSparks.push({
        x: k.cx + (Math.random() - 0.5) * k.w * 0.7,
        y: geo.kbY - 2,
        vx: (Math.random() - 0.5) * 42,
        vy: -(48 + Math.random() * 88),
        life: 0.45 + Math.random() * 0.45,
        maxLife: 0.9,
        r: 1.4 + Math.random() * 2.2,
        color: col
      });
    }
  }

  function drawRhythmStage(layout, dt) {
    var w = state.w;
    var h = state.h;
    var geo = buildKeyboardGeometry(w, h);
    var kbX = geo.kbX, kbY = geo.kbY, kbW = geo.kbW, kbH = geo.kbH;

    // 1. Deep velvet concert-hall night backdrop
    var bg = ctx.createRadialGradient(w * 0.5, kbY * 0.55, 20, w * 0.5, kbY * 0.6, Math.max(w, h) * 0.8);
    bg.addColorStop(0, '#1e1b29');
    bg.addColorStop(0.5, '#121118');
    bg.addColorStop(1, '#08080c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // 2. Subtle vertical octave & key-lane guide lines + horizontal beat grid
    ctx.save();
    for (var i = 0; i < geo.whites.length; i++) {
      var wk = geo.whites[i];
      var lx = kbX + i * geo.kw;
      var isC = (wk.midi % 12) === 0;
      ctx.strokeStyle = isC ? 'rgba(255, 245, 230, 0.085)' : 'rgba(255, 245, 230, 0.024)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, kbY);
      ctx.stroke();
    }

    // Subtle scrolling beat lines
    var lookaheadBeats = 6.5;
    var pxPerBeat = kbY / lookaheadBeats;
    var firstBeat = Math.floor(state.beat);
    for (var gb = firstBeat; gb <= firstBeat + Math.ceil(lookaheadBeats) + 1; gb++) {
      var dy = (gb - state.beat) * pxPerBeat;
      var gy = kbY - dy;
      if (gy < 0 || gy > kbY) continue;
      var isBar = (gb % layout.beatsPerBar) === 0;
      ctx.strokeStyle = isBar ? 'rgba(255, 245, 230, 0.09)' : 'rgba(255, 245, 230, 0.03)';
      ctx.lineWidth = isBar ? 1.2 : 1;
      ctx.beginPath();
      ctx.moveTo(kbX, gy);
      ctx.lineTo(kbX + kbW, gy);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Falling luminous note bars (loop-seamless across totalBeats)
    function drawVoiceBars(notes, voice) {
      var isTr = voice === 'treble';
      for (var pass = 0; pass < 2; pass++) {
        var beatOffset = pass * layout.totalBeats;
        for (var n = 0; n < notes.length; n++) {
          var nt = notes[n];
          var relStart = (nt.beat + beatOffset) - state.beat;
          var relEnd = relStart + Math.max(0.24, nt.dur * 0.92);
          if (relEnd < -0.1 || relStart > lookaheadBeats + 0.5) continue;
          var k = geo.map[nt.midi];
          if (!k) continue;

          var yBottom = kbY - relStart * pxPerBeat;
          var yTop = kbY - relEnd * pxPerBeat;
          var clampedBottom = Math.min(kbY, yBottom);
          var clampedTop = Math.max(-20, yTop);
          var barH = clampedBottom - clampedTop;
          if (barH <= 1) continue;

          var hit = relStart <= 0.05 && relEnd >= 0;
          var barX = k.x + (k.black ? 0.5 : 1.5);
          var barW = Math.max(4, k.w - (k.black ? 1 : 3));
          var radius = Math.min(6, barW * 0.4, barH * 0.45);

          ctx.save();
          if (hit) {
            ctx.shadowColor = isTr ? 'rgba(167, 139, 250, 0.95)' : 'rgba(251, 146, 60, 0.95)';
            ctx.shadowBlur = 18;
          } else {
            ctx.shadowColor = isTr ? 'rgba(139, 92, 246, 0.45)' : 'rgba(234, 88, 12, 0.45)';
            ctx.shadowBlur = 8;
          }

          var grad = ctx.createLinearGradient(barX, clampedTop, barX, clampedBottom);
          if (isTr) {
            grad.addColorStop(0, k.black ? '#7c3aed' : '#8b5cf6');
            grad.addColorStop(0.75, k.black ? '#a78bfa' : '#c4b5fd');
            grad.addColorStop(1, '#f5f3ff');
          } else {
            grad.addColorStop(0, k.black ? '#c2410c' : '#ea580c');
            grad.addColorStop(0.75, k.black ? '#fb923c' : '#fdba74');
            grad.addColorStop(1, '#fff7ed');
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(barX, clampedTop, barW, barH, radius);
          ctx.fill();

          // Glossy inner specular edge
          ctx.shadowBlur = 0;
          ctx.strokeStyle = hit ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    if (state.showBass) drawVoiceBars(layout.bass, 'bass');
    if (state.showTreble) drawVoiceBars(layout.treble, 'treble');

    // 4. Rising luminous sparks from struck keys
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var s = state.pianoSparks.length - 1; s >= 0; s--) {
      var sp = state.pianoSparks[s];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy *= Math.exp(-dt * 2.2);
      sp.life -= dt;
      if (sp.life <= 0) {
        state.pianoSparks.splice(s, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, sp.life / sp.maxLife);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5. Glowing hit-line horizon right above the piano keys
    ctx.save();
    var lineGrad = ctx.createLinearGradient(kbX, kbY, kbX + kbW, kbY);
    lineGrad.addColorStop(0, 'rgba(251, 146, 60, 0.15)');
    lineGrad.addColorStop(0.35, 'rgba(251, 146, 60, 0.65)');
    lineGrad.addColorStop(0.65, 'rgba(167, 139, 250, 0.65)');
    lineGrad.addColorStop(1, 'rgba(167, 139, 250, 0.15)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(kbX, kbY - 1);
    ctx.lineTo(kbX + kbW, kbY - 1);
    ctx.stroke();
    ctx.restore();

    // 6. Glossy concert grand piano keyboard
    drawVirtualPiano(geo);
  }

  function drawVirtualPiano(geo) {
    var kbX = geo.kbX, kbY = geo.kbY, kbW = geo.kbW, kbH = geo.kbH, kw = geo.kw, bw = geo.bw, bh = geo.bh;

    ctx.save();
    var padX = 14;
    var topRail = 10;
    ctx.fillStyle = '#0e0d10';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = -4;
    ctx.beginPath();
    ctx.roundRect(kbX - padX, kbY - topRail, kbW + padX * 2, kbH + topRail + 8, 10);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Crimson felt strip
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(kbX, kbY - 2.5, kbW, 3);

    // Ivory white keys
    for (var i = 0; i < geo.whites.length; i++) {
      var wk = geo.whites[i];
      var ks = state.keyStates[wk.midi];
      var press = ks ? ks.press : 0;
      var x = kbX + i * kw;
      var yOff = press * 4.5;
      var keyH = kbH - yOff;

      var wg = ctx.createLinearGradient(x, kbY, x, kbY + kbH);
      if (press > 0.05) {
        var isTr = ks.voice === 'treble';
        wg.addColorStop(0, isTr ? '#e0d6ff' : '#ffe6c4');
        wg.addColorStop(0.55, isTr ? '#c4b5fd' : '#fdba74');
        wg.addColorStop(1, isTr ? '#8b5cf6' : '#ea580c');
      } else {
        wg.addColorStop(0, '#dcd7cf');
        wg.addColorStop(0.12, '#f8f5ef');
        wg.addColorStop(0.88, '#ece7de');
        wg.addColorStop(1, '#cec7bb');
      }
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.roundRect(x + 0.6, kbY + yOff, kw - 1.2, keyH, [0, 0, 4, 4]);
      ctx.fill();

      ctx.fillStyle = press > 0.05 ? 'rgba(0,0,0,0.2)' : 'rgba(30,26,22,0.28)';
      ctx.fillRect(x + 0.6, kbY + kbH - 3.5, kw - 1.2, 3.5);

      if (press > 0.08) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var glowCol = ks.voice === 'treble' ? 'rgba(167,139,250,' : 'rgba(251,146,60,';
        var ug = ctx.createRadialGradient(x + kw * 0.5, kbY + 6, 2, x + kw * 0.5, kbY - 10, kw * 2.4);
        ug.addColorStop(0, glowCol + (press * 0.65).toFixed(3) + ')');
        ug.addColorStop(1, glowCol + '0)');
        ctx.fillStyle = ug;
        ctx.beginPath();
        ctx.arc(x + kw * 0.5, kbY, kw * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Ebony black keys
    for (var j = 0; j < geo.blacks.length; j++) {
      var bk = geo.blacks[j];
      var bks = state.keyStates[bk.midi];
      var bPress = bks ? bks.press : 0;
      var bx = kbX + (bk.afterWhite + 1) * kw - bw * 0.5;
      var byOff = bPress * 3.4;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.beginPath();
      ctx.roundRect(bx + 1.5, kbY + byOff + 2, bw, bh, [0, 0, 3, 3]);
      ctx.fill();

      var bg = ctx.createLinearGradient(bx, kbY, bx, kbY + bh);
      if (bPress > 0.05) {
        var bTr = bks.voice === 'treble';
        bg.addColorStop(0, bTr ? '#7c3aed' : '#c2410c');
        bg.addColorStop(0.7, bTr ? '#a78bfa' : '#fb923c');
        bg.addColorStop(1, bTr ? '#ede9fe' : '#ffedd5');
      } else {
        bg.addColorStop(0, '#2c292b');
        bg.addColorStop(0.18, '#161417');
        bg.addColorStop(0.84, '#0b0a0c');
        bg.addColorStop(1, '#262328');
      }
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(bx, kbY + byOff, bw, bh - byOff * 0.3, [0, 0, 3, 3]);
      ctx.fill();

      ctx.fillStyle = bPress > 0.05 ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.11)';
      ctx.fillRect(bx + 2, kbY + byOff + 2, bw - 4, 2);
    }
    ctx.restore();
  }

  audioEl.addEventListener('loadedmetadata', updateTimeUI);
  audioEl.addEventListener('ended', function () { pausePlayback(); });

  elPlayBtn.addEventListener('click', function () {
    if (audioEl.paused) startPlayback();
    else pausePlayback();
  });

  if (elStartBtn) elStartBtn.addEventListener('click', startPlayback);
  canvas.addEventListener('click', function () {
    if (audioEl.paused) startPlayback();
    else pausePlayback();
  });

  elRestartBtn.addEventListener('click', function () {
    audioEl.currentTime = 0;
    state.trebleTrail = [];
    state.bassTrail = [];
    startPlayback();
  });

  pieceBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      loadPiece(btn.dataset.piece, true);
    });
  });

  elSpeedBtn.addEventListener('click', function () {
    state.speedIdx = (state.speedIdx + 1) % state.speeds.length;
    state.speed = state.speeds[state.speedIdx];
    audioEl.playbackRate = state.speed;
    elSpeedBtn.textContent = state.speed.toFixed(state.speed === 1 ? 1 : 2) + 'x';
  });

  elVolume.addEventListener('input', function () {
    audioEl.volume = Math.max(0, Math.min(1, Number(elVolume.value) / 100));
  });

  elToggleTreble.addEventListener('click', function () {
    state.showTreble = !state.showTreble;
    elToggleTreble.classList.toggle('is-on', state.showTreble);
    elToggleTreble.setAttribute('aria-pressed', String(state.showTreble));
  });

  elToggleBass.addEventListener('click', function () {
    state.showBass = !state.showBass;
    elToggleBass.classList.toggle('is-on', state.showBass);
    elToggleBass.setAttribute('aria-pressed', String(state.showBass));
  });

  elToggleTilt.addEventListener('click', function () {
    state.tilted = !state.tilted;
    elToggleTilt.textContent = state.tilted ? '斜角视角' : '正视视角';
  });

  if (elTogglePiano) {
    var MODES = [
      { id: 'rhythm', label: 'PJSK 3D 音游' },
      { id: 'concert', label: '立体演奏台' },
      { id: 'staff', label: '纯五线谱' }
    ];
    elTogglePiano.addEventListener('click', function () {
      var idx = MODES.findIndex(function (m) { return m.id === state.viewMode; });
      var next = MODES[(idx + 1) % MODES.length];
      state.viewMode = next.id;
      elTogglePiano.textContent = next.label;
      elTogglePiano.classList.toggle('is-on', next.id !== 'staff');
      elTogglePiano.setAttribute('aria-pressed', String(next.id !== 'staff'));
    });
  }

  function scrubAt(clientX) {
    var dur = Number.isFinite(audioEl.duration) && audioEl.duration > 0 ? audioEl.duration : 0;
    if (!dur) return;
    var rect = elProgress.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    audioEl.currentTime = ratio * dur;
    state.trebleTrail = [];
    state.bassTrail = [];
    updateTimeUI();
  }

  var dragging = false;
  elProgress.addEventListener('pointerdown', function (e) {
    dragging = true;
    elProgress.setPointerCapture(e.pointerId);
    scrubAt(e.clientX);
  });
  elProgress.addEventListener('pointermove', function (e) { if (dragging) scrubAt(e.clientX); });
  elProgress.addEventListener('pointerup', function () { dragging = false; });
  elProgress.addEventListener('pointercancel', function () { dragging = false; });

  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && !/INPUT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName || '')) {
      e.preventDefault();
      if (audioEl.paused) startPlayback();
      else pausePlayback();
    }
  });

  window.addEventListener('resize', resize);
  resize();
  loadPiece('lalapiano', false);
  requestAnimationFrame(render);
})();
