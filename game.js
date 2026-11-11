const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let highScore = localStorage.getItem("echo_high_score") || 0;
document.getElementById("high-score").innerText = highScore;

let isPlaying = true;
let visibilityFrames = 0;

// بيانات البطل
const player = {
    x: 50,
    y: 380,
    size: 24,
    velocityY: 0,
    gravity: 0.6,
    jumpPower: -10,
    isGrounded: true,
    color: "#00d2d3"
};

// العقبات
let obstacles = [];
let frameCounter = 0;

function spawnObstacle() {
    const height = Math.floor(Math.random() * 30) + 30;
    obstacles.push({
        x: canvas.width,
        y: 410 - height,
        width: 20,
        height: height,
        color: "#ff4757"
    });
}

// كشف الخريطة
function triggerEcho() {
    visibilityFrames = 40; // تظل الرؤية واضحة لمدة 40 إطاراً
    if (player.isGrounded) {
        player.velocityY = player.jumpPower;
        player.isGrounded = false;
    }
}

// دالة التحديث الرسم
function update() {
    if (!isPlaying) return;

    // الجاذبية وحركة البطل
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    if (player.y >= 380) {
        player.y = 380;
        player.velocityY = 0;
        player.isGrounded = true;
    }

    // إنشاء العقبات
    frameCounter++;
    if (frameCounter % 100 === 0) {
        spawnObstacle();
    }

    // حركة العقبات والاصطدام
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= 4;

        // اصطدام
        if (
            player.x < obs.x + obs.width &&
            player.x + player.size > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.size > obs.y
        ) {
            gameOver();
        }

        // حساب النقاط
        if (obs.x + obs.width < player.x && !obs.passed) {
            obs.passed = true;
            score += 10;
            document.getElementById("score").innerText = score;
        }

        if (obs.x < -30) {
            obstacles.splice(i, 1);
        }
    }

    draw();
    requestAnimationFrame(update);
}

function draw() {
    // خلفية الظلام
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // الأرضية
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 404, canvas.width, 76);

    // إذا وُجد صدى صوت تظهر العناصر
    if (visibilityFrames > 0) {
        // موجة صدى الصوت Visual Effects
        ctx.strokeStyle = `rgba(0, 210, 211, ${visibilityFrames / 40})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + 12, player.y + 12, (40 - visibilityFrames) * 6, 0, Math.PI * 2);
        ctx.stroke();

        // رسم اللاعب
        ctx.fillStyle = player.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = player.color;
        ctx.fillRect(player.x, player.y, player.size, player.size);

        // رسم العقبات
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff4757";
        obstacles.forEach(obs => {
            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });

        ctx.shadowBlur = 0; // إعادة التعيين
        visibilityFrames--;
    } else {
        // خيال خفيف جداً للاعب في الظلام
        ctx.fillStyle = "rgba(0, 210, 211, 0.15)";
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
        alert(`خسرت! مجموع نقاطك: ${score}`);
        resetGame();
    }, 100);
}

function resetGame() {
    score = 0;
    obstacles = [];
    document.getElementById("score").innerText = score;
    player.y = 380;
    isPlaying = true;
    update();
}

// تفعيل الميكروفون للالتقاط التلقائي للصوت
async function initMic() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        document.getElementById("mic-status").innerText = "🎤 الميكروفون مفعل! اصدر صوتاً للتفاعل تلقائياً.";
        document.getElementById("mic-btn").style.display = "none";

        function checkAudio() {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            let average = sum / bufferLength;

            // إذا كان صوت المستخدم أعلى من العتبة (Threshold)
            if (average > 30) {
                triggerEcho();
            }
            requestAnimationFrame(checkAudio);
        }
        checkAudio();
    } catch (err) {
        alert("تعذر الوصول للميكروفون، يمكنك الاعتماد على الضغط بالأزرار.");
    }
}

update();
