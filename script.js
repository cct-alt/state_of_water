// --- 分頁切換邏輯 ---
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    // 強制重新計算排版
    setTimeout(() => {
        resizeAll();
        if (pageId === 'part1-page') { drawSim1(); drawChart1(); }
        if (pageId === 'part2-page') { setScenario(1); drawSim2(); }
    }, 50);

    if (pageId !== 'part1-page') isPlaying = false;
}

function resizeAll() {
    let left1 = document.getElementById('left-panel');
    if (left1 && left1.clientWidth > 0) {
        simCvs.width = left1.clientWidth; simCvs.height = left1.clientHeight;
        let chartContainer = document.querySelector('#part1-page .chart-container');
        if (chartContainer) { chartCvs.width = chartContainer.clientWidth - 30; chartCvs.height = chartContainer.clientHeight - 70; }
    }
    let left2 = document.getElementById('left-panel-2');
    if (left2 && left2.clientWidth > 0) {
        simCvs2.width = left2.clientWidth; simCvs2.height = left2.clientHeight;
    }
}
window.addEventListener('resize', resizeAll);

// ======================== 第一部分邏輯 ========================
const simCvs = document.getElementById('simCanvas');
const simCtx = simCvs.getContext('2d');
const chartCvs = document.getElementById('chartCanvas');
const chartCtx = chartCvs.getContext('2d');

let mode = 'idle'; let isPlaying = false; let temp = -50; let time = 0; let plateauTimer = 0;
const plateauMax = 480; const rate = 0.15; 
let historyData = []; let particles = []; let stateText = "-"; let processText = "-";

function startSim(newMode) {
    mode = newMode; isPlaying = true;
    document.getElementById('playPauseBtn').innerHTML = "暫停 ⏸️";
    historyData = []; time = 0; plateauTimer = 0; particles = [];
    temp = (mode === 'heating') ? -50 : 150;
}
function togglePlay() {
    if (mode === 'idle') return;
    isPlaying = !isPlaying;
    document.getElementById('playPauseBtn').innerHTML = isPlaying ? "暫停 ⏸️" : "播放 ▶️";
}
function drawArrow(ctx, fromX, fromY, toX, toY, color, opacity) {
    let dx = toX - fromX; let dy = toY - fromY; let length = Math.sqrt(dx * dx + dy * dy); let angle = Math.atan2(dy, dx);
    let shaftWidth = 14; let headWidth = 36; let headLength = 26;
    ctx.save(); ctx.globalAlpha = opacity; ctx.fillStyle = color; ctx.translate(fromX, fromY); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(0, -shaftWidth / 2); ctx.lineTo(length - headLength, -shaftWidth / 2);
    ctx.lineTo(length - headLength, -headWidth / 2); ctx.lineTo(length, 0); ctx.lineTo(length - headLength, headWidth / 2);
    ctx.lineTo(length - headLength, shaftWidth / 2); ctx.lineTo(0, shaftWidth / 2); ctx.closePath(); ctx.fill(); ctx.restore();
}

