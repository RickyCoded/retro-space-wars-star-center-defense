const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const healthEl = document.getElementById("health");
const waveEl = document.getElementById("wave");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const victoryScreen = document.getElementById("victoryScreen");
const pauseScreen = document.getElementById("pauseScreen");
const finalScoreEl = document.getElementById("finalScore");
const victoryScoreEl = document.getElementById("victoryScore");
const victoryHighScoreEl = document.getElementById("victoryHighScore");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const playAgainButton = document.getElementById("playAgainButton");
const returnTitleButton = document.getElementById("returnTitleButton");
const musicToggle = document.getElementById("musicToggle");
const brandLogo = document.getElementById("brandLogo");
const bossHealthBar = document.getElementById("bossHealthBar");
const bossNameEl = document.getElementById("bossName");
const bossHealthPercentEl = document.getElementById("bossHealthPercent");
const bossHealthFill = document.getElementById("bossHealthFill");
const bossMessage = document.getElementById("bossMessage");

// Change this path to swap the header logo later.
const LOGO_IMAGE_SRC = "assets/images/logo.png";
brandLogo.src = LOGO_IMAGE_SRC;

const MUSIC_FILES = {
  title: "assets/audio/title-theme.mp3",
  gameplay: "assets/audio/gameplay-theme.mp3",
};

const MUSIC_VOLUME = {
  title: 0.45,
  gameplay: 0.35,
};

const MUSIC_FADE_MS = 450;

const keys = {
  left: false,
  right: false,
  fire: false,
};

const shipImages = {
  player: loadShipImage("assets/images/playerShip.png"),
  enemy1: loadShipImage("assets/images/enemyShip1.png"),
  enemy2: loadShipImage("assets/images/enemyShip2.png"),
  boss: loadShipImage("assets/images/bossShip.png"),
  boss1: loadShipImage("assets/images/boss1.png"),
  boss2: loadShipImage("assets/images/boss2.png"),
  boss3: loadShipImage("assets/images/boss3.png"),
  boss4: loadShipImage("assets/images/boss4.png"),
  boss5: loadShipImage("assets/images/boss5.png"),
  powerUp: loadShipImage("assets/images/powerUp.png"),
};

const bossConfigs = [
  {
    wave: 5,
    number: 1,
    name: "Void Cruiser I",
    imageKey: "boss1",
    maxHealth: 300,
    speed: 82,
    fireRate: 1400,
    projectileSpeed: 210,
    shotCount: 1,
    size: 118,
    scoreValue: 1000,
    patterns: ["aimed", "spread3"],
  },
  {
    wave: 10,
    number: 2,
    name: "Void Cruiser II",
    imageKey: "boss2",
    maxHealth: 500,
    speed: 96,
    fireRate: 1180,
    projectileSpeed: 245,
    shotCount: 2,
    size: 132,
    scoreValue: 2000,
    patterns: ["aimed", "spread3", "cannons"],
  },
  {
    wave: 15,
    number: 3,
    name: "Void Siege Cruiser",
    imageKey: "boss3",
    maxHealth: 750,
    speed: 108,
    fireRate: 1040,
    projectileSpeed: 270,
    shotCount: 3,
    size: 146,
    scoreValue: 3500,
    patterns: ["spread5", "burst", "cannons"],
  },
  {
    wave: 20,
    number: 4,
    name: "Void Dread Cruiser",
    imageKey: "boss4",
    maxHealth: 1050,
    speed: 122,
    fireRate: 920,
    projectileSpeed: 295,
    shotCount: 4,
    size: 162,
    scoreValue: 5000,
    patterns: ["aimed", "spread5", "burst", "sweep", "heavy"],
  },
  {
    wave: 25,
    number: 5,
    name: "The Sovereign's Flagship",
    imageKey: "boss5",
    maxHealth: 1500,
    speed: 138,
    fireRate: 820,
    projectileSpeed: 320,
    shotCount: 5,
    size: 180,
    scoreValue: 10000,
    patterns: ["aimed", "spread5", "burst", "sweep", "heavy", "cannons"],
  },
];

let stars = [];
let player;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let powerUps = [];
let boss = null;
let bossMode = "none";
let bossWarningTimer = 0;
let bossDefeatTimer = 0;
let bossMessageTimer = 0;
let bossPatternIndex = 0;
let bossHealthDisplay = 0;
let particles = [];
let score = 0;
let highScore = loadHighScore();
let wave = 1;
let enemiesRemaining = 0;
let spawnTimer = 0;
let powerUpsDroppedThisWave = 0;
let firstBossDefeated = false;
let fireCooldown = 0;
let gameState = "start";
let lastTime = 0;
let audioContext;
let musicUnlocked = false;
let musicMuted = false;
let currentMusic = null;
let musicRequestId = 0;

const musicTracks = {
  title: createMusicTrack(MUSIC_FILES.title, MUSIC_VOLUME.title),
  gameplay: createMusicTrack(MUSIC_FILES.gameplay, MUSIC_VOLUME.gameplay),
};

function loadShipImage(src) {
  const asset = {
    image: new Image(),
    loaded: false,
    failed: false,
  };

  asset.image.onload = () => {
    asset.loaded = true;
  };
  asset.image.onerror = () => {
    asset.failed = true;
  };
  asset.image.src = src;
  return asset;
}

