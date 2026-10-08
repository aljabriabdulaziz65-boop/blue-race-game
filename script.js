const $ = (id) => document.getElementById(id);

const mainMenu = $("mainMenu");
const carMenu = $("carMenu");
const gameSection = $("gameSection");

const playButton = $("playButton");
const carsButton = $("carsButton");
const backButton = $("backButton");
const menuButton = $("menuButton");

const game = $("game");
const player = $("player");
const overlay = $("overlay");
const title = $("gameTitle");
const message = $("gameMessage");
const start = $("start");
const pauseBtn = $("pause");
const soundBtn = $("sound");

const scoreText = $("score");
const bestText = $("best");
const menuBest = $("menuBest");
const menuCoins = $("menuCoins");
const coinsTotal = $("coinsTotal");

let playerX = 172;
let score = 0;
let best = Number(localStorage.getItem("blueBest") || 0);
let totalCoins = Number(localStorage.getItem("blueCoins") || 0);

let running = false;
let paused = false;
let soundOn = true;

let enemies = [];
let coins = [];
let enemyTimer;
let coinTimer;
let lastTime = 0;
let animationFrameId = null;

let selectedCar = localStorage.getItem("selectedCar") || "blue";

const carPrices = {
  blue: 0,
  red: 100,
  gold: 250
};

let unlockedCars = JSON.parse(localStorage.getItem("blueUnlockedCars") || '["blue"]');

bestText.textContent = best;
menuBest.textContent = best;
menuCoins.textContent = totalCoins;
coinsTotal.textContent = totalCoins;

function updateCarSelection() {
  document.querySelectorAll(".car-card").forEach(card => {
    const car = card.dataset.car;
    card.classList.toggle("selected", car === selectedCar);

    const lock = card.querySelector(".lock");
    if (unlockedCars.includes(car) && lock) {
      lock.remove();
    }
  });
}

document.querySelectorAll(".car-card").forEach(card => {
  card.onclick = () => {
    const car = card.dataset.car;

    if (unlockedCars.includes(car)) {
      selectedCar = car;
      localStorage.setItem("selectedCar", selectedCar);
      updateCarSelection();
    } else {
      const price = carPrices[car];

      if (totalCoins >= price) {
        totalCoins -= price;
        unlockedCars.push(car);
        selectedCar = car;

        localStorage.setItem("blueCoins", totalCoins);
        localStorage.setItem("blueUnlockedCars", JSON.stringify(unlockedCars));
        localStorage.setItem("selectedCar", selectedCar);

        menuCoins.textContent = totalCoins;
        coinsTotal.textContent = totalCoins;

        updateCarSelection();
        alert("🎉 تم شراء السيارة!");
      } else {
        alert("🪙 تحتاج إلى " + (price - totalCoins) + " عملة إضافية.");
      }
    }
  };
});

carsButton.onclick = () => {
  mainMenu.classList.add("hidden");
  carMenu.classList.remove("hidden");
};

backButton.onclick = () => {
  carMenu.classList.add("hidden");
  mainMenu.classList.remove("hidden");
};

playButton.onclick = () => {
  mainMenu.classList.add("hidden");
  gameSection.classList.remove("hidden");
  startGame();
};

menuButton.onclick = () => {
  running = false;
  paused = false;
  clearInterval(enemyTimer);
  clearInterval(coinTimer);

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  gameSection.classList.add("hidden");
  mainMenu.classList.remove("hidden");
};

function applySelectedCar() {
  player.classList.remove("player-blue", "player-red", "player-gold");
  player.classList.add("player-" + selectedCar);
}

function startGame() {
  clearInterval(enemyTimer);
  clearInterval(coinTimer);

  score = 0;
  playerX = 172;

  player.style.left = playerX + "px";

  applySelectedCar();

  enemies.forEach(e => e.remove());
  coins.forEach(c => c.remove());

  enemies = [];
  coins = [];

  scoreText.textContent = "0";

  running = true;
  paused = false;

  pauseBtn.textContent = "⏸️";

  title.textContent = "🏁 سباق الأزرق";
  message.textContent = "تجنب السيارات واجمع العملات!";
  start.textContent = "ابدأ اللعب";

  overlay.classList.add("hidden");

  lastTime = performance.now();

  enemyTimer = setInterval(createEnemy, 720);
  coinTimer = setInterval(createCoin, 1200);

  cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(gameLoop);
}