function updateLogic1() {
    if (!isPlaying || mode === 'idle') return;
    time += 1; processText = "-";
    if (mode === 'heating') {
        if (temp < 0) { temp += rate; processText = "固體加熱中"; }
        else if (temp >= 0 && temp < rate * 2 && plateauTimer < plateauMax) { temp = 0; plateauTimer++; processText = "熔化中 (溫度維持不變)"; }
        else if (temp >= 0 && temp < 100) { temp += rate; processText = "液體加熱中"; }
        else if (temp >= 100 && temp < 100 + (rate * 2) && plateauTimer >= plateauMax && plateauTimer < plateauMax * 2) { temp = 100; plateauTimer++; processText = "沸騰中 (溫度維持不變)"; }
        else if (temp >= 100 && temp < 150) { temp += rate; processText = "氣體加熱中"; }
        else if (temp >= 150) { isPlaying = false; temp = 150; processText = "加熱完成"; }
    } else if (mode === 'cooling') {
        if (temp > 100) { temp -= rate; processText = "氣體冷卻中"; }
        else if (temp <= 100 && temp > 100 - (rate * 2) && plateauTimer < plateauMax) { temp = 100; plateauTimer++; processText = "凝結中 (溫度維持不變)"; }
        else if (temp <= 100 && temp > 0) { temp -= rate; processText = "液體冷卻中"; }
        else if (temp <= 0 && temp > -(rate * 2) && plateauTimer >= plateauMax && plateauTimer < plateauMax * 2) { temp = 0; plateauTimer++; processText = "凝固中 (溫度維持不變)"; }
        else if (temp <= 0 && temp > -50) { temp -= rate; processText = "固體冷卻中"; }
        else if (temp <= -50) { isPlaying = false; temp = -50; processText = "冷卻完成"; }
    }
    stateText = "固體 (冰)"; if (temp > 0 && temp < 100) stateText = "液體 (水)"; if (temp >= 100) stateText = "氣體 (蒸汽)";
    if (mode === 'heating') {
        if (temp === 0 && plateauTimer > 0 && plateauTimer < plateauMax) stateText = "固體 + 液體";
        if (temp === 100 && plateauTimer > plateauMax && plateauTimer < plateauMax * 2) stateText = "液體 + 氣體";
    } else if (mode === 'cooling') {
        if (temp === 100 && plateauTimer > 0 && plateauTimer < plateauMax) stateText = "液體 + 氣體";
        if (temp === 0 && plateauTimer > plateauMax && plateauTimer < plateauMax * 2) stateText = "固體 + 液體";
    }
    if (time % 5 === 0) historyData.push({ t: time, T: temp });
}

