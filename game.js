const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let highScore = localStorage.getItem("echo_high_score") || 0;
document.getElementById("high-score").innerText = highScore;

let isPlaying = true;
let visibilityFrames = 0;
let baseSpeed = 3.5;
let currentLevel = 1;

// Player Data
const player = {
    x: 80,
    y: 240,
    radius: 16,
    velocityY: 0,
    gravity: 0.5,
    jumpPower: -9.5,
    rotation: 0
};

let obstacles = [];
let particles = [];
let echoRings = [];
let frameCounter = 0;

// Level Themes
const levelThemes = [
    { bg: "#0d1117", pipe: "#238636", pipeGlow: "#2ea043", player: "#58a6ff" },
    { bg: "#1f1025", pipe: "#8957e5", pipeGlow: "#a371f7", player: "#f0883e" },
    { bg: "#2d1111", pipe: "#da3633", pipeGlow: "#f85149", player: "#3fb950" }
];

function getTheme() {
    return levelThemes[Math.min(currentLevel - 1, levelThemes.length - 1)];
}

function spawnObstacle() {
    const gapHeight = 130;
    const minHeight = 50;
    const maxHeight = canvas.height - gapHeight - 100;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    obstacles.push({
        x: canvas.width,
        top: topHeight,
        bottom: topHeight + gapHeight,
        width: 45,
        passed: false
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 5 + 2,
            life: 30,
            color: color
        });
    }
}

function triggerEcho() {
    visibilityFrames = 50;
    player.velocityY = player.jumpPower;
    
    echoRings.push({
        x: player.x,
        y: player.y,
        radius: 10,
        maxRadius: 250,
        alpha: 1,
        color: getTheme().player
    });

    createParticles(player.x, player.y, getTheme().player);
}

function update() {
    if (!isPlaying) return;

    currentLevel = Math.floor(score / 50) + 1;
    let speed = baseSpeed + (currentLevel - 1) * 0.8;

    player.velocityY += player.gravity;
    player.y += player.velocityY;
    player.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, player.velocityY * 0.08));

    if (player.y > canvas.height - 50 || player.y < 20) {
        gameOver();
    }

    frameCounter++;
    let spawnRate = Math.max(70, 120 - (currentLevel * 10));
    if (frameCounter % Math.floor(spawnRate) === 0) {
        spawnObstacle();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= speed;

        if (
            player.x + player.radius > obs.x &&
            player.x - player.radius < obs.x + obs.width &&
            (player.y - player.radius < obs.top || player.y + player.radius > obs.bottom)
        ) {
            createParticles(player.x, player.y, "#ff5858");
            gameOver();
        }

        if (obs.x + obs.width < player.x && !obs.passed) {
            obs.passed = true;
            score += 10;
            document.getElementById("score").innerText = score;
        }

        if (obs.x < -60) {
            obstacles.splice(i, 1);
        }
    }

    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(index, 1);
    });

    echoRings.forEach((r, index) => {
        r.radius += 8;
        r.alpha -= 0.025;
        if (r.alpha <= 0) echoRings.splice(index, 1);
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    const theme = getTheme();

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (visibilityFrames > 0 || echoRings.length > 0) {
        let currentRadius = (50 - visibilityFrames) * 5 + 40;
        let gradient = ctx.createRadialGradient(
            player.x, player.y, 10,
            player.x, player.y, Math.max(60, currentRadius)
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, 0.25)`);
        gradient.addColorStop(0.5, `rgba(88, 166, 255, 0.1)`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.shadowBlur = 0;

    if (visibilityFrames > 0) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.pipeGlow;
        ctx.fillStyle = theme.pipe;

        obstacles.forEach(obs => {
            ctx.fillRect(obs.x, 0, obs.width, obs.top);
            ctx.fillRect(obs.x, obs.bottom, obs.width, canvas.height - obs.bottom);
        });
        ctx.shadowBlur = 0;

        drawRealisticPlayer(player.x, player.y, true);
        visibilityFrames--;
    } else {
        drawRealisticPlayer(player.x, player.y, false);
    }

    ctx.fillStyle = "#161b22";
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
}

function drawRealisticPlayer(x, y, isVisible) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(player.rotation);

    let alpha = isVisible ? 1 : 0.2;
    const theme = getTheme();

    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = isVisible ? theme.player : `rgba(88, 166, 255, ${alpha})`;
    if (isVisible) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.player;
    }
    ctx.fill();

    ctx.beginPath();
    ctx.arc(6, -4, 4, 0, Math.PI * 2);
    ctx.fillStyle = isVisible ? "#ffffff" : `rgba(255,255,255,${alpha})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(7, -4, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#000000";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(20, 3);
    ctx.lineTo(12, 6);
    ctx.fillStyle = isVisible ? "#ff9800" : `rgba(255,152,0,${alpha})`;
    ctx.fill();

    ctx.restore();
}

function gameOver() {
    isPlaying = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("echo_high_score", highScore);
        document.getElementById("high-score").innerText = highScore;
    }
    setTimeout(() => {
        alert(`Game Over! Score: ${score}`);
        resetGame();
    }, 150);
}

function resetGame() {
    score = 0;
    currentLevel = 1;
    obstacles = [];
    particles = [];
    echoRings = [];
    document.getElementById("score").innerText = score;
    player.y = 240;
    player.velocityY = 0;
    isPlaying = true;
    update();
}

// Microphone Human Voice Filter
async function initMic() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 512;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const sampleRate = audioContext.sampleRate;

        document.getElementById("mic-status").innerText = "Microphone Active (Human Voice Filter Enabled)!";
        document.getElementById("mic-btn").style.display = "none";

        let lastTriggerTime = 0;

        function checkHumanVoice() {
            analyser.getByteFrequencyData(dataArray);

            let humanVoiceEnergy = 0;
            let totalEnergy = 0;

            for (let i = 0; i < bufferLength; i++) {
                let frequency = (i * sampleRate) / analyser.fftSize;
                let volume = dataArray[i];

                totalEnergy += volume;
                if (frequency >= 85 && frequency <= 2000) {
                    humanVoiceEnergy += volume;
                }
            }

            let voiceRatio = humanVoiceEnergy / (totalEnergy || 1);
            let avgHumanVolume = humanVoiceEnergy / (bufferLength / 4);

            let now = Date.now();

            if (avgHumanVolume > 30 && voiceRatio > 0.5 && (now - lastTriggerTime > 260)) {
                triggerEcho();
                lastTriggerTime = now;
            }

            requestAnimationFrame(checkHumanVoice);
        }
        checkHumanVoice();
    } catch (err) {
        alert("Microphone access denied. You can play using the tap button.");
    }
}

update();
