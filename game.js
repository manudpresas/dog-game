// === Flappy Dog Game ===

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreDisplay = document.getElementById('score-display');
const finalScore = document.getElementById('final-score');
const bestScore = document.getElementById('best-score');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// === Game Constants ===
const GRAVITY = 0.45;
const FLAP_FORCE = -7.5;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_INTERVAL = 1800;
const GROUND_HEIGHT = 80;
const DOG_SIZE = 35;

// === Game State ===
let dog = { x: 80, y: 250, velocity: 0, rotation: 0, flapFrame: 0 };
let pipes = [];
let particles = [];
let score = 0;
let highScore = 0;
let gameState = 'menu'; // menu, playing, gameover
let lastPipeSpawn = 0;
let groundOffset = 0;
let frameCount = 0;

// === Audio (Web Audio API) ===
let audioCtx;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(freq, duration, type = 'square') {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function flapSound() { playSound(440, 0.1, 'sine'); }
function scoreSound() { playSound(880, 0.15, 'sine'); }
function hitSound() { playSound(200, 0.3, 'square'); }

// === Drawing Functions ===

// Sky gradient
function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height - GROUND_HEIGHT);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(0.5, '#B0E0E6');
  gradient.addColorStop(1, '#E0F0E8');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height - GROUND_HEIGHT);
}

// Clouds
function drawClouds() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  const cloudPositions = [
    { x: (frameCount * 0.3) % (canvas.width + 100) - 50, y: 60, w: 80, h: 30 },
    { x: (frameCount * 0.2 + 200) % (canvas.width + 120) - 60, y: 120, w: 100, h: 35 },
    { x: (frameCount * 0.15 + 100) % (canvas.width + 90) - 45, y: 40, w: 70, h: 25 },
  ];
  cloudPositions.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x - c.w * 0.25, c.y + 5, c.w * 0.3, c.h * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + c.w * 0.25, c.y + 3, c.w * 0.35, c.h * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Ground
function drawGround() {
  // Dirt
  const dirtGradient = ctx.createLinearGradient(0, canvas.height - GROUND_HEIGHT, 0, canvas.height);
  dirtGradient.addColorStop(0, '#5a8a3c');
  dirtGradient.addColorStop(0.15, '#4a7a2c');
  dirtGradient.addColorStop(0.3, '#8B6914');
  dirtGradient.addColorStop(1, '#6B4912');
  ctx.fillStyle = dirtGradient;
  ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

  // Grass tufts
  ctx.fillStyle = '#5a9e3f';
  for (let x = -groundOffset % 20; x < canvas.width; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - GROUND_HEIGHT);
    ctx.lineTo(x + 5, canvas.height - GROUND_HEIGHT - 12);
    ctx.lineTo(x + 10, canvas.height - GROUND_HEIGHT);
    ctx.fill();
  }

  // Ground line
  ctx.strokeStyle = '#3a6a1c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - GROUND_HEIGHT);
  ctx.lineTo(canvas.width, canvas.height - GROUND_HEIGHT);
  ctx.stroke();
}

