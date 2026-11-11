const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let highScore = localStorage.getItem("echo_high_score") || 0;
document.getElementById("high-score").innerText = highScore;

let isPlaying = true;
let visibilityFrames = 0;
let baseSpeed = 4;
let currentLevel = 1;

// بيانات البطل (الإنسان الواقعي)
const player = {
    x: 60,
    y: 360,
    width: 22,
    height: 38,
    velocityY: 0,
    gravity: 0.65,
    jumpPower: -11.5,
    isGrounded: true,
    animFrame: 0
};

let obstacles = [];
let particles = [];
let echoRings = [];
let frameCounter = 0;

// ألوان ومؤثرات المستويات
const levelThemes = [
    { bg: "#04060c", obs: "#ff2a5f", light: "0, 243, 255" },
    { bg: "#0a0412", obs: "#ffaa00", light: "176, 85, 255" },
    { bg: "#0c0303", obs: "#00ffcc", light: "255, 51, 102" }
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
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            life: 25,
            color: color
        });
    }
}

// كشف الخريطة والقفز البشري
function triggerEcho() {
    visibilityFrames = 45;
    
    echoRings.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        radius: 10,
        maxRadius: 220,
        alpha: 1,
        color: "#00f3ff"
    });

    if (player.isGrounded) {
        player.velocityY = player.jumpPower;
        player.isGrounded = false;
        createParticles(player.x + 11, player.y + 38, "#00f3ff");
    }
}

function update() {
    if (!isPlaying) return;

    currentLevel = Math.floor(score / 50) + 1;
    let speed = baseSpeed + (currentLevel - 1) * 1.2;

    // الجاذبية وحركة الإنسان الواقعية
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    if (player.y >= 360) {
        player.y = 360;
        player.velocityY = 0;
        player.isGrounded = true;
    }

    // حركة الأرجل أثناء الجري
    if (player.isGrounded) {
        player.animFrame += 0.2;
    }

    frameCounter++;
    let spawnRate = Math.max(45, 90 - (currentLevel * 7));
    if (frameCounter % Math.floor(spawnRate) === 0) {
        spawnObstacle();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= speed;

        // فحص الاصطدام بدقة مع حجم الإنسان
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            createParticles(player.x + 11, player.y + 19, "#ff2a5f");
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

    // 3. إضاءة الصدى الدائرية
    if (visibilityFrames > 0 || echoRings.length > 0) {
        let currentRadius = (45 - visibilityFrames) * 5 + 30;
        let gradient = ctx.createRadialGradient(
            player.x + 11, player.y + 19, 10,
            player.x + 11, player.y + 19, Math.max(50, currentRadius)
        );
        gradient.addColorStop(0, `rgba(${theme.light}, 0.35)`);
        gradient.addColorStop(0.5, `rgba(${theme.light}, 0.1)`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 4. الجزيئات
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.shadowBlur = 0;

    // 5. رسم الإنسان الواقعي عند الصدى
    if (visibilityFrames > 0) {
        drawHumanCharacter(player.x, player.y, true);
        
        // العقبات
        ctx.shadowBlur = 12;
        ctx.shadowColor = theme.obs;
        ctx.fillStyle = theme.obs;
        obstacles.forEach(obs => {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });
        ctx.shadowBlur = 0;
        visibilityFrames--;
    } else {
        // خيال باهت جداً للإنسان في الظلام
        drawHumanCharacter(player.x, player.y, false);
    }
}

// دالة رسم تفاصيل الإنسان الواقعي
function drawHumanCharacter(x, y, isVisible) {
    ctx.save();
    if (isVisible) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#00f3ff";
    }

    let alpha = isVisible ? 1 : 0.25;
    
    // الرأس
    ctx.fillStyle = isVisible ? "#00f3ff" : `rgba(0, 243, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x + 11, y + 8, 7, 0, Math.PI * 2);
    ctx.fill();

    // الجسم (الجذع)
    ctx.fillRect(x + 8, y + 16, 6, 14);

    // الأذرع والأرجل المتحركة واقعياً
    let legOffset = Math.sin(player.animFrame) * 4;
    if (!player.isGrounded) legOffset = 4; // ضم الأرجل عند القفز

    // اليدين
    ctx.fillRect(x + 4, y + 18, 3, 10);
    ctx.fillRect(x + 15, y + 18, 3, 10);

    // الرجلين
    ctx.fillRect(x + 7, y + 30, 3, 8 + legOffset);
    ctx.fillRect(x + 12, y + 30, 3, 8 - legOffset);

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
    player.y = 360;
    isPlaying = true;
    update();
}

// 🎤 نظام التقاط الصوت البشري المفلتر
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

        document.getElementById("mic-status").innerText = "🎤 تم تفعيل فلتر الصوت البشري بنجاح!";
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

            if (avgHumanVolume > 35 && voiceRatio > 0.55 && (now - lastTriggerTime > 280)) {
                triggerEcho();
                lastTriggerTime = now;
            }

            requestAnimationFrame(checkHumanVoice);
        }
        checkHumanVoice();
    } catch (err) {
        alert("تعذر استخدام الميكروفون، يمكنك الضغط على زر الصدى للقفز.");
    }
}

update();