function createMusicTrack(src, volume) {
  const audio = new Audio(src);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;

  const track = {
    audio,
    src,
    volume,
    failed: false,
    fadeTimer: null,
  };

  audio.addEventListener("error", () => {
    track.failed = true;
    console.warn(`Music file could not be loaded: ${src}`);
  });

  return track;
}

function loadHighScore() {
  try {
    return Number(localStorage.getItem("retroSpaceWarsHighScore")) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore() {
  try {
    localStorage.setItem("retroSpaceWarsHighScore", String(highScore));
  } catch {
    // Some browser privacy modes block localStorage; the in-memory score still works.
  }
}

// The music helpers keep one reusable audio element per song so repeated clicks
// cannot stack overlapping copies of the same track.
function updateMusicButton() {
  musicToggle.textContent = musicMuted ? "Music Off" : "Music On";
  musicToggle.setAttribute("aria-pressed", String(musicMuted));
}

function fadeMusic(track, targetVolume, duration = MUSIC_FADE_MS, onComplete) {
  clearInterval(track.fadeTimer);

  const audio = track.audio;
  const startVolume = audio.volume;
  const startTime = performance.now();

  track.fadeTimer = setInterval(() => {
    const progress = Math.min(1, (performance.now() - startTime) / duration);
    audio.volume = startVolume + (targetVolume - startVolume) * progress;

    if (progress >= 1) {
      clearInterval(track.fadeTimer);
      track.fadeTimer = null;
      audio.volume = targetVolume;
      onComplete?.();
    }
  }, 40);
}

function beginMusic(trackName) {
  const track = musicTracks[trackName];

  if (!musicUnlocked || musicMuted || track.failed) {
    return;
  }

  if (currentMusic === trackName && !track.audio.paused) {
    fadeMusic(track, track.volume, 180);
    return;
  }

  Object.entries(musicTracks).forEach(([name, otherTrack]) => {
    if (name !== trackName && !otherTrack.audio.paused) {
      otherTrack.audio.pause();
      otherTrack.audio.volume = 0;
    }
  });

  currentMusic = trackName;
  musicRequestId += 1;
  const requestId = musicRequestId;
  track.audio.loop = true;
  track.audio.volume = 0;

  track.audio.play()
    .then(() => {
      if (musicMuted || currentMusic !== trackName || requestId !== musicRequestId) {
        track.audio.pause();
        track.audio.volume = 0;
        return;
      }

      fadeMusic(track, track.volume);
    })
    .catch(() => {
      if (track.audio.error) {
        track.failed = true;
      }
      console.warn(`Music playback was blocked or failed: ${track.src}`);
    });
}

function stopMusic(trackName, clearCurrent = true, onComplete, resetTime = true) {
  const track = musicTracks[trackName];
  musicRequestId += 1;

  if (!track || track.audio.paused) {
    if (clearCurrent && currentMusic === trackName) {
      currentMusic = null;
    }
    onComplete?.();
    return;
  }

  fadeMusic(track, 0, MUSIC_FADE_MS, () => {
    track.audio.pause();
    if (resetTime) {
      track.audio.currentTime = 0;
    }
    if (clearCurrent && currentMusic === trackName) {
      currentMusic = null;
    }
    onComplete?.();
  });
}

function playTitleMusic() {
  if (currentMusic === "gameplay") {
    stopGameplayMusic();
  }
  beginMusic("title");
}

function stopTitleMusic(onComplete) {
  stopMusic("title", true, onComplete);
}

function playGameplayMusic() {
  if (currentMusic === "gameplay" && !musicTracks.gameplay.audio.paused) {
    return;
  }

  if (!musicTracks.title.audio.paused) {
    stopTitleMusic(() => beginMusic("gameplay"));
    return;
  }

  beginMusic("gameplay");
}

function stopGameplayMusic(onComplete) {
  stopMusic("gameplay", true, onComplete);
}

function pauseCurrentMusic() {
  if (!currentMusic) {
    return;
  }

  stopMusic(currentMusic, false, undefined, false);
}

function resumeCurrentMusic() {
  if (musicMuted) {
    return;
  }

  if (gameState === "playing") {
    currentMusic = "gameplay";
    beginMusic("gameplay");
  } else if (gameState === "start") {
    currentMusic = "title";
    beginMusic("title");
  }
}

function toggleMute() {
  musicMuted = !musicMuted;
  updateMusicButton();

  if (musicMuted) {
    musicRequestId += 1;
    Object.values(musicTracks).forEach((track) => {
      clearInterval(track.fadeTimer);
      track.fadeTimer = null;
      track.audio.pause();
      track.audio.volume = 0;
    });
    return;
  }

  resumeCurrentMusic();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * scale);
  canvas.height = Math.floor(rect.height * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function width() {
  return canvas.getBoundingClientRect().width;
}

function height() {
  return canvas.getBoundingClientRect().height;
}

function makeStars() {
  stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width(),
    y: Math.random() * height(),
    size: Math.random() * 1.8 + 0.4,
    speed: Math.random() * 42 + 16,
    alpha: Math.random() * 0.65 + 0.25,
  }));
}

