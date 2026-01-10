/**
 * EduRace - Racing Game
 * Standalone HTML/CSS/JS Version
 */

// Game Configuration
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    TRACK_CENTER_X: 400,
    TRACK_CENTER_Y: 300,
    TRACK_OUTER_RADIUS: 250,
    TRACK_INNER_RADIUS: 150,
    PLAYER_ACCELERATION: 0.15,
    PLAYER_MAX_SPEED: 5,
    PLAYER_FRICTION: 0.98,
    PLAYER_TURN_SPEED: 0.05,
    BOT_BASE_SPEED: 2.5,
    TOTAL_LAPS: 1,
    BONUS_POINTS: 200,
};

// Game State
const gameState = {
    status: 'countdown', // countdown, playing, finished, gameover
    countdown: 3,
    currentLap: 1,
    points: 0,
    playerPosition: 1,
    checkpointPassed: false,
};

// Player
const player = {
    x: CONFIG.TRACK_CENTER_X + 200,
    y: CONFIG.TRACK_CENTER_Y,
    angle: -Math.PI / 2,
    speed: 0,
    color: '#10b981',
    name: 'You',
    isPlayer: true,
};

// Bots
const bots = [
    { id: 'bot1', name: 'AI Racer', x: 0, y: 0, angle: 0, speed: 2.3, color: '#ef4444', progress: 0 },
    { id: 'bot2', name: 'Bot Speed', x: 0, y: 0, angle: 0, speed: 2.5, color: '#f59e0b', progress: Math.PI / 4 },
    { id: 'bot3', name: 'Cyber Driver', x: 0, y: 0, angle: 0, speed: 2.2, color: '#8b5cf6', progress: Math.PI / 2 },
];

// Obstacles
const obstacles = [
    { angle: Math.PI / 4, radius: 200 },
    { angle: Math.PI, radius: 200 },
    { angle: Math.PI * 1.5, radius: 205 },
];

// Input handling
const keys = new Set();

// Canvas elements
let gameCanvas, gameCtx;
let mapCanvas, mapCtx;

// Initialize game
function init() {
    gameCanvas = document.getElementById('game-canvas');
    gameCtx = gameCanvas.getContext('2d');
    mapCanvas = document.getElementById('map-canvas');
    mapCtx = mapCanvas.getContext('2d');

    // Force mini-map visibility (in case CSS is cached)
    const miniMap = document.getElementById('mini-map');
    if (miniMap) {
        miniMap.style.display = 'block';
        miniMap.style.right = '20px';
        miniMap.style.top = '20px';
        miniMap.style.zIndex = '100';
    }

    // Initialize bot positions
    bots.forEach((bot, index) => {
        const angle = bot.progress;
        bot.x = CONFIG.TRACK_CENTER_X + Math.cos(angle) * 200;
        bot.y = CONFIG.TRACK_CENTER_Y + Math.sin(angle) * 200;
        bot.angle = angle + Math.PI / 2;
    });

    // Set up input handlers
    setupInputHandlers();

    // Start countdown
    startCountdown();
}

function setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
        keys.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
        keys.delete(e.key.toLowerCase());
    });
}

function startCountdown() {
    const countdownEl = document.getElementById('countdown-number');
    const overlay = document.getElementById('countdown-overlay');

    const countdownInterval = setInterval(() => {
        gameState.countdown--;
        countdownEl.textContent = gameState.countdown;

        if (gameState.countdown <= 0) {
            clearInterval(countdownInterval);
            overlay.classList.add('hidden');
            gameState.status = 'playing';
            gameLoop();
        }
    }, 1000);
}

function gameLoop() {
    if (gameState.status !== 'playing') return;

    // Clear canvas
    gameCtx.fillStyle = '#1e293b';
    gameCtx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Draw track
    drawTrack();

    // Update player
    updatePlayer();

    // Update bots
    updateBots();

    // Draw all players
    drawPlayers();

    // Check collisions
    checkCollisions();

    // Update HUD
    updateHUD();

    // Draw mini-map
    drawMiniMap();

    // Draw leaderboard
    updateLeaderboard();

    // Continue loop
    requestAnimationFrame(gameLoop);
}

