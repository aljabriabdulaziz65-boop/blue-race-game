const $ = (id) => document.getElementById(id);

const STORAGE_KEYS = {
  best: 'blueBest',
  coins: 'blueCoins',
  selectedCar: 'selectedCar',
  unlockedCars: 'blueUnlockedCars'
};

const carCatalog = {
  blue: { speed: 5, enemySpawn: 900, coinBonus: 25 },
  red: { speed: 6.5, enemySpawn: 820, coinBonus: 30 },
  gold: { speed: 7.8, enemySpawn: 740, coinBonus: 40 }
};

const mainMenu = $('mainMenu');
const carMenu = $('carMenu');
const gameSection = $('gameSection');

const playButton = $('playButton');
const carsButton = $('carsButton');
const backButton = $('backButton');
const menuButton = $('menuButton');

const game = $('game');
const player = $('player');
const overlay = $('overlay');
const title = $('gameTitle');
const message = $('gameMessage');
const start = $('start');
const pauseBtn = $('pause');
const soundBtn = $('sound');

const scoreText = $('score');
const bestText = $('best');
const menuBest = $('menuBest');
const menuCoins = $('menuCoins');
const coinsTotal = $('coinsTotal');

let playerX = 172;
let score = 0;
let best = Number(localStorage.getItem(STORAGE_KEYS.best) || 0);
let totalCoins = Number(localStorage.getItem(STORAGE_KEYS.coins) || 0);
let running = false;
let paused = false;
let soundOn = true;
let enemies = [];
let coins = [];
let enemyTimer = null;
let coinTimer = null;
let lastTime = 0;
let animationFrameId = null;
let currentSpeed = carCatalog.blue.speed;
let selectedCar = localStorage.getItem(STORAGE_KEYS.selectedCar) || 'blue';

const carPrices = {
  blue: 0,
  red: 100,
  gold: 250
};

let unlockedCars = JSON.parse(localStorage.getItem(STORAGE_KEYS.unlockedCars) || '["blue"]');

bestText.textContent = best;
menuBest.textContent = best;
menuCoins.textContent = totalCoins;
coinsTotal.textContent = totalCoins;

function saveProgress() {
  localStorage.setItem(STORAGE_KEYS.best, String(best));
  localStorage.setItem(STORAGE_KEYS.coins, String(totalCoins));
  localStorage.setItem(STORAGE_KEYS.selectedCar, selectedCar);
  localStorage.setItem(STORAGE_KEYS.unlockedCars, JSON.stringify(unlockedCars));
}

function updateCarSelection() {
  document.querySelectorAll('.car-card').forEach(card => {
    const car = card.dataset.car;
    card.classList.toggle('selected', car === selectedCar);

    const lock = card.querySelector('.lock');
    if (unlockedCars.includes(car) && lock) {
      lock.remove();
    }
  });
}

document.querySelectorAll('.car-card').forEach(card => {
  card.addEventListener('click', () => {
    const car = card.dataset.car;

    if (unlockedCars.includes(car)) {
      selectedCar = car;
      saveProgress();
      updateCarSelection();
      return;
    }

    const price = carPrices[car];

    if (totalCoins >= price) {
      totalCoins -= price;
      unlockedCars.push(car);
      selectedCar = car;
      saveProgress();

      menuCoins.textContent = totalCoins;
      coinsTotal.textContent = totalCoins;

      updateCarSelection();
      alert('🎉 تم شراء السيارة!');
    } else {
      alert('🪙 تحتاج إلى ' + (price - totalCoins) + ' عملة إضافية.');
    }
  });
});

carsButton.addEventListener('click', () => {
  mainMenu.classList.add('hidden');
  carMenu.classList.remove('hidden');
});

backButton.addEventListener('click', () => {
  carMenu.classList.add('hidden');
  mainMenu.classList.remove('hidden');
});

playButton.addEventListener('click', () => {
  mainMenu.classList.add('hidden');
  gameSection.classList.remove('hidden');
  startGame();
});

menuButton.addEventListener('click', () => {
  running = false;
  paused = false;
  clearInterval(enemyTimer);
  clearInterval(coinTimer);

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  gameSection.classList.add('hidden');
  mainMenu.classList.remove('hidden');
});

function applySelectedCar() {
  player.classList.remove('player-blue', 'player-red', 'player-gold');
  player.classList.add('player-' + selectedCar);
}