function resetGame() {
  player = {
    x: width() / 2,
    y: height() - 70,
    radius: 18,
    speed: 430,
    health: 100,
    invulnerable: 0,
    spreadTimer: 0,
    dualMissile: false,
  };
  bullets = [];
  enemyBullets = [];
  enemies = [];
  powerUps = [];
  boss = null;
  bossMode = "none";
  bossWarningTimer = 0;
  bossDefeatTimer = 0;
  bossMessageTimer = 0;
  bossPatternIndex = 0;
  bossHealthDisplay = 0;
  particles = [];
  score = 0;
  wave = 1;
  enemiesRemaining = waveSize();
  spawnTimer = 0.4;
  powerUpsDroppedThisWave = 0;
  firstBossDefeated = false;
  fireCooldown = 0;
  gameState = "playing";
  lastTime = performance.now();
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  victoryScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  hideBossUi();
  updateHud();
  playGameplayMusic();
}

function waveSize() {
  return 7 + wave * 3;
}

function enemySpeedRange() {
  const speedTargets = [
    { wave: 5, min: 118, max: 135 },
    { wave: 10, min: 135, max: 170 },
    { wave: 20, min: 170, max: 200 },
    { wave: 24, min: 200, max: 235 },
  ];

  if (wave < speedTargets[0].wave) {
    return {
      min: 70 + wave * 13,
      max: 105 + wave * 13,
    };
  }

  for (let i = 0; i < speedTargets.length - 1; i += 1) {
    const current = speedTargets[i];
    const next = speedTargets[i + 1];

    if (wave <= next.wave) {
      const progress = (wave - current.wave) / (next.wave - current.wave);

      return {
        min: current.min + (next.min - current.min) * progress,
        max: current.max + (next.max - current.max) * progress,
      };
    }
  }

  return speedTargets[speedTargets.length - 1];
}

function updateHud() {
  if (score > highScore) {
    highScore = score;
    saveHighScore();
  }

  scoreEl.textContent = score;
  highScoreEl.textContent = highScore;
  healthEl.textContent = Math.max(0, Math.ceil(player?.health ?? 100));
  waveEl.textContent = wave;
}

function isBossWave(waveNumber) {
  return bossConfigs.some((config) => config.wave === waveNumber);
}

function getBossConfig(waveNumber) {
  return bossConfigs.find((config) => config.wave === waveNumber);
}

function hideBossUi() {
  bossHealthBar.classList.add("hidden");
  bossMessage.classList.add("hidden");
}

function showBossMessage(text, duration = 2) {
  bossMessage.textContent = text;
  bossMessageTimer = duration;
  bossMessage.classList.remove("hidden");
}

function updateBossHealthBar() {
  if (!boss || bossMode !== "active") {
    bossHealthBar.classList.add("hidden");
    return;
  }

  bossHealthDisplay += (boss.health - bossHealthDisplay) * 0.18;
  const ratio = Math.max(0, bossHealthDisplay / boss.maxHealth);
  bossNameEl.textContent = `${boss.name.toUpperCase()} - BOSS ${boss.number}`;
  bossHealthPercentEl.textContent = `${Math.ceil(ratio * 100)}%`;
  bossHealthFill.style.width = `${ratio * 100}%`;
  bossHealthBar.classList.remove("hidden");
}

function returnToTitle() {
  gameState = "start";
  boss = null;
  bossMode = "none";
  bossWarningTimer = 0;
  bossDefeatTimer = 0;
  bossMessageTimer = 0;
  bullets = [];
  enemyBullets = [];
  enemies = [];
  powerUps = [];
  particles = [];
  startScreen.classList.remove("hidden");
  gameOverScreen.classList.add("hidden");
  victoryScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  hideBossUi();
  stopGameplayMusic(() => playTitleMusic());
  updateHud();
}

function playTone(frequency, duration, type = "square", gain = 0.035) {
  if (!audioContext) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  volume.gain.value = gain;
  volume.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function unlockAudio() {
  // Browsers require a real user gesture before music can play.
  musicUnlocked = true;

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  if (gameState === "start") {
    playTitleMusic();
  }
}

function spawnEnemy() {
  const sidePadding = 32;
  const typeRoll = Math.random();
  const isHeavy = wave > 2 && typeRoll > 0.78;
  const isShooter = wave > 1 && !isHeavy && typeRoll > 0.54;
  const spriteKey = isHeavy ? "boss" : isShooter ? "enemy2" : "enemy1";
  const speedRange = enemySpeedRange();

  enemies.push({
    x: sidePadding + Math.random() * (width() - sidePadding * 2),
    y: -35,
    radius: isHeavy ? 24 : 18,
    speed: speedRange.min + Math.random() * (speedRange.max - speedRange.min),
    health: isHeavy ? 3 : isShooter ? 2 : 1,
    maxHealth: isHeavy ? 3 : isShooter ? 2 : 1,
    points: isHeavy ? 70 : isShooter ? 45 : 30,
    shootTimer: isShooter || isHeavy ? 1.2 + Math.random() * 1.5 : 999,
    color: isHeavy ? "#35102f" : isShooter ? "#5b1339" : "#241329",
    accent: isHeavy ? "#ff355f" : "#bd3cff",
    spriteKey,
    isBossShip: isHeavy,
  });
}

function shootPlayer() {
  if (fireCooldown > 0 || gameState !== "playing") {
    return;
  }

  const shots = player.spreadTimer > 0
    ? [
        { xOffset: -9, vx: -175 },
        { xOffset: 0, vx: 0 },
        { xOffset: 9, vx: 175 },
      ]
    : player.dualMissile
      ? [
          { xOffset: -11, vx: -38, color: "#8df7ff" },
          { xOffset: 11, vx: 38, color: "#8df7ff" },
        ]
    : [{ xOffset: 0, vx: 0 }];

  shots.forEach((shot) => {
    bullets.push({
      x: player.x + shot.xOffset,
      y: player.y - 20,
      radius: player.dualMissile && player.spreadTimer <= 0 ? 5 : 4,
      speed: 520,
      vx: shot.vx,
      color: shot.color || "#ffd166",
    });
  });

  fireCooldown = player.spreadTimer > 0 || player.dualMissile ? 0.14 : 0.18;
  playTone(player.spreadTimer > 0 ? 900 : 760, 0.06, "square", 0.025);
}

function spawnPowerUp(x, y, type = "chrono") {
  powerUps.push({
    type,
    x,
    y,
    radius: type === "dualMissile" ? 17 : 15,
    speed: 95,
    spin: Math.random() * Math.PI * 2,
    drift: Math.random() > 0.5 ? 24 : -24,
  });
}

function collectPowerUp(powerUp) {
  powerUp.collected = true;
  if (powerUp.type === "dualMissile") {
    player.dualMissile = true;
    addExplosion(powerUp.x, powerUp.y, "#ffd166");
    playTone(620, 0.18, "square", 0.04);
    return;
  }

  player.spreadTimer = 7;
  addExplosion(powerUp.x, powerUp.y, "#8df7ff");
  playTone(980, 0.16, "triangle", 0.04);
}

function shootEnemy(enemy) {
  enemyBullets.push({
    x: enemy.x,
    y: enemy.y + enemy.radius,
    radius: 5,
    speed: 190 + wave * 12,
  });
  playTone(220, 0.08, "sawtooth", 0.018);
}

function addExplosion(x, y, color) {
  for (let i = 0; i < 18; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * (60 + Math.random() * 150),
      vy: Math.sin(angle) * (60 + Math.random() * 150),
      life: 0.42 + Math.random() * 0.3,
      maxLife: 0.72,
      color,
    });
  }
}