function drawSim1() {
    if (simCvs.width === 0 || simCvs.height === 0) return;
    simCtx.clearRect(0, 0, simCvs.width, simCvs.height);
    let cx = simCvs.width / 2; let cy = simCvs.height / 2 + 50;
    if (cy > simCvs.height - 100) cy = simCvs.height - 100;

    if (temp >= 0 && temp <= 100) {
        simCtx.fillStyle = "#333"; simCtx.font = "bold 16px sans-serif"; simCtx.fillText("蒸發速率", 20, 40);
        simCtx.fillStyle = "#3498db"; let evpTemp = Math.min(100, Math.max(0, temp)); let barHeight = (evpTemp / 100) * 100;
        simCtx.fillRect(30, 160 - barHeight, 40, barHeight);
        simCtx.strokeStyle = "#95a5a6"; simCtx.lineWidth = 2; simCtx.strokeRect(30, 60, 40, 100);
        simCtx.fillStyle = "#2c3e50"; simCtx.font = "14px sans-serif";
        simCtx.fillText("水在任何溫度都能蒸發", 10, 185); simCtx.fillText("成水汽 (液體 --> 氣體)", 10, 205);
    }
    if (mode !== 'idle') {
        simCtx.fillStyle = "rgba(255, 255, 255, 0.85)";
        simCtx.roundRect = function (x, y, w, h, r) {
            this.beginPath(); this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); return this;
        };
        simCtx.roundRect(cx - 150, 15, 300, 70, 10); simCtx.fill(); simCtx.strokeStyle = "#bdc3c7"; simCtx.stroke();
        simCtx.textAlign = "center"; simCtx.fillStyle = "#2c3e50"; simCtx.font = "bold 20px sans-serif";
        simCtx.fillText(`物態：${stateText}`, cx, 40); simCtx.fillStyle = "#8e44ad"; simCtx.fillText(`過程：${processText}`, cx, 70); simCtx.textAlign = "left";
    }
    let tX = cx + 150; let tY = cy - 140; let tHeight = 180;
    simCtx.strokeStyle = "#7f8c8d"; simCtx.lineWidth = 12; simCtx.lineCap = "round";
    simCtx.beginPath(); simCtx.moveTo(tX, tY); simCtx.lineTo(tX, tY + tHeight); simCtx.stroke();
    simCtx.beginPath(); simCtx.arc(tX, tY + tHeight + 15, 22, 0, Math.PI * 2); simCtx.fillStyle = "#ecf0f1"; simCtx.fill(); simCtx.stroke();
    let fillPct = (temp + 50) / 200; if (fillPct < 0) fillPct = 0; if (fillPct > 1) fillPct = 1; let fillHeight = fillPct * tHeight;
    simCtx.strokeStyle = "#e74c3c"; if (mode === 'cooling' && temp < 0) simCtx.strokeStyle = "#3498db";
    simCtx.lineWidth = 6; simCtx.beginPath(); simCtx.moveTo(tX, tY + tHeight); simCtx.lineTo(tX, tY + tHeight - fillHeight); simCtx.stroke();
    simCtx.beginPath(); simCtx.arc(tX, tY + tHeight + 15, 12, 0, Math.PI * 2);
    simCtx.fillStyle = "#e74c3c"; if (mode === 'cooling' && temp < 0) simCtx.fillStyle = "#3498db"; simCtx.fill();
    simCtx.fillStyle = "#333"; simCtx.font = "bold 20px sans-serif";
    simCtx.fillText(`${temp.toFixed(1)} °C`, tX + 35, Math.min(tY + tHeight - fillHeight + 10, tY + tHeight + 20));

    simCtx.lineWidth = 4; simCtx.strokeStyle = "#95a5a6"; simCtx.beginPath();
    simCtx.moveTo(cx - 80, cy - 120); simCtx.lineTo(cx - 80, cy + 80); simCtx.lineTo(cx + 80, cy + 80); simCtx.lineTo(cx + 80, cy - 120); simCtx.stroke();

    let isFullyGas = false;
    if (temp <= 0) {
        simCtx.fillStyle = "rgba(135, 206, 235, 0.8)"; let iceRatio = 1;
        if (mode === 'heating' && temp === 0) iceRatio = 1 - (plateauTimer / plateauMax);
        if (mode === 'cooling' && temp === 0) iceRatio = (plateauTimer - plateauMax) / plateauMax;
        if (iceRatio < 0) iceRatio = 0; if (iceRatio > 1) iceRatio = 1;
        let iceHeight = 100 * iceRatio; let iceWidth = 140 * iceRatio;
        simCtx.fillRect(cx - iceWidth / 2, cy + 70 - iceHeight, iceWidth, iceHeight);
    }
    let waterRatio = 0; if (temp > 0 && temp < 100) waterRatio = 1;
    if (temp === 0) { waterRatio = (mode === 'heating') ? plateauTimer / plateauMax : 1 - ((plateauTimer - plateauMax) / plateauMax); }
    if (temp === 100) { waterRatio = (mode === 'heating') ? 1 - ((plateauTimer - plateauMax) / plateauMax) : plateauTimer / plateauMax; }
    if ((temp > 100) || (mode === 'heating' && temp === 100 && plateauTimer >= plateauMax * 2)) { waterRatio = 0; isFullyGas = true; }
    if (waterRatio < 0) waterRatio = 0; if (waterRatio > 1) waterRatio = 1;
    if (waterRatio > 0) {
        simCtx.fillStyle = "rgba(52, 152, 219, 0.6)"; let wHeight = 95 * waterRatio;
        simCtx.fillRect(cx - 75, cy + 75 - wHeight, 150, wHeight);
    }

    let pulse = (Math.sin(Date.now() / 200) + 1) / 2; let arrowOpacity = 0.4 + (pulse * 0.6);
    if (mode === 'heating') {
        drawArrow(simCtx, cx - 40, cy + 160, cx - 40, cy + 100, "#e74c3c", arrowOpacity); drawArrow(simCtx, cx, cy + 160, cx, cy + 100, "#e74c3c", arrowOpacity); drawArrow(simCtx, cx + 40, cy + 160, cx + 40, cy + 100, "#e74c3c", arrowOpacity);
        simCtx.fillStyle = `rgba(231, 76, 60, ${arrowOpacity})`; simCtx.font = "bold 22px sans-serif"; simCtx.textAlign = "center"; simCtx.fillText("吸收能量", cx, cy + 190); simCtx.textAlign = "left";
    } else if (mode === 'cooling') {
        drawArrow(simCtx, cx - 80, cy - 60, cx - 140, cy - 110, "#3498db", arrowOpacity); drawArrow(simCtx, cx - 90, cy, cx - 160, cy, "#3498db", arrowOpacity); drawArrow(simCtx, cx - 80, cy + 60, cx - 140, cy + 110, "#3498db", arrowOpacity);
        simCtx.fillStyle = `rgba(52, 152, 219, ${arrowOpacity})`; simCtx.font = "bold 22px sans-serif"; simCtx.textAlign = "center"; simCtx.fillText("釋出能量", cx, cy + 130); simCtx.textAlign = "left";
    }

    if (isFullyGas) {
        simCtx.fillStyle = "#8e44ad"; simCtx.font = "bold 20px sans-serif"; simCtx.textAlign = "center"; simCtx.fillText("氣體的水 (蒸汽) 是看不見的", cx, cy - 20); simCtx.textAlign = "left";
    }

    if (isPlaying && !isFullyGas) {
        if (temp >= 50 && temp < 100 && Math.random() < 0.2 && mode === 'heating') { particles.push({ x: cx + (Math.random() * 100 - 50), y: cy - 40, vy: -1.5, life: 60, type: 'smoke' }); }
        if (temp === 100 && waterRatio > 0 && Math.random() < 0.4 && mode === 'heating') {
            particles.push({ x: cx + (Math.random() * 120 - 60), y: cy + 50, vy: -3, life: 40, type: 'bubble' });
            particles.push({ x: cx + (Math.random() * 140 - 70), y: cy - 20, vy: -2.5, life: 80, type: 'steam' });
        }
        if (mode === 'cooling' && temp === 100 && waterRatio < 1 && Math.random() < 0.05) {
            let isLeft = Math.random() < 0.5; let dropX = isLeft ? cx - 78 : cx + 78; let dropY = cy - 100 + Math.random() * 40;
            particles.push({ x: dropX, y: dropY, vy: 1.5, life: 100, type: 'drop' });
        }
    }
    particles.forEach((p, index) => {
        // 加入判斷：只有在播放狀態下，粒子才會移動和消散
        if (isPlaying) {
            p.y += p.vy;
            p.life--;
        }

        if (p.type === 'smoke') { simCtx.fillStyle = `rgba(200, 200, 200, ${p.life / 60})`; simCtx.beginPath(); simCtx.arc(p.x, p.y, 8, 0, Math.PI * 2); simCtx.fill(); }
        else if (p.type === 'bubble') { simCtx.strokeStyle = "rgba(255, 255, 255, 0.8)"; simCtx.beginPath(); simCtx.arc(p.x, p.y, 5, 0, Math.PI * 2); simCtx.stroke(); }
        else if (p.type === 'steam') { simCtx.fillStyle = `rgba(180, 180, 180, ${(p.life / 80) * 0.4})`; simCtx.beginPath(); simCtx.arc(p.x, p.y, 15, 0, Math.PI * 2); simCtx.fill(); }
        else if (p.type === 'drop') { simCtx.fillStyle = "rgba(52, 152, 219, 0.8)"; simCtx.beginPath(); simCtx.arc(p.x, p.y, 6, 0, Math.PI * 2); simCtx.moveTo(p.x - 6, p.y); simCtx.lineTo(p.x, p.y - 12); simCtx.lineTo(p.x + 6, p.y); simCtx.fill(); }

        if (p.life <= 0) particles.splice(index, 1);
    });

}

