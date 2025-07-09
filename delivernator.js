window.onload = function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const gameTitle = document.getElementById('gameTitle');
  const startButton = document.getElementById('startButton');
  const moveCounter = document.getElementById('moves');
  const timeCounter = document.getElementById('time');
  const finalScore = document.getElementById('finalScore');
  const endMessage = document.getElementById('endMessage');
  const gameOverScreen = document.getElementById('gameOverScreen');

  startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    startGame();
  });

  function startGame() {
    const TILE = 32;
    const ROWS = canvas.height / TILE;
    const COLS = canvas.width / TILE;

    const colors = {
      road: '#666',
      grass: '#2d4',
      package: '#ffa500',
      truck: '#ffff00',
      tire: '#111',
      boss: '#ff3333'
    };

    const map = [];
    for (let y = 0; y < ROWS; y++) {
      const row = [];
      for (let x = 0; x < COLS; x++) {
        row.push(Math.random() < 0.2 ? 'grass' : 'road');
      }
      map.push(row);
    }

    const packages = [];
    for (let i = 0; i < 5; i++) {
      let px, py;
      do {
        px = Math.floor(Math.random() * COLS);
        py = Math.floor(Math.random() * ROWS);
      } while (map[py][px] !== 'road');
      map[py][px] = 'package';
      packages.push({ x: px, y: py });
    }

    const truck = { x: 2, y: 2, dx: 0, dy: 0 };
    const boss = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2), active: false };
    const tireTracks = [];

    let moves = 0;
    let startTime = performance.now();
    let elapsed = 0;
    let gameOver = false;

    let frameTick = 0;
    const SPEED_FACTOR = 4;
    const BOSS_SPEED_FACTOR = 8;

    document.addEventListener('keydown', (e) => {
      if (gameOver) return;
      let moved = false;
      if (e.key === 'ArrowUp')    { truck.dx = 0; truck.dy = -1; moved = true; }
      if (e.key === 'ArrowDown')  { truck.dx = 0; truck.dy = 1; moved = true; }
      if (e.key === 'ArrowLeft')  { truck.dx = -1; truck.dy = 0; moved = true; }
      if (e.key === 'ArrowRight') { truck.dx = 1; truck.dy = 0; moved = true; }
      if (moved) {
        moves++;
        moveCounter.textContent = moves;
      }
    });

    function drawTile(type, x, y) {
      ctx.fillStyle = colors[type] || '#000';
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);

      if (type === 'package') {
        ctx.fillStyle = '#000';
        ctx.fillRect(x * TILE + 10, y * TILE + 10, 12, 12);
      } else if (type === 'truck') {
        ctx.fillStyle = '#000';
        ctx.fillRect(x * TILE + 6, y * TILE + 6, 20, 20);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x * TILE + 12, y * TILE + 8, 8, 6);
      } else if (type === 'boss') {
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(x * TILE + 4, y * TILE + 4, 24, 24);
        ctx.fillStyle = '#000';
        ctx.fillRect(x * TILE + 12, y * TILE + 10, 8, 4);
      }
    }

    function showGameOver(message) {
      gameOver = true;
      endMessage.textContent = message;
      gameOverScreen.style.display = 'block';
    }

    function update() {
      frameTick++;
      elapsed = (performance.now() - startTime) / 1000;

      if (!boss.active && elapsed >= 10) {
        boss.active = true;
        gameTitle.className = 'warning';
        gameTitle.textContent = 'WATCH OUT FOR THE SUPERVISOR!';
      }

      if (frameTick % SPEED_FACTOR === 0) {
        const nx = truck.x + truck.dx;
        const ny = truck.y + truck.dy;

        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && map[ny][nx] !== 'grass') {
          tireTracks.push({ x: truck.x, y: truck.y });
          truck.x = nx;
          truck.y = ny;
        }

        const idx = packages.findIndex(p => p.x === truck.x && p.y === truck.y);
        if (idx !== -1) {
          map[truck.y][truck.x] = 'road';
          packages.splice(idx, 1);
        }

        if (packages.length === 0 && !gameOver) {
          const score = Math.max(0, 10000 - (moves * 10 + elapsed * 20));
          finalScore.textContent = `🏁 Score: ${Math.round(score)} (Time: ${elapsed.toFixed(1)}s | Moves: ${moves})`;
          showGameOver("All Packages Delivered!");
        }
      }

      if (boss.active && frameTick % BOSS_SPEED_FACTOR === 0 && !gameOver) {
        const dx = truck.x - boss.x;
        const dy = truck.y - boss.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          const nextX = boss.x + Math.sign(dx);
          if (map[boss.y][nextX] !== 'grass') boss.x = nextX;
        } else {
          const nextY = boss.y + Math.sign(dy);
          if (map[nextY][boss.x] !== 'grass') boss.y = nextY;
        }

        if (truck.x === boss.x && truck.y === boss.y) {
          finalScore.textContent = "😡 Caught by the supervisor!";
          showGameOver("You Were Caught!");
        }
      }
    }

    function render() {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          drawTile(map[y][x], x, y);
        }
      }

      for (let t of tireTracks) {
        ctx.fillStyle = colors.tire;
        ctx.fillRect(t.x * TILE + 12, t.y * TILE + 12, 8, 8);
      }

      drawTile('truck', truck.x, truck.y);
      if (boss.active) drawTile('boss', boss.x, boss.y);
    }

    function loop() {
      if (!gameOver) {
        timeCounter.textContent = elapsed.toFixed(1);
        update();
        render();
        requestAnimationFrame(loop);
      } else {
        render();
      }
    }

    loop();
  }
};