function hitPlayer(damage) {
  if (player.invulnerable > 0) {
    return;
  }
  player.health -= damage;
  player.invulnerable = 0.8;
  addExplosion(player.x, player.y, "#4de3ff");
  playTone(120, 0.16, "triangle", 0.045);
  if (player.health <= 0) {
    endGame();
  }
}

function endGame() {
  gameState = "gameover";
  finalScoreEl.textContent = `Final score: ${score}`;
  gameOverScreen.classList.remove("hidden");
  pauseScreen.classList.add("hidden");
  hideBossUi();
  stopGameplayMusic();
  playTone(85, 0.45, "sawtooth", 0.04);
}

function startNextWave() {
  wave += 1;
  powerUpsDroppedThisWave = 0;
  player.health = Math.min(100, player.health + 12);

  if (isBossWave(wave)) {
    startBossWave();
    return;
  }

  enemiesRemaining = waveSize();
  spawnTimer = 1.25;
}

function startBossWave() {
  boss = null;
  bossMode = "warning";
  bossWarningTimer = 2.2;
  bossDefeatTimer = 0;
  bossPatternIndex = 0;
  enemiesRemaining = 0;
  enemies = [];
  powerUps = [];
  hideBossUi();
  showBossMessage("VOID EMPIRE CRUISER APPROACHING", bossWarningTimer);
}

function createBoss() {
  const config = getBossConfig(wave);
  if (!config) {
    bossMode = "none";
    startNextWave();
    return;
  }

  const bossSize = Math.min(config.size, width() * 0.34, height() * 0.24);
  boss = {
    ...config,
    x: width() / 2,
    y: -bossSize,
    targetY: Math.max(72, height() * 0.16),
    width: bossSize,
    height: bossSize,
    radius: bossSize * 0.38,
    health: config.maxHealth,
    maxHealth: config.maxHealth,
    direction: Math.random() > 0.5 ? 1 : -1,
    directionTimer: 1.2,
    fireTimer: 1.2,
    cannonSide: -1,
    phase: 1,
    hitFlash: 0,
    pulseTimer: 0,
    defeated: false,
  };
  bossHealthDisplay = boss.maxHealth;
  bossMode = "active";
  bossMessage.classList.add("hidden");
  updateBossHealthBar();
}

function updateBoss(delta) {
  if (bossMode === "warning") {
    bossWarningTimer -= delta;
    if (bossWarningTimer <= 0) {
      createBoss();
    }
    return;
  }

  if (bossMode === "defeated") {
    bossDefeatTimer -= delta;
    if (bossDefeatTimer <= 0) {
      if (boss?.number === 5) {
        completeGame();
        return;
      }
      boss = null;
      bossMode = "none";
      hideBossUi();
      startNextWave();
    }
    return;
  }

  if (!boss || bossMode !== "active") {
    return;
  }

  const phaseSpeed = boss.phase === 3 ? 1.34 : boss.phase === 2 ? 1.18 : 1;
  boss.hitFlash = Math.max(0, boss.hitFlash - delta);
  boss.pulseTimer += delta;

  if (boss.y < boss.targetY) {
    boss.y += (92 + boss.speed) * delta;
  } else {
    boss.directionTimer -= delta;
    if (boss.directionTimer <= 0) {
      boss.direction *= -1;
      boss.directionTimer = 1.1 + Math.random() * 1.6;
    }
    boss.x += boss.direction * boss.speed * phaseSpeed * delta;
    const sidePadding = boss.width * 0.45 + 18;
    if (boss.x < sidePadding || boss.x > width() - sidePadding) {
      boss.x = Math.max(sidePadding, Math.min(width() - sidePadding, boss.x));
      boss.direction *= -1;
    }
  }

  boss.fireTimer -= delta * phaseSpeed;
  if (boss.y >= boss.targetY - 4 && boss.fireTimer <= 0) {
    fireBossPattern();
    boss.fireTimer = Math.max(0.35, (boss.fireRate / 1000) * (boss.phase === 3 ? 0.62 : boss.phase === 2 ? 0.78 : 1));
  }

  changeBossPhase();
  updateBossHealthBar();
}