function drawChart1() {
    if (chartCvs.width === 0 || chartCvs.height === 0) return;
    chartCtx.clearRect(0, 0, chartCvs.width, chartCvs.height);
    let pad = 40; let w = chartCvs.width - pad * 2; let h = chartCvs.height - pad * 2;
    chartCtx.strokeStyle = "#333"; chartCtx.lineWidth = 2; chartCtx.beginPath(); chartCtx.moveTo(pad, pad); chartCtx.lineTo(pad, h + pad); chartCtx.lineTo(w + pad, h + pad); chartCtx.stroke();
    chartCtx.fillStyle = "#333"; chartCtx.font = "14px sans-serif"; chartCtx.fillText("溫度(°C)", 10, 25); chartCtx.fillText("時間 (分鐘)", w + pad - 60, h + pad + 20);
    chartCtx.fillText("150°C", 0, pad + 5); chartCtx.fillText("100°C", 0, pad + (50 / 200) * h + 5); chartCtx.fillText("0°C", 10, pad + (150 / 200) * h + 5); chartCtx.fillText("-50°C", 0, pad + h + 5);
    chartCtx.setLineDash([5, 5]); chartCtx.strokeStyle = "#ccc"; chartCtx.beginPath(); chartCtx.moveTo(pad, pad + (50 / 200) * h); chartCtx.lineTo(w + pad, pad + (50 / 200) * h); chartCtx.moveTo(pad, pad + (150 / 200) * h); chartCtx.lineTo(w + pad, pad + (150 / 200) * h); chartCtx.stroke(); chartCtx.setLineDash([]);

    if (historyData.length > 0) {
        chartCtx.strokeStyle = "#e74c3c"; if (mode === 'cooling') chartCtx.strokeStyle = "#3498db";
        chartCtx.lineWidth = 3; chartCtx.beginPath(); let maxTime = Math.max(6000, time);
        for (let i = 0; i < historyData.length; i++) {
            let px = pad + (historyData[i].t / maxTime) * w; let py = pad + ((150 - historyData[i].T) / 200) * h;
            if (i === 0) chartCtx.moveTo(px, py); else chartCtx.lineTo(px, py);
        }
        chartCtx.stroke();
    }
}