function createEnemy() {
  if (!running || paused) return;

  const e = document.createElement("div");
  e.className = "enemy";

  const laneMin = 45;
  const laneMax = 290;
  e.style.left = (laneMin + Math.random() * (laneMax - laneMin)) + "px";
  e.style.top = "-100px";

  game.appendChild(e);
  enemies.push(e);
}

function createCoin() {
  if (!running || paused) return;

  const c = document.createElement("div");
  c.className = "coin";

  const coinMin = 50;
  const coinMax = 300;
  c.style.left = (coinMin + Math.random() * (coinMax - coinMin)) + "px";
  c.style.top = "-40px";

  game.appendChild(c);
  coins.push(c);
}

function movePlayer(dir) {
  if (!running || paused) return;

  playerX += dir * 34;

  playerX = Math.max(45, Math.min(300, playerX));
  player.style.left = playerX + "px";
}

function collision(a, b) {
  const x = a.getBoundingClientRect();
  const y = b.getBoundingClientRect();

  return (
    x.left < y.right &&
    x.right > y.left &&
    x.top < y.bottom &&
    x.bottom > y.top
  );
}

function gameOver() {
  running = false;

  clearInterval(enemyTimer);
  clearInterval(coinTimer);

  if (score > best) {
    best = Math.floor(score);
    localStorage.setItem("blueBest", best);
    bestText.textContent = best;
    menuBest.textContent = best;
  }

  title.textContent = "💥 انتهى السباق!";
  message.textContent = "نتيجتك: " + Math.floor(score);
  start.textContent = "🔄 العب مرة أخرى";

  overlay.classList.remove("hidden");
}

function gameLoop(now) {
  if (!running || paused) {
    return;
  }

  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    let top = parseFloat(e.style.top) + (selectedCar === "red" ? 7.2 : selectedCar === "gold" ? 8.5 : 6.5);

    e.style.top = top + "px";

    if (collision(player, e)) {
      gameOver();
      return;
    }

    if (top > 620) {
      e.remove();
      enemies.splice(i, 1);
    }
  }

  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    let top = parseFloat(c.style.top) + 5;

    c.style.top = top + "px";

    if (collision(player, c)) {
      totalCoins++;
      score += 25;

      localStorage.setItem("blueCoins", totalCoins);

      menuCoins.textContent = totalCoins;
      coinsTotal.textContent = totalCoins;

      c.remove();
      coins.splice(i, 1);
    } else if (top > 620) {
      c.remove();
      coins.splice(i, 1);
    }
  }

  score += dt * (selectedCar === "red" ? 12 : selectedCar === "gold" ? 15 : 10);

  scoreText.textContent = Math.floor(score);

  animationFrameId = requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", e => {
  if (e.code === "ArrowLeft") movePlayer(-1);
  if (e.code === "ArrowRight") movePlayer(1);
  if (e.code === "KeyP" || e.code === "Escape") togglePause();
  if (e.code === "KeyR") startGame();
});

$("left").onclick = () => movePlayer(-1);
$("right").onclick = () => movePlayer(1);
$("restart").onclick = () => startGame();

function togglePause() {
  if (!running) return;

  paused = !paused;

  if (paused) {
    pauseBtn.textContent = "▶️";
    title.textContent = "⏸️ إيقاف مؤقت";
    message.textContent = "اضغط ▶️ للمتابعة";
    start.textContent = "▶️ متابعة";
    overlay.classList.remove("hidden");
  } else {
    pauseBtn.textContent = "⏸️";
    overlay.classList.add("hidden");
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

pauseBtn.onclick = togglePause;

soundBtn.onclick = () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "🔊" : "🔇";
};

start.onclick = () => {
  if (paused) {
    togglePause();
  } else {
    startGame();
  }
};

document.addEventListener("visibilitychange", () => {
  if (document.hidden && running && !paused) {
    togglePause();
  }
});

updateCarSelection();