function changeBossPhase() {
  if (!boss || boss.number < 3) {
    return;
  }

  const healthRatio = boss.health / boss.maxHealth;
  const nextPhase = healthRatio <= 0.25 ? 3 : healthRatio <= 0.6 ? 2 : 1;
  if (nextPhase > boss.phase) {
    boss.phase = nextPhase;
    boss.hitFlash = 0.45;
    showBossMessage(`${boss.name.toUpperCase()} PHASE ${boss.phase}`, 1.1);
  }
}

function damageBoss(amount) {
  if (!boss || bossMode !== "active" || boss.defeated) {
    return;
  }

  boss.health = Math.max(0, boss.health - amount);
  boss.hitFlash = 0.12;
  if (boss.health <= 0) {
    defeatBoss();
  }
}

function defeatBoss() {
  if (!boss || boss.defeated) {
    return;
  }

  boss.defeated = true;
  if (boss.number === 1) {
    firstBossDefeated = true;
  }
  score += boss.scoreValue;
  updateHud();
  addExplosion(boss.x, boss.y, "#ff4f78");
  addExplosion(boss.x - boss.width * 0.22, boss.y + 8, "#ffd166");
  addExplosion(boss.x + boss.width * 0.22, boss.y + 8, "#8df7ff");
  showBossMessage("VOID CRUISER DESTROYED", 2);
  bossMode = "defeated";
  bossDefeatTimer = 2.4;
  bossHealthBar.classList.add("hidden");
  setTimeout(() => {
    enemyBullets = enemyBullets.filter((bullet) => !bullet.fromBoss);
  }, 450);
  playTone(70, 0.35, "sawtooth", 0.045);

  if (boss.number !== 5) {
    spawnPowerUp(boss.x, boss.y + boss.height * 0.25, "dualMissile");
  }

}

function completeGame() {
  if (gameState === "victory") {
    return;
  }

  gameState = "victory";
  boss = null;
  bossMode = "none";
  enemies = [];
  enemyBullets = [];
  powerUps = [];
  victoryScoreEl.textContent = `Final score: ${score}`;
  victoryHighScoreEl.textContent = `High score: ${highScore}`;
  victoryScreen.classList.remove("hidden");
  pauseScreen.classList.add("hidden");
  hideBossUi();
  stopGameplayMusic();
}

function update(delta) {
  if (gameState !== "playing") {
    return;
  }

  const stageWidth = width();
  const stageHeight = height();
  const direction = Number(keys.right) - Number(keys.left);
  player.x += direction * player.speed * delta;
  player.x = Math.max(28, Math.min(stageWidth - 28, player.x));
  player.invulnerable = Math.max(0, player.invulnerable - delta);
  player.spreadTimer = Math.max(0, player.spreadTimer - delta);
  fireCooldown = Math.max(0, fireCooldown - delta);

  if (keys.fire) {
    shootPlayer();
  }

  stars.forEach((star) => {
    star.y += star.speed * delta;
    if (star.y > stageHeight) {
      star.y = -4;
      star.x = Math.random() * stageWidth;
    }
  });

  if (bossMessageTimer > 0) {
    bossMessageTimer -= delta;
    if (bossMessageTimer <= 0) {
      bossMessage.classList.add("hidden");
    }
  }

  bullets.forEach((bullet) => {
    bullet.x += (bullet.vx || 0) * delta;
    bullet.y -= bullet.speed * delta;
  });
  bullets = bullets.filter((bullet) => bullet.y > -20 && bullet.x > -20 && bullet.x < stageWidth + 20);

  enemyBullets.forEach((bullet) => {
    bullet.x += (bullet.vx || 0) * delta;
    bullet.y += (bullet.vy || bullet.speed) * delta;
  });
  enemyBullets = enemyBullets.filter((bullet) => (
    bullet.y < stageHeight + 40
    && bullet.y > -40
    && bullet.x > -40
    && bullet.x < stageWidth + 40
  ));

  powerUps.forEach((powerUp) => {
    powerUp.x += Math.sin(powerUp.spin) * powerUp.drift * delta;
    powerUp.y += powerUp.speed * delta;
    powerUp.spin += delta * 4;
  });
  powerUps = powerUps.filter((powerUp) => !powerUp.collected && powerUp.y < stageHeight + 40);

  updateBoss(delta);

  if (bossMode === "none" && enemiesRemaining > 0) {
    spawnTimer -= delta;
    if (spawnTimer <= 0) {
      spawnEnemy();
      enemiesRemaining -= 1;
      spawnTimer = Math.max(0.28, 0.95 - wave * 0.055);
    }
  }

  enemies.forEach((enemy) => {
    enemy.y += enemy.speed * delta;
    enemy.shootTimer -= delta;
    if (enemy.shootTimer <= 0) {
      shootEnemy(enemy);
      enemy.shootTimer = Math.max(0.55, 2.1 - wave * 0.08 + Math.random() * 0.8);
    }
  });

  particles.forEach((particle) => {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.life -= delta;
  });
  particles = particles.filter((particle) => particle.life > 0);

  checkCollisions();

  enemies = enemies.filter((enemy) => {
    if (enemy.y > stageHeight + 40) {
      hitPlayer(14);
      return false;
    }
    return enemy.health > 0;
  });

  if (bossMode === "none" && enemiesRemaining <= 0 && enemies.length === 0) {
    startNextWave();
  }

  updateHud();
}