function drawTrack() {
    const ctx = gameCtx;
    const centerX = CONFIG.TRACK_CENTER_X;
    const centerY = CONFIG.TRACK_CENTER_Y;

    // Outer track border
    ctx.beginPath();
    ctx.arc(centerX, centerY, CONFIG.TRACK_OUTER_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 80;
    ctx.stroke();

    // Track surface
    ctx.beginPath();
    ctx.arc(centerX, centerY, CONFIG.TRACK_OUTER_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 78;
    ctx.stroke();

    // Inner grass
    ctx.beginPath();
    ctx.arc(centerX, centerY, CONFIG.TRACK_INNER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();

    // Inner grass detail
    ctx.beginPath();
    ctx.arc(centerX, centerY, CONFIG.TRACK_INNER_RADIUS - 5, 0, Math.PI * 2);
    ctx.fillStyle = '#16a34a';
    ctx.fill();

    // Track markers
    for (let i = 0; i < 36; i++) {
        const angle = (i * Math.PI * 2) / 36;
        const x = centerX + Math.cos(angle) * 200;
        const y = centerY + Math.sin(angle) * 200;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#fff';
        ctx.fill();
    }

    // Start/Finish line
    ctx.fillStyle = '#fff';
    ctx.fillRect(centerX + 150, centerY - 5, 100, 10);

    // Checkered pattern
    for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
            ctx.fillStyle = '#000';
            ctx.fillRect(centerX + 150 + i * 10, centerY - 5, 10, 5);
            ctx.fillRect(centerX + 150 + i * 10 + 5, centerY, 5, 5);
        }
    }

    // Draw obstacles
    obstacles.forEach((obs) => {
        const x = centerX + Math.cos(obs.angle) * obs.radius;
        const y = centerY + Math.sin(obs.angle) * obs.radius;

        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.stroke();
    });
}

function updatePlayer() {
    // Acceleration
    if (keys.has('arrowup') || keys.has('w')) {
        player.speed = Math.min(player.speed + CONFIG.PLAYER_ACCELERATION, CONFIG.PLAYER_MAX_SPEED);
    }
    if (keys.has('arrowdown') || keys.has('s')) {
        player.speed = Math.max(player.speed - CONFIG.PLAYER_ACCELERATION, -CONFIG.PLAYER_MAX_SPEED / 2);
    }

    // Turning
    if (keys.has('arrowleft') || keys.has('a')) {
        player.angle -= CONFIG.PLAYER_TURN_SPEED * (player.speed > 0 ? 1 : -1);
    }
    if (keys.has('arrowright') || keys.has('d')) {
        player.angle += CONFIG.PLAYER_TURN_SPEED * (player.speed > 0 ? 1 : -1);
    }

    // Apply friction
    player.speed *= CONFIG.PLAYER_FRICTION;

    // Update position
    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;
}

function updateBots() {
    const centerX = CONFIG.TRACK_CENTER_X;
    const centerY = CONFIG.TRACK_CENTER_Y;

    bots.forEach((bot) => {
        // Update progress (angle around track)
        bot.progress += bot.speed * 0.01;

        // Calculate position on track
        const radius = 200;
        bot.x = centerX + Math.cos(bot.progress) * radius;
        bot.y = centerY + Math.sin(bot.progress) * radius;
        bot.angle = bot.progress + Math.PI / 2;
    });
}

function drawPlayers() {
    const allPlayers = [player, ...bots];

    allPlayers.forEach((p) => {
        gameCtx.save();
        gameCtx.translate(p.x, p.y);
        gameCtx.rotate(p.angle + Math.PI / 2);

        // Car body
        gameCtx.fillStyle = p.color;
        gameCtx.fillRect(-10, -15, 20, 30);

        // Windshield
        gameCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        gameCtx.fillRect(-7, -12, 14, 10);

        // Wheels
        gameCtx.fillStyle = '#1f2937';
        gameCtx.fillRect(-12, -10, 4, 8);
        gameCtx.fillRect(8, -10, 4, 8);
        gameCtx.fillRect(-12, 5, 4, 8);
        gameCtx.fillRect(8, 5, 4, 8);

        gameCtx.restore();

        // Player indicator
        if (p.isPlayer) {
            gameCtx.beginPath();
            gameCtx.arc(p.x, p.y - 25, 8, 0, Math.PI * 2);
            gameCtx.fillStyle = '#fbbf24';
            gameCtx.fill();
            gameCtx.fillStyle = '#fff';
            gameCtx.font = 'bold 10px sans-serif';
            gameCtx.textAlign = 'center';
            gameCtx.fillText('★', p.x, p.y - 22);
        }
    });
}

function checkCollisions() {
    const centerX = CONFIG.TRACK_CENTER_X;
    const centerY = CONFIG.TRACK_CENTER_Y;

    // Distance from center
    const distFromCenter = Math.sqrt(
        Math.pow(player.x - centerX, 2) +
        Math.pow(player.y - centerY, 2)
    );

    // Check track boundaries
    if (distFromCenter < CONFIG.TRACK_INNER_RADIUS || distFromCenter > CONFIG.TRACK_OUTER_RADIUS) {
        endGame(false);
        return;
    }

    // Check obstacles
    obstacles.forEach((obs) => {
        const obsX = centerX + Math.cos(obs.angle) * obs.radius;
        const obsY = centerY + Math.sin(obs.angle) * obs.radius;
        const dist = Math.sqrt(
            Math.pow(player.x - obsX, 2) +
            Math.pow(player.y - obsY, 2)
        );

        if (dist < 25) {
            endGame(false);
        }
    });

    // Check lap completion
    const playerAngle = Math.atan2(player.y - centerY, player.x - centerX);

    // Checkpoint system
    if (playerAngle > Math.PI * 0.8 && !gameState.checkpointPassed) {
        gameState.checkpointPassed = true;
    }

    if (playerAngle > -0.5 && playerAngle < 0.5 && gameState.checkpointPassed) {
        endGame(true);
    }
}

function endGame(completed) {
    gameState.status = completed ? 'finished' : 'gameover';

    if (completed) {
        gameState.points += CONFIG.BONUS_POINTS;
        document.getElementById('finish-overlay').classList.remove('hidden');
    } else {
        document.getElementById('gameover-overlay').classList.remove('hidden');
    }

    // Notify parent (when embedded in Next.js)
    if (window.parent !== window) {
        window.parent.postMessage({
            type: 'gameEnd',
            completed: completed,
            points: gameState.points
        }, '*');
    }
}

function updateHUD() {
    document.getElementById('lap-counter').textContent = `${gameState.currentLap}/${CONFIG.TOTAL_LAPS}`;
    document.getElementById('points-counter').textContent = gameState.points;

    // Calculate position
    const allPlayers = [
        { id: 'player', progress: getPlayerProgress() },
        ...bots.map(b => ({ id: b.id, progress: b.progress }))
    ].sort((a, b) => b.progress - a.progress);

    const pos = allPlayers.findIndex(p => p.id === 'player') + 1;
    gameState.playerPosition = pos;
    document.getElementById('position-counter').textContent = `#${pos}`;
}

function getPlayerProgress() {
    const centerX = CONFIG.TRACK_CENTER_X;
    const centerY = CONFIG.TRACK_CENTER_Y;
    return Math.atan2(player.y - centerY, player.x - centerX);
}

function drawMiniMap() {
    const ctx = mapCtx;
    const scale = 0.2;
    const offsetX = 50;
    const offsetY = 50;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 100, 100);

    // Track
    ctx.beginPath();
    ctx.arc(offsetX, offsetY, 25, 0, Math.PI * 2);
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Players
    const allPlayers = [player, ...bots];
    allPlayers.forEach((p) => {
        const mapX = (p.x - CONFIG.TRACK_CENTER_X) * scale + offsetX;
        const mapY = (p.y - CONFIG.TRACK_CENTER_Y) * scale + offsetY;

        ctx.beginPath();
        ctx.arc(mapX, mapY, p.isPlayer ? 5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        if (p.isPlayer) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });
}

function updateLeaderboard() {
    const leaderboardEl = document.getElementById('leaderboard-list');

    const allPlayers = [
        { name: 'You', isPlayer: true, progress: getPlayerProgress() },
        ...bots.map(b => ({ name: b.name, isPlayer: false, progress: b.progress }))
    ].sort((a, b) => b.progress - a.progress);

    leaderboardEl.innerHTML = allPlayers.map((p, index) => `
    <div class="leaderboard-item ${p.isPlayer ? 'player' : ''}">
      <span class="rank-badge ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-default'}">
        ${index + 1}
      </span>
      <span class="player-name">${p.name}</span>
    </div>
  `).join('');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
