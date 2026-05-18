(function () {
  var api = {};
  var SolverCube = window.Cube;
  var solverReady = false;
  var busy = false;
  var lastMoves = '';
  var moveCount = 0;

  function post(type, detail) {
    window.parent.postMessage({ source: 'moyuan-cube3d', type: type, detail: detail || {} }, '*');
  }

  function waitForGame() {
    return new Promise(function (resolve) {
      if (window.game) { resolve(window.game); return; }
      var t = window.setInterval(function () {
        if (!window.game) return;
        window.clearInterval(t);
        resolve(window.game);
      }, 60);
    });
  }

  function silenceTimer(game) {
    try { game.timer.stop(); } catch (e) {}
    try { game.timer.reset(); } catch (e) {}
    try {
      game.dom.texts.timer.innerHTML = '';
      game.dom.texts.timer.style.opacity = 0;
      game.dom.texts.timer.style.display = 'none';
      window.localStorage.removeItem('theCube_time');
    } catch (e) {}
  }

  function coordKey(x, y, z) { return [x, y, z].join(','); }

  var faceletSlots = {
    U: [[-1,1,-1],[0,1,-1],[1,1,-1],[-1,1,0],[0,1,0],[1,1,0],[-1,1,1],[0,1,1],[1,1,1]],
    R: [[1,1,1],[1,1,0],[1,1,-1],[1,0,1],[1,0,0],[1,0,-1],[1,-1,1],[1,-1,0],[1,-1,-1]],
    F: [[-1,1,1],[0,1,1],[1,1,1],[-1,0,1],[0,0,1],[1,0,1],[-1,-1,1],[0,-1,1],[1,-1,1]],
    D: [[-1,-1,1],[0,-1,1],[1,-1,1],[-1,-1,0],[0,-1,0],[1,-1,0],[-1,-1,-1],[0,-1,-1],[1,-1,-1]],
    L: [[-1,1,-1],[-1,1,0],[-1,1,1],[-1,0,-1],[-1,0,0],[-1,0,1],[-1,-1,-1],[-1,-1,0],[-1,-1,1]],
    B: [[1,1,-1],[0,1,-1],[-1,1,-1],[1,0,-1],[0,0,-1],[-1,0,-1],[1,-1,-1],[0,-1,-1],[-1,-1,-1]]
  };

  function faceFromPosition(p) {
    var x = Math.abs(p.x), y = Math.abs(p.y), z = Math.abs(p.z);
    if (y >= x && y >= z) return p.y > 0 ? 'U' : 'D';
    if (x >= y && x >= z) return p.x > 0 ? 'R' : 'L';
    return p.z > 0 ? 'F' : 'B';
  }

  function normalizedStickerPosition(game, edge) {
    var cubeQ = game.cube.object.getWorldQuaternion(new THREE.Quaternion()).inverse();
    var normal = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(edge.getWorldQuaternion(new THREE.Quaternion()))
      .applyQuaternion(cubeQ);
    var center = game.cube.object
      .worldToLocal(edge.parent.localToWorld(new THREE.Vector3(0, 0, 0)))
      .multiplyScalar(3);
    var face = faceFromPosition(normal);
    var x = Math.round(center.x), y = Math.round(center.y), z = Math.round(center.z);
    if (face === 'U') y = 1; if (face === 'D') y = -1;
    if (face === 'R') x = 1; if (face === 'L') x = -1;
    if (face === 'F') z = 1; if (face === 'B') z = -1;
    return { face: face, x: Math.max(-1,Math.min(1,x)), y: Math.max(-1,Math.min(1,y)), z: Math.max(-1,Math.min(1,z)) };
  }

  function visualFaceletString(game) {
    var faces = { U:{}, R:{}, F:{}, D:{}, L:{}, B:{} }, duplicates = [];
    game.cube.edges.forEach(function (edge) {
      var p = normalizedStickerPosition(game, edge);
      var key = coordKey(p.x, p.y, p.z);
      if (faces[p.face][key]) duplicates.push(p.face + ':' + key);
      faces[p.face][key] = edge.name;
    });
    var missing = [];
    var facelets = ['U','R','F','D','L','B'].map(function (face) {
      return faceletSlots[face].map(function (slot) {
        var v = faces[face][coordKey(slot[0], slot[1], slot[2])];
        if (!v) missing.push(face + ':' + slot.join(','));
        return v;
      }).join('');
    }).join('');
    if (missing.length || duplicates.length)
      throw new Error('facelet mismatch missing=' + missing.join('|') + ' duplicates=' + duplicates.join('|'));
    return facelets;
  }

  function cleanMoves(s) {
    return String(s || '').trim().split(/\s+/).filter(Boolean).join(' ');
  }

  // 播放算法动画，等原引擎 scramble 队列清空后 resolve
  function playAlgorithm(game, algorithm, label) {
    algorithm = cleanMoves(algorithm);
    if (!algorithm) {
      busy = false;
      game.controls.enable();
      post('status', { text: '已复原', moves: '-', busy: false, restored: true });
      return Promise.resolve('');
    }
    lastMoves = algorithm;
    silenceTimer(game);
    var isRestore = label && label.indexOf('复原') > -1;
    var steps = algorithm.split(' ');
    var total = steps.length;
    post('status', { text: label || '执行中', moves: algorithm, busy: true });
    if (isRestore) post('progress', { steps: steps, current: -1 });
    game.controls.disable();
    game.scrambler.scramble(algorithm);
    game.controls.scrambleCube();

    return new Promise(function (resolve) {
      var startedAt = Date.now();
      var expected = Math.max(1500, game.scrambler.converted.length * game.controls.flipSpeeds[0] + 1200);
      var started = false;
      var lastRemaining = total;
      var watcher = window.setInterval(function () {
        if (!started) {
          if (game.controls.scramble) { started = true; }
          else return; // 未开始前不判断 done，避免误判
        }
        // 追踪进度
        if (isRestore && game.controls.scramble && game.controls.scramble.converted) {
          var remaining = game.controls.scramble.converted.length;
          if (remaining !== lastRemaining) {
            lastRemaining = remaining;
            post('progress', { steps: steps, current: total - remaining - 1 });
          }
        }
        var done = !game.controls.scramble;
        var timedOut = Date.now() - startedAt > expected;
        if (!done && !timedOut) return;
        window.clearInterval(watcher);
        requestAnimationFrame(function () {
          busy = false;
          game.controls.enable();
          if (isRestore) {
            moveCount = 0;
            post('move', { count: 0 });
            post('progress', { steps: steps, current: total - 1 });
          }
          post('status', {
            text: isRestore ? '复原完成！双击重新打乱或继续手动还原' : (label || '') + '完成',
            moves: lastMoves,
            busy: false,
            restored: isRestore
          });
          resolve(algorithm);
        });
      }, 80);
    });
  }

  function ensureSolver() {
    if (solverReady) return Promise.resolve();
    post('status', { text: '初始化 Kociemba 表', moves: lastMoves, busy: true });
    return new Promise(function (resolve) {
      window.setTimeout(function () { SolverCube.initSolver(); solverReady = true; resolve(); }, 30);
    });
  }

  api.reset = function () {
    window.location.reload();
  };

  api.solve = function () {
    if (busy) {
      post('status', { text: '动画执行中，稍后再操作', moves: lastMoves, busy: true });
      return Promise.resolve('');
    }
    busy = true;
    return waitForGame().then(function (game) {
      // 等 3 帧确保所有 tween onComplete 已执行，piece 矩阵稳定
      return new Promise(function (resolve) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { resolve(game); });
          });
        });
      });
    }).then(function (game) {
      var cube;
      try {
        cube = SolverCube.fromString(visualFaceletString(game));
      } catch (e) {
        busy = false;
        post('status', { text: '读取状态失败，请复位后重试', moves: '-', busy: false });
        return '';
      }
      if (cube.isSolved()) {
        busy = false;
        post('status', { text: '已经是复原状态', moves: '-', busy: false });
        return '';
      }
      return ensureSolver().then(function () {
        post('status', { text: '两阶段搜索中', moves: lastMoves, busy: true });
        return new Promise(function (resolve) {
          window.setTimeout(function () {
            try {
              var solution = cleanMoves(cube.solve());
              if (!solution) {
                busy = false;
                post('status', { text: '已经是复原状态', moves: '-', busy: false });
                resolve(''); return;
              }
              playAlgorithm(game, solution, 'Kociemba 复原').then(resolve);
            } catch (e) {
              busy = false;
              post('status', { text: '复原失败，请复位后重试', moves: '-', busy: false });
              resolve('');
            }
          }, 20);
        });
      });
    });
  };

  api.setSpeed = function (value) {
    return waitForGame().then(function (game) {
      game.controls.flipSpeeds[0] = Math.max(20, Number(value) || 90);
    });
  };

  api.isBusy = function () { return busy; };

  waitForGame().then(function (game) {
    silenceTimer(game);
    // 手动转面计数（busy 时是算法动画，不计入）
    game.controls.onMove = function () {
      if (busy) return;
      moveCount++;
      post('move', { count: moveCount });
    };
    post('ready', { text: '双击魔方开始打乱', moves: '-', busy: false });
    // 监听原引擎 state 变化
    var prevState = game.state;
    window.setInterval(function () {
      if (game.state === prevState) return;
      prevState = game.state;
      if (game.state !== 2) silenceTimer(game); // COMPLETE(2) 时不 reset，保留 deltaTime 供 addScore 使用
      if (game.state === 1) { // PLAYING：打乱完成
        moveCount = 0;
        var moves = (game.scrambler && game.scrambler.print) || '-';
        post('status', { text: '打乱完成，可手动还原或点算法复原', moves: moves, busy: false });
      }
      if (game.state === 0) { // MENU：回到初始
        post('status', { text: '双击魔方开始打乱', moves: '-', busy: false });
      }
    }, 200);
  });

  window.MoyuanCube = api;
})();
