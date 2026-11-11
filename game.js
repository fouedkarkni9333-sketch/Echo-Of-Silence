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
    size: 24,
    velocityY: 0,
    gravity: 0.6,
    jumpPower: -11,
    isGrounded: true,
    color: "#00d2d3"
};

// المصفوفات للمحيط والجزيئات
let obstacles = [];
let particles = [];
let echoRings = [];
let frameCounter = 0;

// الألوان حسب المستوى
const levelThemes = [
    { bg: "#050508", player: "#00d2d3", obs: "#ff4757" }, // level 1
    { bg: "#0a0512", player: "#a29bfe", obs: "#fd79a8" }, // level 2
    { bg: "#0c0600", player: "#ffeaa7", obs: "#e17055" }, // level 3
    { bg: "#05100a", player: "#55efc4", obs: "#d63031" }  // level 4+
];

function getTheme() {
    return levelThemes[Math.min(currentLevel - 1, levelThemes.length - 1)];
}

function spawnObstacle() {
    const height = Math.floor(Math.random() * 35) + 30;
    obstacles.push({
        x: canvas.width,
        y: 410 - height,
        width: 22,
        height: height
    });
}

// إضافة جزيئات بصريّة عند القفز
function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            life: 20,
            color: color
        });
    }
}

// كشف الخريطة والقفز
function triggerEcho() {
    visibilityFrames = 45; 
    const theme = getTheme();
    
    // إضافة موجة صدى ضوئية
    echoRings.push({
        x: player.x + 12,
        y: player.y + 12,
        radius: 10,
        maxRadius: 180,
        alpha: 1,
        color: theme.player
    });

    if (player.isGrounded) {
        player.velocityY = player.jumpPower;
        player.isGrounded = false;
        createParticles(player.x + 12, player.y + 24, theme.player);
    }
}

function update() {
    if (!isPlaying) return;

    // حساب المستوى والسرعة تدريجياً
    currentLevel = Math.floor(score / 50) + 1;
    let speed = baseSpeed + (currentLevel - 1) * 1.2;

    // الجاذبية وحركة البطل
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    if (player.y >= 380) {
        player.y = 380;
        player.velocityY = 0;
        player.isGrounded = true;
    }

    // إنشاء العقبات (تصبح أسرع وأقرب كلما تقدمت)
    frameCounter++;
    let spawnRate = Math.max(50, 100 - (currentLevel * 8));
    if (frameCounter % Math.floor(spawnRate) === 0) {
        spawnObstacle();
    }

    // تحديث حركة العقبات والاصطدام
    const theme = getTheme();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= speed;

        // فحص الاصطدام
        if (
            player.x < obs.x + obs.width &&
            player.x + player.size > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.size > obs.y
        ) {
            createParticles(player.x + 12, player.y + 12, "#ff4757");
            gameOver();
        }

        // زيادة النقاط
        if (obs.x + obs.width < player.x && !obs.passed) {
            obs.passed = true;
            score += 10;
            document.getElementById("score").innerText = score;
        }

        if (obs.x < -30) {
            obstacles.splice(i, 1);
        }
    }

    // تحديث الجزيئات والموجات
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(index, 1);
    });

    echoRings.forEach((r, index) => {
        r.radius += 8;
        r.alpha -= 0.03;
        if (r.alpha <= 0) echoRings.splice(index, 1);
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    const theme = getTheme();

    // خلفية الظلام
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // الأرضية
    ctx.fillStyle = "#151520";
    ctx.fillRect(0, 404, canvas.width, 76);

    // رسم حلقات الصدى
    echoRings.forEach(r => {
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = Math.max(0, r.alpha);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    });

    // رسم الجزيئات المتناثرة
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    // إظهار المحتوى عند الصدى
    if (visibilityFrames > 0) {
        // اللاعب
        ctx.fillStyle = theme.player;
        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.player;
        ctx.fillRect(player.x, player.y, player.size, player.size);

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
        // خيال البطل في الظلام
        ctx.fillStyle = "rgba(255, 255, 
