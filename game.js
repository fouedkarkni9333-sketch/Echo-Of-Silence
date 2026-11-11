const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let highScore = localStorage.getItem("echo_high_score") || 0;
document.getElementById("high-score").innerText = highScore;

let isPlaying = true;
let visibilityFrames = 0;
let baseSpeed = 4;
let currentLevel = 1;

// بيانات البطل
const player = {
    x: 50,
    y: 380,
    size: 26,
    velocityY: 0,
    gravity: 0.65,
    jumpPower: -11.5,
    isGrounded: true,
    color: "#00f3ff"
};

let obstacles = [];
let particles = [];
let echoRings = [];
let frameCounter = 0;

// ألوان ومؤثرات المستويات
const levelThemes = [
    { bg: "#04060c", player: "#00f3ff", obs: "#ff2a5f", light: "0, 243, 255" },
    { bg: "#0a0412", player: "#b055ff", obs: "#ffaa00", light: "176, 85, 255" },
    { bg: "#0c0303", player: "#ff3366", obs: "#00ffcc", light: "255, 51, 102" }
];

function getTheme() {
    return levelThemes[Math.min(currentLevel - 1, levelThemes.length - 1)];
}

function spawnObstacle() {
    const height = Math.floor(Math.random() * 40) + 30;
    obstacles.push({
        x: canvas.width,
        y: 410 - height,
        width: 24,
        height: height,
        passed: false
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.5) * 7,
            size: Math.random() * 4 + 2,
            life: 25,
            color: color
        });
    }
}

// كشف الخريطة والقفز
function triggerEcho() {
    visibilityFrames = 45;
    const theme = getTheme();

    echoRings.push({
        x: player.x + player.size / 2,
        y: player.y + player.size / 2,
        radius: 10,
        maxRadius: 220,
        alpha: 1,
        color: theme.player
    });

    if (player.isGrounded) {
        player.velocityY = player.jumpPower;
        player.isGrounded = false;
        createParticles(player.x + 13, player.y + 26, theme.player);
    }
}

function update() {
    if (!isPlaying) return;

    currentLevel = Math.floor(score / 50) + 1;
    let speed = baseSpeed + (currentLevel - 1) * 1.2;

    player.velocityY += player.gravity;
    player.y += player.velocityY;

    if (player.y >= 380) {
        player.y = 380;
        player.velocityY = 0;
        player.isGrounded = true;
    }

    frameCounter++;
    let spawnRate = Math.max(45, 90 - (currentLevel * 7));
    if (frameCounter % Math.floor(spawnRate) === 0) {
        spawnObstacle();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= speed;

        // اصطدام
        if (
            player.x < obs.x + obs.width &&
            player.x + player.size > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.size > obs.y
        ) {
            createParticles(player.x + 13, player.y + 13, "#ff2a5f");
            gameOver();
        }

        if (obs.x + obs.width < player.x && !obs.passed) {
            obs.passed = true;
            score += 10;
            document.getElementById("score").innerText = score;
        }

        if (obs.x < -40) {
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
        r.radius += 7;
        r.alpha -= 0.025;
        if (r.alpha <= 0) echoRings.splice(index, 1);
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    const theme = getTheme();

    // 1. خلفية الظلام
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. الأرضية
    ctx.fillStyle = "#12131a";
    ctx.fillRect(0, 406, canvas.width, 74);
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(0, 404, canvas.width, 2);

    // 3. إضاءة واقعية متدرجة (Dynamic Radial Lighting)
    if (visibilityFrames > 0 || echoRings.length > 0) {
        let currentRadius = (45 - visibilityFrames) * 5 + 30;
        let gradient = ctx.createRadialGradient(
            player.x + 13, player.y + 13, 10,
            player.x + 13, player.y + 13, Math.max(50, currentRadius)
        );
        gradient.addColorStop(0, `rgba(${theme.light}, 0.35)`);
        gradient.addColorStop(0.5, `rgba(${theme.light}, 0.1)`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 4. رسم الجزيئات الحركية
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.shadowBlur = 0;

    // 5. إظهار العناصر الواقعية أثناء الصدى
    if (visibilityFrames > 0) {
        // البطل المتوهج
        ctx.fillStyle = theme.player;
        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.player;
        ctx.fillRect(player.x, player.y, player.size, player.size);

        // العقبات الفسفورية
        ctx.shadowBlur = 12;
        ctx.shadowColor = theme.obs;
        ctx.fillStyle = theme.obs;
        obstacles.forEach(obs => {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });

        ctx.shadowBlur = 0;
        visibilityFrames--;
    } else {
        // خيال بسيط جداً للبطل
        ctx.fillStyle = `rgba(${theme.light}, 0.18)`;
        ctx.fillRect(player.x, player.y, player.size, player.size);
    }
}

function gameOver() {
    isPlaying = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("echo_high_score", highScore);
        document.getElementById("high-score").innerText = highScore;
    }
    setTimeout(() => {
        alert(`انتهت اللعبة عند المستوى ${currentLevel}! النتيجة: ${score}`);
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
    player.y = 380;
    isPlaying = true;
    update();
}

// 🎤 نظام التقاط صوت الإنسان الفعلي (Voice Pitch & Voice Frequency Filter)
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

        document.getElementById("mic-status").innerText = "🎤 تم تفعيل فلتر الصوت البشري! اللعبة تتفاعل مع صوتك فقط وتقاوم الضوضاء.";
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

                // نطاق الترددات الخاص بصوت الإنسان والصفير الفعلي (85Hz - 2000Hz)
                if (frequency >= 85 && frequency <= 2000) {
                    humanVoiceEnergy += volume;
                }
            }

            let voiceRatio = humanVoiceEnergy / (totalEnergy || 1);
            let avgHumanVolume = humanVoiceEnergy / (bufferLength / 4);

            let now = Date.now();

            // يتفاعل فقط إذا كان الصوت ينتمي لتردد الصوت البشري وشدته أعلى من الضجيج
            if (avgHumanVolume > 35 && voiceRatio > 0.55 && (now - lastTriggerTime > 280)) {
                triggerEcho();
                lastTriggerTime = now;
            }

            requestAnimationFrame(checkHumanVoice);
        }
        checkHumanVoice();
    } catch (err) {
        alert("تعذر استخدام الميكروفون، يمكنك