function checkCollisions() {
  bullets.forEach((bullet) => {
    enemies.forEach((enemy) => {
      if (enemy.health <= 0) {
        return;
      }

      if (distance(bullet, enemy) < bullet.radius + enemy.radius) {
        bullet.y = -100;
        enemy.health -= 1;
        addExplosion(bullet.x, bullet.y, enemy.accent);
        if (enemy.health <= 0) {
          score += enemy.points;
          addExplosion(enemy.x, enemy.y, "#ff4f78");
          maybeDropPowerUp(enemy);
          playTone(360, 0.09, "square", 0.035);
        }
      }
    });

    if (boss && bossMode === "active" && distance(bullet, boss) < bullet.radius + boss.radius) {
      bullet.y = -100;
      damageBoss(10);
      addExplosion(bullet.x, bullet.y, "#ff4f78");
    }
  });

  enemyBullets.forEach((bullet) => {
    if (distance(bullet, player) < bullet.radius + player.radius) {
      bullet.y = height() + 100;
      hitPlayer(bullet.damage || 10);
    }
  });

  enemies.forEach((enemy) => {
    if (distance(enemy, player) < enemy.radius + player.radius) {
      enemy.health = 0;
      addExplosion(enemy.x, enemy.y, enemy.accent);
      hitPlayer(22);
    }
  });

  powerUps.forEach((powerUp) => {
    if (distance(powerUp, player) < powerUp.radius + player.radius) {
      collectPowerUp(powerUp);
    }
  });

  if (boss && bossMode === "active" && distance(boss, player) < boss.radius + player.radius) {
    hitPlayer(28);
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function maybeDropPowerUp(enemy) {
  const maxPowerUpsPerWave = firstBossDefeated ? 5 : 3;
  const dropChance = enemy.isBossShip ? 0.55 : 0.18;
  const canDrop = enemy.isBossShip || firstBossDefeated;

  if (canDrop && powerUpsDroppedThisWave < maxPowerUpsPerWave && Math.random() < dropChance) {
    spawnPowerUp(enemy.x, enemy.y);
    powerUpsDroppedThisWave += 1;
  }
}

function fireBossPattern() {
  if (!boss || boss.patterns.length === 0) {
    return;
  }

  const pattern = boss.patterns[bossPatternIndex % boss.patterns.length];
  bossPatternIndex += 1;

  if (boss.phase >= 2 && !boss.patterns.includes("spread5")) {
    fireBossSpread(3 + boss.phase * 2, 0.72);
    return;
  }

  if (pattern === "aimed") {
    fireBossAimedShot();
  } else if (pattern === "spread3") {
    fireBossSpread(3, 0.46);
  } else if (pattern === "spread5") {
    fireBossSpread(boss.phase >= 3 ? 7 : 5, boss.phase >= 3 ? 0.86 : 0.68);
  } else if (pattern === "cannons") {
    fireBossCannon();
  } else if (pattern === "burst") {
    fireBossBurst();
  } else if (pattern === "heavy") {
    fireBossHeavy();
  } else if (pattern === "sweep") {
    fireBossSweep();
  }
}

function fireBossProjectile(x, y, vx, vy, options = {}) {
  enemyBullets.push({
    x,
    y,
    vx,
    vy,
    radius: options.radius || 6,
    damage: options.damage || 12,
    color: options.color || "#ff4f78",
    fromBoss: true,
  });
}

function fireBossAimedShot() {
  const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
  const speed = boss.projectileSpeed * (boss.phase >= 3 ? 1.14 : 1);
  fireBossProjectile(boss.x, boss.y + boss.height * 0.35, Math.cos(angle) * speed, Math.sin(angle) * speed);
}

function fireBossSpread(count, arc) {
  const baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
  const speed = boss.projectileSpeed * 0.92;
  const start = baseAngle - arc / 2;
  const step = count > 1 ? arc / (count - 1) : 0;

  for (let i = 0; i < count; i += 1) {
    const angle = start + step * i;
    fireBossProjectile(boss.x, boss.y + boss.height * 0.36, Math.cos(angle) * speed, Math.sin(angle) * speed);
  }
}

function fireBossCannon() {
  boss.cannonSide *= -1;
  const x = boss.x + boss.cannonSide * boss.width * 0.28;
  fireBossProjectile(x, boss.y + boss.height * 0.32, boss.cannonSide * 32, boss.projectileSpeed * 1.05, {
    radius: 6,
    damage: 11,
    color: "#bd3cff",
  });
}

function fireBossBurst() {
  const shots = boss.phase >= 3 ? 5 : 3;

  for (let i = 0; i < shots; i += 1) {
    setTimeout(() => {
      if (gameState === "playing" && boss && bossMode === "active") {
        fireBossAimedShot();
      }
    }, i * 130);
  }
}

function fireBossHeavy() {
  const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
  const speed = boss.projectileSpeed * 0.62;
  fireBossProjectile(boss.x, boss.y + boss.height * 0.38, Math.cos(angle) * speed, Math.sin(angle) * speed, {
    radius: 11,
    damage: 20,
    color: "#ffd166",
  });
}

function fireBossSweep() {
  const count = boss.phase >= 3 ? 7 : 5;
  const startX = boss.x - boss.width * 0.32;
  const spacing = (boss.width * 0.64) / Math.max(1, count - 1);

  for (let i = 0; i < count; i += 1) {
    const sway = i % 2 === 0 ? -42 : 42;
    fireBossProjectile(startX + spacing * i, boss.y + boss.height * 0.35, sway, boss.projectileSpeed * 0.72, {
      radius: 5,
      damage: 9,
      color: "#8df7ff",
    });
  }
}

function draw() {
  const stageWidth = width();
  const stageHeight = height();
  ctx.clearRect(0, 0, stageWidth, stageHeight);

  const spaceGradient = ctx.createLinearGradient(0, 0, 0, stageHeight);
  spaceGradient.addColorStop(0, "#050714");
  spaceGradient.addColorStop(0.55, "#10091f");
  spaceGradient.addColorStop(1, "#04050c");
  ctx.fillStyle = spaceGradient;
  ctx.fillRect(0, 0, stageWidth, stageHeight);

  drawStars();
  drawPlayer();
  enemies.forEach(drawEnemy);
  drawBoss();
  powerUps.forEach(drawPowerUp);
  bullets.forEach(drawPlayerBullet);
  enemyBullets.forEach(drawEnemyBullet);
  particles.forEach(drawParticle);

  if (gameState === "start") {
    drawAttractShips();
  }
}

function drawStars() {
  stars.forEach((star) => {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  if (!player) {
    return;
  }
  if (player.invulnerable > 0 && Math.floor(player.invulnerable * 15) % 2 === 0) {
    return;
  }

  if (drawShipImage(shipImages.player, player.x, player.y, 56, 60)) {
    return;
  }

  drawPlayerFallback();
}

function drawPlayerFallback() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = "#4de3ff";
  ctx.beginPath();
  ctx.moveTo(0, -25);
  ctx.lineTo(22, 20);
  ctx.lineTo(8, 14);
  ctx.lineTo(0, 24);
  ctx.lineTo(-8, 14);
  ctx.lineTo(-22, 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f5fbff";
  ctx.fillRect(-6, -10, 12, 20);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(-3, 18, 6, 12);
  ctx.restore();
}

function drawEnemy(enemy) {
  const size = enemy.radius * (enemy.spriteKey === "boss" ? 2.8 : 2.55);

  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  if (!drawShipImage(shipImages[enemy.spriteKey], 0, 0, size, size)) {
    drawEnemyFallback(enemy);
  }

  const healthRatio = enemy.health / enemy.maxHealth;
  ctx.fillStyle = enemy.accent;
  ctx.fillRect(-16, -30, 32 * healthRatio, 3);
  ctx.restore();
}

function drawEnemyFallback(enemy) {
  ctx.fillStyle = enemy.color;
  ctx.strokeStyle = enemy.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 23);
  ctx.lineTo(24, -12);
  ctx.lineTo(8, -3);
  ctx.lineTo(0, -23);
  ctx.lineTo(-8, -3);
  ctx.lineTo(-24, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawBoss() {
  if (!boss || (bossMode !== "active" && bossMode !== "defeated")) {
    return;
  }

  ctx.save();
  ctx.translate(boss.x, boss.y);

  if (boss.hitFlash > 0 || (boss.phase > 1 && Math.floor(boss.pulseTimer * 8) % 2 === 0)) {
    ctx.globalAlpha = boss.hitFlash > 0 ? 0.72 : 0.9;
  }

  const sizePulse = boss.phase > 1 ? Math.sin(boss.pulseTimer * 8) * 3 : 0;
  if (!drawImageContain(shipImages[boss.imageKey], 0, 0, boss.width + sizePulse, boss.height + sizePulse)) {
    drawBossFallback(boss.width + sizePulse, boss.height + sizePulse);
  }

  ctx.restore();
}

function drawBossFallback(drawWidth, drawHeight) {
  const halfWidth = drawWidth / 2;
  const halfHeight = drawHeight / 2;
  ctx.fillStyle = "#210919";
  ctx.strokeStyle = "#ff4f78";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -halfHeight * 0.72);
  ctx.lineTo(halfWidth * 0.86, -halfHeight * 0.18);
  ctx.lineTo(halfWidth * 0.64, halfHeight * 0.58);
  ctx.lineTo(0, halfHeight * 0.78);
  ctx.lineTo(-halfWidth * 0.64, halfHeight * 0.58);
  ctx.lineTo(-halfWidth * 0.86, -halfHeight * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#bd3cff";
  ctx.fillRect(-halfWidth * 0.42, -halfHeight * 0.08, halfWidth * 0.84, halfHeight * 0.14);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(-halfWidth * 0.12, halfHeight * 0.42, halfWidth * 0.24, halfHeight * 0.14);
}

function drawPowerUp(powerUp) {
  ctx.save();
  ctx.translate(powerUp.x, powerUp.y);
  ctx.rotate(powerUp.spin * 0.65);

  if (powerUp.type === "dualMissile") {
    drawDualMissilePowerUpFallback();
  } else if (!drawShipImage(shipImages.powerUp, 0, 0, 34, 34)) {
    drawPowerUpFallback();
  }

  ctx.restore();
}

function drawPowerUpFallback() {
  ctx.shadowBlur = 14;
  ctx.shadowColor = "#8df7ff";
  ctx.fillStyle = "#8df7ff";
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(13, 0);
  ctx.lineTo(0, 17);
  ctx.lineTo(-13, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-3, -6, 6, 12);
}

function drawDualMissilePowerUpFallback() {
  ctx.shadowBlur = 16;
  ctx.shadowColor = "#ffd166";
  ctx.fillStyle = "#ffd166";
  ctx.strokeStyle = "#8df7ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(16, -2);
  ctx.lineTo(10, 18);
  ctx.lineTo(-10, 18);
  ctx.lineTo(-16, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#07111d";
  ctx.fillRect(-7, -7, 4, 18);
  ctx.fillRect(3, -7, 4, 18);
}

function drawShipImage(asset, x, y, drawWidth, drawHeight) {
  if (!asset?.loaded || asset.failed) {
    return false;
  }

  ctx.drawImage(asset.image, x - drawWidth / 2, y - drawHeight / 2, drawWidth, drawHeight);
  return true;
}

function drawImageContain(asset, x, y, maxWidth, maxHeight) {
  if (!asset?.loaded || asset.failed) {
    return false;
  }

  const naturalWidth = asset.image.naturalWidth || asset.image.width || maxWidth;
  const naturalHeight = asset.image.naturalHeight || asset.image.height || maxHeight;
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);
  const drawWidth = naturalWidth * scale;
  const drawHeight = naturalHeight * scale;
  ctx.drawImage(asset.image, x - drawWidth / 2, y - drawHeight / 2, drawWidth, drawHeight);
  return true;
}

function drawPlayerBullet(bullet) {
  ctx.fillStyle = bullet.color || "#ffd166";
  ctx.shadowBlur = 12;
  ctx.shadowColor = bullet.color || "#ffd166";
  ctx.fillRect(bullet.x - bullet.radius / 2, bullet.y - 12, bullet.radius, 18);
  ctx.shadowBlur = 0;
}

function drawEnemyBullet(bullet) {
  ctx.fillStyle = bullet.color || "#ff4f78";
  ctx.shadowBlur = 10;
  ctx.shadowColor = bullet.color || "#ff4f78";
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawParticle(particle) {
  const alpha = Math.max(0, particle.life / particle.maxLife);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = particle.color;
  ctx.fillRect(particle.x, particle.y, 3, 3);
  ctx.globalAlpha = 1;
}

function drawAttractShips() {
  if (!player) {
    player = { x: width() / 2, y: height() - 80, radius: 18, invulnerable: 0 };
  }
  player.x = width() / 2;
  player.y = height() - 80;
  drawPlayer();
}

function loop(now) {
  const delta = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

function setPaused(paused) {
  if (paused && gameState === "playing") {
    gameState = "paused";
    pauseScreen.classList.remove("hidden");
    pauseCurrentMusic();
  } else if (!paused && gameState === "paused") {
    gameState = "playing";
    pauseScreen.classList.add("hidden");
    lastTime = performance.now();
    resumeCurrentMusic();
  }
}

function handleKey(event, isDown) {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", " ", "a", "d", "p"].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowleft" || key === "a") {
    keys.left = isDown;
  }
  if (key === "arrowright" || key === "d") {
    keys.right = isDown;
  }
  if (key === " ") {
    keys.fire = isDown;
  }
  if (key === "p" && isDown) {
    setPaused(gameState === "playing");
  }
}

function bindTouchButton(id, press, release) {
  const button = document.getElementById(id);
  const start = (event) => {
    event.preventDefault();
    unlockAudio();
    press();
  };
  const end = (event) => {
    event.preventDefault();
    release();
  };
  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", end);
  button.addEventListener("pointercancel", end);
  button.addEventListener("pointerleave", end);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  makeStars();
  if (player) {
    player.x = Math.min(player.x, width() - 28);
    player.y = height() - 70;
  }
});

window.addEventListener("keydown", (event) => {
  unlockAudio();
  handleKey(event, true);
});
window.addEventListener("keyup", (event) => handleKey(event, false));
window.addEventListener("pointerdown", () => unlockAudio(), { once: true });

startButton.addEventListener("click", () => {
  unlockAudio();
  resetGame();
});

restartButton.addEventListener("click", () => {
  unlockAudio();
  resetGame();
});

playAgainButton.addEventListener("click", () => {
  unlockAudio();
  resetGame();
});

returnTitleButton.addEventListener("click", () => {
  unlockAudio();
  returnToTitle();
});

musicToggle.addEventListener("click", () => {
  unlockAudio();
  toggleMute();
});

bindTouchButton("touchLeft", () => {
  keys.left = true;
}, () => {
  keys.left = false;
});

bindTouchButton("touchRight", () => {
  keys.right = true;
}, () => {
  keys.right = false;
});

bindTouchButton("touchFire", () => {
  keys.fire = true;
  shootPlayer();
}, () => {
  keys.fire = false;
});

resizeCanvas();
makeStars();
updateHud();
updateMusicButton();
draw();
requestAnimationFrame(loop);