function startGame() {
  clearInterval(enemyTimer);
  clearInterval(coinTimer);

  score = 0;
  playerX = 172;
  currentSpeed = carCatalog[selectedCar].speed;

  player.style.left = playerX + 'px';
  applySelectedCar();

  enemies.forEach(enemy => enemy.remove());
  coins.forEach(coin => coin.remove());
  enemies = [];
  coins = [];

  scoreText.textContent = '0';
  running = true;
  paused = false;

  pauseBtn.textContent = '⏸️';
  title.textContent = '🏁 سباق الأزرق';
  message.textContent = 'تجنب السيارات واجمع العملات!';
  start.textContent = 'ابدأ اللعب';

  overlay.classList.add('hidden');

  lastTime = performance.now();

  enemyTimer = setInterval(createEnemy, carCatalog[selectedCar].enemySpawn);
  coinTimer = setInterval(createCoin, Math.max(1000, carCatalog[selectedCar].enemySpawn + 350));

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

function createEnemy() {
  if (!running || paused) return;

  const enemy = document.createElement('div');
  enemy.className = 'enemy';

  const laneMin = 45;
  const laneMax = 290;
  const left = laneMin + Math.random() * (laneMax - laneMin);
  enemy.style.left = left + 'px';
  enemy.style.top = '-100px';

  game.appendChild(enemy);
  enemies.push(enemy);
}

function createCoin() {
  if (!running || paused) return;

  const coin = document.createElement('div');
  coin.className = 'coin';

  const coinMin = 50;
  const coinMax = 300;
  coin.style.left = (coinMin + Math.random() * (coinMax - coinMin)) + 'px';
  coin.style.top = '-40px';

  game.appendChild(coin);
  coins.push(coin);
}

function movePlayer(dir) {
  if (!running || paused) return;

  playerX += dir * 34;
  playerX = Math.max(45, Math.min(300, playerX));
  player.style.left = playerX + 'px';
}

function collision(a, b) {
  const rectA = a.getBoundingClientRect();
  const rectB = b.getBoundingClientRect();

  return (
    rectA.left < rectB.right &&
    rectA.right > rectB.left &&
    rectA.top < rectB.bottom &&
    rectA.bottom > rectB.top
  );
}

function gameOver() {
  running = false;
  clearInterval(enemyTimer);
  clearInterval(coinTimer);

  if (score > best) {
    best = Math.floor(score);
    bestText.textContent = best;
    menuBest.textContent = best;
  }

  saveProgress();

  title.textContent = '💥 انتهى السباق!';
  message.textContent = 'نتيجتك: ' + Math.floor(score);
  start.textContent = '🔄 العب مرة أخرى';
  overlay.classList.remove('hidden');
}

function gameLoop(now) {
  if (!running || paused) {
    return;
  }

  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const enemySpeed = currentSpeed + 1.5;
    let top = parseFloat(enemy.style.top) + enemySpeed;

    enemy.style.top = top + 'px';

    if (collision(player, enemy)) {
      gameOver();
      return;
    }

    if (top > 620) {
      enemy.remove();
      enemies.splice(i, 1);
    }
  }

  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    const coinSpeed = currentSpeed * 0.82;
    let top = parseFloat(coin.style.top) + coinSpeed;

    coin.style.top = top + 'px';

    if (collision(player, coin)) {
      totalCoins++;
      score += carCatalog[selectedCar].coinBonus;
      localStorage.setItem(STORAGE_KEYS.coins, String(totalCoins));
      menuCoins.textContent = totalCoins;
      coinsTotal.textContent = totalCoins;

      coin.remove();
      coins.splice(i, 1);
      continue;
    }

    if (top > 620) {
      coin.remove();
      coins.splice(i, 1);
    }
  }

  score += dt * (9 + currentSpeed * 1.25);
  scoreText.textContent = Math.floor(score);

  animationFrameId = requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') movePlayer(-1);
  if (e.code === 'ArrowRight') movePlayer(1);
  if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  if (e.code === 'KeyR') startGame();
});

$('left').addEventListener('click', () => movePlayer(-1));
$('right').addEventListener('click', () => movePlayer(1));
$('restart').addEventListener('click', () => startGame());

function togglePause() {
  if (!running) return;

  paused = !paused;

  if (paused) {
    pauseBtn.textContent = '▶️';
    title.textContent = '⏸️ إيقاف مؤقت';
    message.textContent = 'اضغط ▶️ للمتابعة';
    start.textContent = '▶️ متابعة';
    overlay.classList.remove('hidden');
  } else {
    pauseBtn.textContent = '⏸️';
    overlay.classList.add('hidden');
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

pauseBtn.addEventListener('click', togglePause);

soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? '🔊' : '🔇';
});

start.addEventListener('click', () => {
  if (paused) {
    togglePause();
  } else {
    startGame();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && running && !paused) {
    togglePause();
  }
});

updateCarSelection();