// ======================== 第二部分：凝結專區 ========================
const simCvs2 = document.getElementById('simCanvas2');
const simCtx2 = simCvs2.getContext('2d');
let currentScenario = 1;
let vapors2 = [];
let drops2 = [];
let clouds2 = [];
let fogs2 = [];

function setScenario(num) {
    currentScenario = num;
    vapors2 = []; drops2 = []; clouds2 = []; fogs2 = [];
    let title = document.getElementById('scen-title');
    let desc = document.getElementById('scen-desc');

    if (num === 1) {
        title.innerHTML = "🧊 情境一：凍飲罐";
        desc.innerHTML = "空氣中充滿了<span style='color:#e74c3c; font-weight:bold;'>看不見的水汽</span>。當它們接觸到從雪櫃拿出的凍飲罐表面時，會失去能量並<span style='color:#3498db; font-weight:bold;'>凝結成液態水滴</span>，沿著罐壁流下。";
    } else if (num === 2) {
        title.innerHTML = "🪞 情境二：浴室冷鏡子";
        desc.innerHTML = "洗澡後，浴室裡滿佈<span style='color:#e74c3c; font-weight:bold;'>看不見的水汽</span>。當水汽飄向較冷的鏡子表面時，會<span style='color:#bdc3c7; font-weight:bold;'>凝結成微小水滴 (起霧)</span>，讓鏡面變得模糊。";
    } else if (num === 3) {
        title.innerHTML = "☁️ 情境三：水循環 (高空成雲)";
        desc.innerHTML = "太陽加熱海洋，水蒸發成<span style='color:#e74c3c; font-weight:bold;'>看不見的水汽並上升</span>。當上升至高空接觸到<span style='color:#3498db; font-weight:bold;'>冷空氣層</span>時，水汽便會凝結成小水點，聚集起來就變成了我們看到的雲。";
    }

}