// Dog character
function drawDog() {
  ctx.save();
  ctx.translate(dog.x, dog.y);

  // Rotation based on velocity
  const targetRotation = Math.min(Math.max(dog.velocity * 3, -30), 70);
  dog.rotation += (targetRotation - dog.rotation) * 0.1;
  ctx.rotate(dog.rotation * Math.PI / 180);

  const s = DOG_SIZE;

  // Body (golden/brown)
  ctx.fillStyle = '#D4A035';
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.6, s * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  ctx.fillStyle = '#F5DEB3';
  ctx.beginPath();
  ctx.ellipse(2, 5, s * 0.35, s * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#D4A035';
  ctx.beginPath();
  ctx.arc(s * 0.4, -s * 0.15, s * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.fillStyle = '#C49428';
  ctx.beginPath();
  ctx.ellipse(s * 0.62, -s * 0.05, s * 0.18, s * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.ellipse(s * 0.72, -s * 0.08, s * 0.07, s * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(s * 0.38, -s * 0.28, s * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(s * 0.4, -s * 0.27, s * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(s * 0.42, -s * 0.3, s * 0.025, 0, Math.PI * 2);
  ctx.fill();

  // Ears (floppy!)
  ctx.fillStyle = '#B8862D';
  ctx.beginPath();
  ctx.ellipse(s * 0.2, -s * 0.4, s * 0.12, s * 0.2, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.55, -s * 0.42, s * 0.1, s * 0.18, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Mouth (happy!)
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(s * 0.58, -s * 0.0, s * 0.1, 0, Math.PI * 0.8);
  ctx.stroke();

  // Tongue (when flapping)
  if (dog.flapFrame > 0) {
    ctx.fillStyle = '#FF6B8A';
    ctx.beginPath();
    ctx.ellipse(s * 0.65, s * 0.08, s * 0.06, s * 0.1 * (dog.flapFrame / 10), 0.2, 0, Math.PI * 2);
    ctx.fill();
    dog.flapFrame--;
  }

  // Tail (wagging)
  const tailWag = Math.sin(frameCount * 0.3) * 15;
  ctx.strokeStyle = '#D4A035';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.05);
  ctx.quadraticCurveTo(
    -s * 0.7, -s * 0.3 + tailWag * 0.02,
    -s * 0.65, -s * 0.45 + tailWag * 0.01
  );
  ctx.stroke();

  // Legs
  const legAnim = Math.sin(frameCount * 0.4) * 8;
  ctx.fillStyle = '#C49428';

  // Front legs
  ctx.fillRect(s * 0.15, s * 0.2, 6, 14 + (gameState === 'playing' ? legAnim : 0));
  ctx.fillRect(s * 0.3, s * 0.2, 6, 14 - (gameState === 'playing' ? legAnim : 0));

  // Back legs
  ctx.fillRect(-s * 0.3, s * 0.18, 7, 15 - (gameState === 'playing' ? legAnim * 0.8 : 0));
  ctx.fillRect(-s * 0.15, s * 0.18, 7, 15 + (gameState === 'playing' ? legAnim * 0.8 : 0));

  // Paws
  ctx.fillStyle = '#8B6914';
  [s * 0.15, s * 0.3, -s * 0.3, -s * 0.15].forEach((lx, i) => {
    const ly = s * 0.2 + 14 + (gameState === 'playing' ? (i % 2 === 0 ? legAnim : -legAnim) * (i < 2 ? 1 : 0.8) : 0);
    ctx.beginPath();
    ctx.ellipse(lx + 3, ly, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// Pipes
function drawPipes() {
  pipes.forEach(pipe => {
    // Pipe body gradient
    const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
    pipeGrad.addColorStop(0, '#2ecc40');
    pipeGrad.addColorStop(0.3, '#5dde6e');
    pipeGrad.addColorStop(0.7, '#2ecc40');
    pipeGrad.addColorStop(1, '#1fa030');

    // Top pipe
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

    // Top pipe cap
    ctx.fillStyle = '#27ae35';
    ctx.fillRect(pipe.x - 5, pipe.topHeight - 25, PIPE_WIDTH + 10, 25);
    ctx.strokeStyle = '#1a7a25';
    ctx.lineWidth = 2;
    ctx.strokeRect(pipe.x - 5, pipe.topHeight - 25, PIPE_WIDTH + 10, 25);

    // Bottom pipe
    const bottomY = pipe.topHeight + PIPE_GAP;
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, canvas.height - bottomY - GROUND_HEIGHT);

    // Bottom pipe cap
    ctx.fillStyle = '#27ae35';
    ctx.fillRect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 25);
    ctx.strokeStyle = '#1a7a25';
    ctx.lineWidth = 2;
    ctx.strokeRect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 25);
  });
}

// Particles
function drawParticles() {
  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
    if (p.life <= 0) { particles.splice(i, 1); return; }
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      size: Math.random() * 4 + 2,
      color,
      life: 1
    });
  }
}

// === Game Logic ===

function flap() {
  if (gameState !== 'playing') return;
  initAudio();
  dog.velocity = FLAP_FORCE;
  dog.flapFrame = 10;
  flapSound();
  spawnParticles(dog.x - 10, dog.y + 10, '#F5DEB3', 3);
}

function spawnPipe() {
  const minTop = 80;
  const maxTop = canvas.height - GROUND_HEIGHT - PIPE_GAP - 80;
  const topHeight = Math.random() * (maxTop - minTop) + minTop;
  pipes.push({ x: canvas.width, topHeight, scored: false });
}

function checkCollision() {
  const dogLeft = dog.x - DOG_SIZE * 0.5;
  const dogRight = dog.x + DOG_SIZE * 0.5;
  const dogTop = dog.y - DOG_SIZE * 0.4;
  const dogBottom = dog.y + DOG_SIZE * 0.4;

  // Ground / ceiling
  if (dogBottom >= canvas.height - GROUND_HEIGHT || dogTop <= 0) return true;

  // Pipes
  for (const pipe of pipes) {
    const pipeLeft = pipe.x - 5;
    const pipeRight = pipe.x + PIPE_WIDTH + 5;
    const gapTop = pipe.topHeight;
    const gapBottom = pipe.topHeight + PIPE_GAP;

    if (dogRight > pipeLeft && dogLeft < pipeRight) {
      if (dogTop < gapTop || dogBottom > gapBottom) return true;
    }
  }
  return false;
}

function gameOver() {
  gameState = 'gameover';
  hitSound();
  spawnParticles(dog.x, dog.y, '#e74c3c', 15);

  if (score > highScore) highScore = score;

  finalScore.textContent = score;
  bestScore.textContent = highScore;
  gameOverScreen.classList.remove('hidden');
  scoreDisplay.classList.remove('visible');
}

function startGame() {
  dog = { x: 80, y: 250, velocity: 0, rotation: 0, flapFrame: 0 };
  pipes = [];
  particles = [];
  score = 0;
  lastPipeSpawn = 0;
  frameCount = 0;
  gameState = 'playing';

  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  scoreDisplay.textContent = '0';
  scoreDisplay.classList.add('visible');

  initAudio();
}

// === Main Loop ===
function update() {
  if (gameState !== 'playing') return;

  frameCount++;
  groundOffset = (groundOffset + PIPE_SPEED) % 20;

  // Dog physics
  dog.velocity += GRAVITY;
  dog.y += dog.velocity;

  // Spawn pipes
  lastPipeSpawn += 16.67;
  if (lastPipeSpawn >= PIPE_SPAWN_INTERVAL) {
    spawnPipe();
    lastPipeSpawn = 0;
  }

  // Move pipes
  pipes.forEach(pipe => {
    pipe.x -= PIPE_SPEED;

    // Scoring
    if (!pipe.scored && pipe.x + PIPE_WIDTH < dog.x) {
      pipe.scored = true;
      score++;
      scoreDisplay.textContent = score;
      scoreSound();
      spawnParticles(dog.x, dog.y - 20, '#f1c40f', 5);
    }
  });

  // Remove off-screen pipes
  pipes = pipes.filter(p => p.x + PIPE_WIDTH > -10);

  // Collision
  if (checkCollision()) gameOver();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawSky();
  drawClouds();
  drawPipes();
  drawGround();
  drawDog();
  drawParticles();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// === Controls ===
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (gameState === 'menu') startGame();
    else if (gameState === 'playing') flap();
    else if (gameState === 'gameover') startGame();
  }
});

canvas.addEventListener('click', () => {
  if (gameState === 'playing') flap();
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (gameState === 'playing') flap();
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// === Start ===
gameLoop();
