(function () {
  "use strict";

  var COLS = 10;
  var ROWS = 20;
  var BLOCK = 30;
  var COLORS = {
    I: "#52d6f2",
    J: "#6f7bff",
    L: "#ffd76d",
    O: "#ffb35c",
    S: "#68e0a5",
    T: "#b497ff",
    Z: "#ff87bb"
  };
  var SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    O: [[1, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]]
  };
  var SCORE_TABLE = [0, 100, 300, 700, 1500];
  var RUN_SPEEDS = [800, 650, 500, 370, 250, 160];
  var DIFFICULTY_OFFSET = {
    relaxed: -1,
    standard: 0,
    chaos: 1
  };

  var boardCanvas = document.getElementById("board");
  var boardCtx = boardCanvas.getContext("2d");
  var nextCanvas = document.getElementById("next");
  var nextCtx = nextCanvas.getContext("2d");
  var holdCanvas = document.getElementById("hold");
  var holdCtx = holdCanvas.getContext("2d");
  var effects = document.getElementById("effects");
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var linesEl = document.getElementById("lines");
  var levelEl = document.getElementById("level");
  var comboEl = document.getElementById("combo");
  var statusEl = document.getElementById("status");
  var messageEl = document.getElementById("message");
  var difficultyEl = document.getElementById("difficulty");
  var pauseBtn = document.getElementById("pause");
  var bestKey = "moyuan-rikka-tetris-best";
  var holdTimer = null;
  var heldAction = null;

  var state;

  function createState() {
    return {
      board: Array.from({ length: ROWS }, function () { return Array(COLS).fill(null); }),
      bag: [],
      queue: [],
      current: null,
      hold: null,
      canHold: true,
      score: 0,
      best: Number(localStorage.getItem(bestKey) || 0),
      lines: 0,
      level: 1,
      combo: 0,
      running: false,
      paused: false,
      over: false,
      lastTime: 0,
      dropCounter: 0
    };
  }

  function shuffle(items) {
    var copy = items.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function nextType() {
    if (!state.bag.length) state.bag = shuffle(Object.keys(SHAPES));
    return state.bag.pop();
  }

  function cloneMatrix(matrix) {
    return matrix.map(function (row) { return row.slice(); });
  }

  function makePiece(type) {
    var matrix = cloneMatrix(SHAPES[type]);
    return {
      type: type,
      matrix: matrix,
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: type === "I" ? -1 : 0
    };
  }

  function refillQueue() {
    while (state.queue.length < 4) state.queue.push(nextType());
  }

  function getStatusText() {
    if (!state) return "READY";
    if (state.over) return "GAME OVER";
    if (state.paused) return "PAUSED";
    if (state.running) return "RUNNING";
    return "READY";
  }

  function postTetrisState() {
    if (!state || window.parent === window) return;
    window.parent.postMessage({
      type: "tetris-state",
      payload: {
        score: state.score,
        best: state.best,
        lines: state.lines,
        level: state.level,
        combo: state.combo,
        next: state.queue[0] || null,
        hold: state.hold || null,
        running: state.running,
        paused: state.paused,
        over: state.over,
        status: getStatusText(),
        difficulty: difficultyEl ? difficultyEl.value : "standard"
      }
    }, "*");
  }

  function spawn() {
    refillQueue();
    state.current = makePiece(state.queue.shift());
    refillQueue();
    state.canHold = true;
    if (collides(state.current.matrix, state.current.x, state.current.y)) {
      state.over = true;
      state.running = false;
      showMessage("封印解除", "最终得分 " + state.score + "。点击重新开始再签一次契约。", "再来一局", restart);
      setStatus("GAME OVER");
    }
  }

  function collides(matrix, ox, oy) {
    for (var y = 0; y < matrix.length; y += 1) {
      for (var x = 0; x < matrix[y].length; x += 1) {
        if (!matrix[y][x]) continue;
        var px = ox + x;
        var py = oy + y;
        if (px < 0 || px >= COLS || py >= ROWS) return true;
        if (py >= 0 && state.board[py][px]) return true;
      }
    }
    return false;
  }

  function rotateMatrix(matrix) {
    var size = matrix.length;
    var next = Array.from({ length: size }, function () { return Array(size).fill(0); });
    for (var y = 0; y < size; y += 1) {
      for (var x = 0; x < size; x += 1) {
        next[x][size - 1 - y] = matrix[y][x];
      }
    }
    return next;
  }

  function rotate() {
    if (!canPlay() || state.current.type === "O") return;
    var rotated = rotateMatrix(state.current.matrix);
    var kicks = [0, -1, 1, -2, 2];
    for (var i = 0; i < kicks.length; i += 1) {
      var nx = state.current.x + kicks[i];
      if (!collides(rotated, nx, state.current.y)) {
        state.current.matrix = rotated;
        state.current.x = nx;
        render();
        return;
      }
    }
  }

  function move(dir) {
    if (!canPlay()) return;
    if (!collides(state.current.matrix, state.current.x + dir, state.current.y)) {
      state.current.x += dir;
      render();
    }
  }

  function softDrop() {
    if (!canPlay()) return;
    if (!collides(state.current.matrix, state.current.x, state.current.y + 1)) {
      state.current.y += 1;
      render();
      return;
    }
    lockPiece();
  }

  function hardDrop() {
    if (!canPlay()) return;
    var distance = 0;
    while (!collides(state.current.matrix, state.current.x, state.current.y + 1)) {
      state.current.y += 1;
      distance += 1;
    }
    if (distance > 0) state.dropCounter = 0;
    lockPiece();
  }

  function holdPiece() {
    if (!canPlay() || !state.canHold) return;
    var held = state.hold;
    state.hold = state.current.type;
    state.current = held ? makePiece(held) : null;
    state.canHold = false;
    if (!state.current) spawn();
    render();
  }

  function lockPiece() {
    var piece = state.current;
    piece.matrix.forEach(function (row, y) {
      row.forEach(function (value, x) {
        if (!value) return;
        var py = piece.y + y;
        var px = piece.x + x;
        if (py >= 0) state.board[py][px] = piece.type;
      });
    });
    clearLines();
    spawn();
    updateHud();
    render();
  }

  function clearLines() {
    var clearedRows = [];
    for (var y = ROWS - 1; y >= 0; y -= 1) {
      if (state.board[y].every(Boolean)) {
        clearedRows.push(y);
        state.board.splice(y, 1);
        state.board.unshift(Array(COLS).fill(null));
        y += 1;
      }
    }
    if (!clearedRows.length) {
      state.combo = 0;
      return;
    }
    state.lines += clearedRows.length;
    state.level = Math.min(6, Math.floor(state.lines / 20) + 1);
    state.combo += 1;
    state.score += SCORE_TABLE[clearedRows.length];
    flashLines(clearedRows);
  }

  function flashLines(rows) {
    effects.innerHTML = "";
    rows.forEach(function (row) {
      var flash = document.createElement("div");
      flash.className = "line-flash";
      flash.style.top = (row * 5) + "%";
      effects.appendChild(flash);
    });
    window.setTimeout(function () { effects.innerHTML = ""; }, 420);
  }

  function getInterval() {
    var offset = DIFFICULTY_OFFSET[difficultyEl.value] || 0;
    var index = Math.max(0, Math.min(RUN_SPEEDS.length - 1, state.level - 1 + offset));
    return RUN_SPEEDS[index];
  }

  function canPlay() {
    return state.running && !state.paused && !state.over && state.current;
  }

  function setStatus(text) {
    statusEl.textContent = text;
    postTetrisState();
  }

  function updateHud() {
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(bestKey, String(state.best));
    }
    scoreEl.textContent = state.score;
    bestEl.textContent = state.best;
    linesEl.textContent = state.lines;
    levelEl.textContent = state.level;
    comboEl.textContent = state.combo;
    postTetrisState();
  }

  function drawCell(ctx, x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    var radius = Math.max(3, size * 0.14);
    var grad = ctx.createLinearGradient(x, y, x + size, y + size);
    grad.addColorStop(0, lighten(color, 0.24));
    grad.addColorStop(0.45, color);
    grad.addColorStop(1, darken(color, 0.2));
    ctx.fillStyle = grad;
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 0.28;
    roundRect(ctx, x + 1, y + 1, size - 2, size - 2, radius);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.38)";
    ctx.lineWidth = Math.max(1, size * 0.05);
    roundRect(ctx, x + 2.5, y + 2.5, size - 5, size - 5, Math.max(2, radius * 0.72));
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.34)";
    roundRect(ctx, x + 4, y + 4, size - 9, Math.max(3, size * 0.18), Math.max(2, size * 0.08));
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(x + size * 0.68, y + size * 0.3, Math.max(1.4, size * 0.055), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(20,8,42,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.18, y + size * 0.78);
    ctx.lineTo(x + size * 0.8, y + size * 0.18);
    ctx.stroke();
    ctx.restore();
  }

  function hexToRgb(hex) {
    var normalized = hex.replace("#", "");
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16)
    };
  }

  function mixColor(hex, target, amount) {
    var rgb = hexToRgb(hex);
    var tr = target === "white" ? 255 : 0;
    var tg = target === "white" ? 255 : 0;
    var tb = target === "white" ? 255 : 0;
    var r = Math.round(rgb.r + (tr - rgb.r) * amount);
    var g = Math.round(rgb.g + (tg - rgb.g) * amount);
    var b = Math.round(rgb.b + (tb - rgb.b) * amount);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function lighten(hex, amount) {
    return mixColor(hex, "white", amount);
  }

  function darken(hex, amount) {
    return mixColor(hex, "black", amount);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawGrid() {
    boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    var grad = boardCtx.createLinearGradient(0, 0, boardCanvas.width, boardCanvas.height);
    grad.addColorStop(0, "#1b0d31");
    grad.addColorStop(0.55, "#241646");
    grad.addColorStop(1, "#12081f");
    boardCtx.fillStyle = grad;
    boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

    boardCtx.fillStyle = "rgba(255,255,255,0.035)";
    for (var s = 0; s < 26; s += 1) {
      var sx = (s * 47) % boardCanvas.width;
      var sy = (s * 83) % boardCanvas.height;
      boardCtx.beginPath();
      boardCtx.moveTo(sx, sy - 3);
      boardCtx.lineTo(sx + 2, sy);
      boardCtx.lineTo(sx, sy + 3);
      boardCtx.lineTo(sx - 2, sy);
      boardCtx.closePath();
      boardCtx.fill();
    }

    boardCtx.strokeStyle = "rgba(180,151,255,0.14)";
    boardCtx.lineWidth = 1;
    for (var x = 0; x <= COLS; x += 1) {
      boardCtx.beginPath();
      boardCtx.moveTo(x * BLOCK + 0.5, 0);
      boardCtx.lineTo(x * BLOCK + 0.5, boardCanvas.height);
      boardCtx.stroke();
    }
    for (var y = 0; y <= ROWS; y += 1) {
      boardCtx.beginPath();
      boardCtx.moveTo(0, y * BLOCK + 0.5);
      boardCtx.lineTo(boardCanvas.width, y * BLOCK + 0.5);
      boardCtx.stroke();
    }
  }

  function drawBoard() {
    state.board.forEach(function (row, y) {
      row.forEach(function (type, x) {
        if (type) drawCell(boardCtx, x * BLOCK, y * BLOCK, BLOCK, COLORS[type], 0.92);
      });
    });
  }

  function drawPiece(piece, ghost) {
    if (!piece) return;
    piece.matrix.forEach(function (row, y) {
      row.forEach(function (value, x) {
        if (!value) return;
        var py = piece.y + y;
        if (py < 0) return;
        drawCell(boardCtx, (piece.x + x) * BLOCK, py * BLOCK, BLOCK, COLORS[piece.type], ghost ? 0.22 : 1);
      });
    });
  }

  function ghostPiece() {
    if (!state.current) return null;
    var ghost = {
      type: state.current.type,
      matrix: state.current.matrix,
      x: state.current.x,
      y: state.current.y
    };
    while (!collides(ghost.matrix, ghost.x, ghost.y + 1)) ghost.y += 1;
    return ghost;
  }

  function drawMini(ctx, canvas, type) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(12,6,28,0.36)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!type) return;
    var matrix = SHAPES[type];
    var size = 22;
    var cells = [];
    matrix.forEach(function (row, y) {
      row.forEach(function (value, x) {
        if (value) cells.push({ x: x, y: y });
      });
    });
    var minX = Math.min.apply(null, cells.map(function (c) { return c.x; }));
    var maxX = Math.max.apply(null, cells.map(function (c) { return c.x; }));
    var minY = Math.min.apply(null, cells.map(function (c) { return c.y; }));
    var maxY = Math.max.apply(null, cells.map(function (c) { return c.y; }));
    var width = (maxX - minX + 1) * size;
    var height = (maxY - minY + 1) * size;
    var ox = (canvas.width - width) / 2 - minX * size;
    var oy = (canvas.height - height) / 2 - minY * size;
    cells.forEach(function (cell) {
      drawCell(ctx, ox + cell.x * size, oy + cell.y * size, size, COLORS[type], 1);
    });
  }

  function render() {
    drawGrid();
    drawBoard();
    drawPiece(ghostPiece(), true);
    drawPiece(state.current, false);
    drawMini(nextCtx, nextCanvas, state.queue[0]);
    drawMini(holdCtx, holdCanvas, state.hold);
    postTetrisState();
  }

  function showMessage(title, copy, buttonText, action) {
    messageEl.innerHTML = '<div><h2>' + title + '</h2><p>' + copy + '</p><button class="btn primary" type="button">' + buttonText + '</button></div>';
    messageEl.classList.add("is-visible");
    messageEl.querySelector("button").addEventListener("click", action);
  }

  function hideMessage() {
    messageEl.classList.remove("is-visible");
  }

  function start() {
    if (state.running && state.paused) {
      togglePause(false);
      return;
    }
    restart();
  }

  function restart() {
    state = createState();
    refillQueue();
    spawn();
    state.running = true;
    state.paused = false;
    state.over = false;
    state.lastTime = performance.now();
    state.dropCounter = 0;
    pauseBtn.textContent = "暂停";
    setStatus("RUNNING");
    hideMessage();
    updateHud();
    render();
  }

  function togglePause(force) {
    if (!state.running || state.over) return;
    state.paused = typeof force === "boolean" ? force : !state.paused;
    pauseBtn.textContent = state.paused ? "继续" : "暂停";
    setStatus(state.paused ? "PAUSED" : "RUNNING");
    if (state.paused) {
      showMessage("时间冻结", "按 P 或点击继续，恢复六花方块协议。", "继续游戏", function () { togglePause(false); });
    } else {
      hideMessage();
      state.lastTime = performance.now();
    }
  }

  function tick(time) {
    var delta = time - state.lastTime;
    state.lastTime = time;
    if (canPlay()) {
      state.dropCounter += delta;
      if (state.dropCounter >= getInterval()) {
        softDropWithoutScore();
        state.dropCounter = 0;
      }
    }
    requestAnimationFrame(tick);
  }

  function softDropWithoutScore() {
    if (!state.current) return;
    if (!collides(state.current.matrix, state.current.x, state.current.y + 1)) {
      state.current.y += 1;
      render();
      return;
    }
    lockPiece();
  }

  function handleAction(action) {
    if (action === "left") move(-1);
    if (action === "right") move(1);
    if (action === "rotate") rotate();
    if (action === "down") softDrop();
    if (action === "drop") hardDrop();
    if (action === "hold") holdPiece();
  }

  function startHold(action) {
    stopHold();
    heldAction = action;
    handleAction(action);
    var firstDelay = action === "down" ? 60 : 120;
    var interval = action === "down" ? 46 : 72;
    holdTimer = window.setTimeout(function repeat() {
      if (!heldAction) return;
      handleAction(heldAction);
      holdTimer = window.setTimeout(repeat, interval);
    }, firstDelay);
  }

  function stopHold() {
    if (holdTimer) window.clearTimeout(holdTimer);
    holdTimer = null;
    heldAction = null;
  }

  document.addEventListener("keydown", function (event) {
    var key = event.key;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].indexOf(key) !== -1) event.preventDefault();
    if (key === "Enter" && (!state || !state.running)) start();
    if (!state) return;
    if (key === "p" || key === "P") togglePause();
    if (key === "ArrowLeft") move(-1);
    if (key === "ArrowRight") move(1);
    if (key === "ArrowUp" || key === "x" || key === "X") rotate();
    if (key === "ArrowDown") softDrop();
    if (key === " ") hardDrop();
    if (key === "c" || key === "C") holdPiece();
  }, { passive: false });

  window.addEventListener("message", function (event) {
    var data = event.data || {};
    if (data.type !== "tetris-action") return;
    var action = data.action;
    if (action === "start") start();
    else if (action === "restart") restart();
    else if (action === "pause") togglePause();
    else if (action === "setDifficulty" && difficultyEl && data.value) {
      difficultyEl.value = data.value;
      if (state && state.running) restart();
      else postTetrisState();
    } else {
      handleAction(action);
    }
  });

  document.getElementById("start").addEventListener("click", start);
  document.getElementById("restart").addEventListener("click", restart);
  pauseBtn.addEventListener("click", function () { togglePause(); });
  difficultyEl.addEventListener("change", function () {
    if (state && state.running) restart();
  });
  document.querySelectorAll("[data-action]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (button.dataset.action === "left" || button.dataset.action === "right" || button.dataset.action === "down") return;
      handleAction(button.dataset.action);
    });
    button.addEventListener("pointerdown", function (event) {
      if (button.dataset.action === "rotate" || button.dataset.action === "hold" || button.dataset.action === "drop") return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      startHold(button.dataset.action);
    });
    button.addEventListener("pointerup", stopHold);
    button.addEventListener("pointercancel", stopHold);
    button.addEventListener("pointerleave", stopHold);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && state && state.running && !state.paused && !state.over) {
      togglePause(true);
    }
  });

  state = createState();
  refillQueue();
  updateHud();
  render();
  requestAnimationFrame(tick);
}());