function updateLogic2() {
    let cx = simCvs2.width / 2;
    let cy = simCvs2.height / 2;

    // 控制不同情境的水汽產生機率
    let genRate = (currentScenario === 3) ? 0.012 : 0.04;

    if (Math.random() < genRate) {
        let startX, startY, targetX, targetY;

        if (currentScenario === 1 || currentScenario === 2) {
            let side = Math.floor(Math.random() * 4);
            if (side === 0) { startX = -100; startY = Math.random() * simCvs2.height; }
            else if (side === 1) { startX = simCvs2.width + 100; startY = Math.random() * simCvs2.height; }
            else if (side === 2) { startX = Math.random() * simCvs2.width; startY = -100; }
            else { startX = Math.random() * simCvs2.width; startY = simCvs2.height + 100; }

            if (currentScenario === 1) {
                targetX = cx + (Math.random() * 80 - 40);
                targetY = cy + (Math.random() * 160 - 80);
            } else {
                targetX = cx + (Math.random() * 120 - 60);
                targetY = cy + (Math.random() * 180 - 90);
            }
        }
        else if (currentScenario === 3) {
            startX = Math.random() * simCvs2.width;
            startY = simCvs2.height + 50;
            targetX = startX + (Math.random() * 100 - 50);
            targetY = 100;
        }

        let dx = targetX - startX;
        let dy = targetY - startY;
        let dist = Math.sqrt(dx * dx + dy * dy);

        // 情境三的水汽速度更慢
        let speed = (currentScenario === 3) ? 0.4 : 0.8;
        let vx = (dx / dist) * speed;
        let vy = (dy / dist) * speed;

        vapors2.push({ x: startX, y: startY, vx: vx, vy: vy, life: 3500 });
    }

    for (let i = vapors2.length - 1; i >= 0; i--) {
        let v = vapors2[i];
        v.x += v.vx; v.y += v.vy; v.life--;

        let hit = false;
        if (currentScenario === 1 && v.x > cx - 50 && v.x < cx + 50 && v.y > cy - 100 && v.y < cy + 100) hit = true;
        else if (currentScenario === 2 && v.x > cx - 70 && v.x < cx + 70 && v.y > cy - 120 && v.y < cy + 120) hit = true;
        else if (currentScenario === 3 && v.y < 150) hit = true;

        if (hit || v.life <= 0) {
            if (hit) {
                if (currentScenario === 1) {
                    drops2.push({ x: v.x, y: v.y, vy: 1 + Math.random(), type: 'drop' });
                } else if (currentScenario === 2) {
                    fogs2.push({ x: v.x, y: v.y, size: 15 + Math.random() * 15, opacity: 0 });
                } else if (currentScenario === 3) {
                    // 雲的圓圈大幅縮小
                    clouds2.push({ x: v.x, y: v.y, size: 0, maxSize: 10 + Math.random() * 15 });
                }
            }
            vapors2.splice(i, 1);
        }
    }

    for (let i = drops2.length - 1; i >= 0; i--) {
        let d = drops2[i]; d.y += d.vy;
        if (currentScenario === 1 && d.y > cy + 100) drops2.splice(i, 1);
        else if (currentScenario === 2 && d.y > cy + 120) drops2.splice(i, 1);
    }
}

function drawSim2() {
    if (simCvs2.width === 0 || simCvs2.height === 0) return;
    simCtx2.clearRect(0, 0, simCvs2.width, simCvs2.height);
    let cx = simCvs2.width / 2;
    let cy = simCvs2.height / 2;

    if (currentScenario === 1) {
        simCtx2.fillStyle = "#2980b9";
        simCtx2.beginPath(); simCtx2.roundRect(cx - 60, cy - 110, 120, 220, 10); simCtx2.fill();
        simCtx2.fillStyle = "#ecf0f1";
        simCtx2.beginPath(); simCtx2.ellipse(cx, cy - 110, 60, 15, 0, 0, Math.PI * 2); simCtx2.fill();
        simCtx2.fillStyle = "#bdc3c7";
        simCtx2.beginPath(); simCtx2.ellipse(cx, cy + 110, 60, 15, 0, 0, Math.PI * 2); simCtx2.fill();
        simCtx2.fillStyle = "white"; simCtx2.font = "bold 20px sans-serif"; simCtx2.textAlign = "center";
        simCtx2.fillText("凍飲", cx, cy);
        simCtx2.fillStyle = "#3498db"; simCtx2.font = "16px sans-serif"; simCtx2.fillText("較冷的表面", cx, cy + 140);
        simCtx2.textAlign = "left";
    }
    else if (currentScenario === 2) {
        simCtx2.fillStyle = "#bdc3c7"; simCtx2.fillRect(cx - 90, cy - 140, 180, 280);
        simCtx2.fillStyle = "#e0e6ed"; simCtx2.fillRect(cx - 80, cy - 130, 160, 260);
        simCtx2.strokeStyle = "rgba(255,255,255,0.6)"; simCtx2.lineWidth = 10;
        simCtx2.beginPath(); simCtx2.moveTo(cx - 60, cy + 100); simCtx2.lineTo(cx + 60, cy - 100); simCtx2.stroke();

        simCtx2.save();
        simCtx2.beginPath(); simCtx2.rect(cx - 80, cy - 130, 160, 260); simCtx2.clip();
        fogs2.forEach(f => {
            if (f.opacity < 0.6) f.opacity += 0.005;
            simCtx2.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
            simCtx2.beginPath(); simCtx2.arc(f.x, f.y, f.size, 0, Math.PI * 2); simCtx2.fill();
        });
        simCtx2.restore();

        simCtx2.fillStyle = "#3498db"; simCtx2.font = "16px sans-serif"; simCtx2.textAlign = "center";
        simCtx2.fillText("浴室冷鏡面", cx, cy + 160); simCtx2.textAlign = "left";
    }
    else if (currentScenario === 3) {
        // 畫漸層淡藍色天空背景
        let skyGradient = simCtx2.createLinearGradient(0, 0, 0, simCvs2.height);
        skyGradient.addColorStop(0, "#87CEEB");
        skyGradient.addColorStop(1, "#E0F6FF");
        simCtx2.fillStyle = skyGradient;
        simCtx2.fillRect(0, 0, simCvs2.width, simCvs2.height);

        // 高空冷空氣層
        simCtx2.fillStyle = "rgba(255, 255, 255, 0.4)";
        simCtx2.fillRect(0, 0, simCvs2.width, 180);
        simCtx2.fillStyle = "#2980b9"; simCtx2.font = "bold 20px sans-serif"; simCtx2.textAlign = "center";
        simCtx2.fillText("高空冷空氣層", cx, 40);

        // 海洋與太陽
        simCtx2.fillStyle = "#3498db"; simCtx2.fillRect(0, simCvs2.height - 120, simCvs2.width, 120);
        simCtx2.fillStyle = "white"; simCtx2.fillText("海洋 (溫暖)", cx, simCvs2.height - 60);


        simCtx2.fillStyle = "#f1c40f"; simCtx2.beginPath(); simCtx2.arc(80, 80, 40, 0, Math.PI * 2); simCtx2.fill();
        simCtx2.textAlign = "left";
    }

    simCtx2.fillStyle = "rgba(231, 76, 60, 0.9)"; simCtx2.font = "bold 20px sans-serif";
    vapors2.forEach(v => { simCtx2.fillText("水汽", v.x, v.y); });

    simCtx2.fillStyle = "rgba(52, 152, 219, 0.9)";
    drops2.forEach(d => {
        simCtx2.beginPath(); simCtx2.arc(d.x, d.y, 6, 0, Math.PI * 2);
        simCtx2.moveTo(d.x - 6, d.y); simCtx2.lineTo(d.x, d.y - 12); simCtx2.lineTo(d.x + 6, d.y); simCtx2.fill();
    });

    simCtx2.fillStyle = "rgba(255, 255, 255, 0.9)";
    clouds2.forEach(c => {
        simCtx2.beginPath(); simCtx2.arc(c.x, c.y, c.size, 0, Math.PI * 2); simCtx2.fill();
        if (c.size < c.maxSize) c.size += 0.5;
    });
}

setTimeout(resizeAll, 100);

function loop() {
    if (document.getElementById('part1-page').classList.contains('active')) {
        updateLogic1(); drawSim1(); drawChart1();
    } else if (document.getElementById('part2-page').classList.contains('active')) {
        updateLogic2(); drawSim2();
    }
    requestAnimationFrame(loop);
}

loop();
