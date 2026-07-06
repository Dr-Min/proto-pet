// ---------- 그리기 ----------
const BODY = '#efd9b8', BODY_DARK = '#dfc49c', OUTLINE = 'rgba(96,74,56,0.35)';
const PET_FOODIE_MARK = 'rgba(176,128,82,0.36)';
const PET_CHEEK_CHANNELS = '240,140,130';
const PET_EGG_CRACK = 'rgba(96,74,56,0.42)';
const PLAY_BALL = '#d98f7a';
const PLAY_BALL_SEAM = 'rgba(96,74,56,0.4)';
const BATTLE_FOE = '#c9b7a2';
const BATTLE_FOE_DARK = 'rgba(90,70,55,0.32)';
const PET_GRIME = 'rgba(96,74,56,0.18)';

function geneValue(name, fallback) {
  return typeof genes === 'undefined' ? fallback : genes[name];
}
function bodyColor() { return geneValue('body', BODY); }
function bodyDarkColor() { return geneValue('bodyDark', BODY_DARK); }
function bellyColor() { return geneValue('belly', 'rgba(255,250,240,0.55)'); }
function petHasTrait(name) { return typeof hasCareTrait === 'function' && hasCareTrait(name); }
function drawParticlesLayer() {
  for (const p of particles) {
    const a = 1 - p.t / p.life;
    if (p.type === 'heart') {
      ctx.fillStyle = `rgba(235,110,120,${a})`;
      ctx.font = `${11 + a * 4}px sans-serif`;
      ctx.fillText('♥', p.x, p.y);
    } else if (p.type === 'z') {
      ctx.fillStyle = `rgba(140,125,105,${a})`;
      ctx.font = `${10 + (1 - a) * 8}px sans-serif`;
      ctx.fillText('z', p.x + (1 - a) * 14, p.y - (1 - a) * 20);
    } else {
      ctx.fillStyle = `rgba(170,150,120,${a * 0.6})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3 * a, 0, Math.PI * 2); ctx.fill();
    }
  }
}
function drawPetCaption() {
  const capAlpha = clamp(1.4 - pet.captionT * 0.25, 0, 1);
  if (capAlpha <= 0) return;
  ctx.fillStyle = `rgba(130,115,95,${capAlpha})`;
  ctx.font = '13px -apple-system, "Apple SD Gothic Neo", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(pet.caption, pet.x, pet.y + 34);
  ctx.textAlign = 'left';
}
function drawBallObject(alpha = 1) {
  if (!ball) return;
  const bs = depthScaleAt(ball.phase === 'carried' ? pet.y : ball.y);
  const br = 7 * bs;
  const bx = ball.x;
  const by = ball.y + (ball.phase === 'carried' ? 0 : ball.jy);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (ball.phase !== 'carried') {
    ctx.fillStyle = 'rgba(115,95,70,0.2)';
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + 2, br * 1.35, br * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PLAY_BALL;
  ctx.beginPath();
  ctx.arc(bx, by - br * 0.55, br, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PLAY_BALL_SEAM;
  ctx.lineWidth = Math.max(1.2, br * 0.18);
  ctx.beginPath();
  ctx.moveTo(bx - br * 0.58, by - br * 1.08);
  ctx.quadraticCurveTo(bx, by - br * 0.36, bx + br * 0.58, by - br * 1.08);
  ctx.stroke();
  ctx.restore();
}

function drawBattleObject() {
  if (!battle) return;
  const bs = depthScaleAt(battle.y);
  const br = 22 * bs;
  const wobble = Math.sin(battle.t * 9) * 0.08 + battle.hitT * 0.28;
  ctx.save();
  ctx.translate(battle.x, battle.y - br * 0.7);
  ctx.rotate(wobble);
  ctx.fillStyle = 'rgba(115,95,70,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, br * 0.78, br * 0.92, br * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BATTLE_FOE;
  ctx.beginPath();
  ctx.ellipse(0, 0, br * (0.82 + battle.hitT * 0.18), br * (0.68 - battle.hitT * 0.08), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BATTLE_FOE_DARK;
  ctx.lineWidth = outlineWidth(br);
  ctx.stroke();
  ctx.fillStyle = BATTLE_FOE_DARK;
  ctx.beginPath();
  ctx.arc(-br * 0.23, -br * 0.08, br * 0.07, 0, Math.PI * 2);
  ctx.arc(br * 0.23, -br * 0.08, br * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.78;
  ctx.fillRect(-br * 0.62, -br * 0.95, br * 1.24 * battle.hp, br * 0.08);
  ctx.restore();
}

function drawBlob(cx, cy, rx, ry) {
  const n = pet.lumps.length;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const lump = pet.lumps[i] + Math.sin(a * 3 + pet.wobblePhase) * 1.6;
    pts.push({ x: cx + Math.cos(a) * (rx + lump), y: cy + Math.sin(a) * (ry + lump) });
  }
  // 꼭짓점 사이 중점을 지나는 곡선 → 각지지 않는 말랑한 윤곽
  ctx.beginPath();
  ctx.moveTo((pts[0].x + pts[n - 1].x) / 2, (pts[0].y + pts[n - 1].y) / 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
  }
  ctx.closePath();
}

// 고양이 귀 — 몸통 로컬 좌표계에서 그려서 찌부/숨쉬기를 같이 탄다
// phase 'outer': 몸통보다 먼저 (베이스가 몸에 묻힘), 'inner': 몸통 뒤에 속귀만
function drawEars(r, phase) {
  if (currentStage() === 'egg') return;
  const tw = pet.earTwitch;
  const heldOrFalling = input.mode === 'drag' || pet.jy < -8;
  const mellow = petHasTrait('mellow');
  const earScale = geneValue('earScale', 1) * stageScale('ear');
  const earSpread = geneValue('earSpread', 0.52);
  for (const side of [-1, 1]) {
    let twitch = 0;
    if (tw.side === side && tw.t < 0.4) twitch = Math.sin(tw.t * 28) * 0.25 * (1 - tw.t / 0.4);
    ctx.save();
    ctx.translate(side * r * earSpread, -r * 0.66 + (heldOrFalling ? r * 0.06 : 0) + (mellow ? r * 0.035 : 0));
    ctx.rotate(side * (heldOrFalling ? 0.43 : mellow ? 0.22 : 0.3) + twitch * (heldOrFalling ? 0.35 : mellow ? 0.65 : 1));
    if (phase === 'outer') {
      ctx.beginPath();
      ctx.moveTo(-r * 0.27, 0);
      ctx.quadraticCurveTo(-r * 0.2, -r * 0.44 * earScale, 0, -r * 0.56 * earScale);
      ctx.quadraticCurveTo(r * 0.2, -r * 0.44 * earScale, r * 0.27, 0);
      ctx.closePath();
      ctx.fillStyle = bodyColor(); ctx.fill();
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = outlineWidth(r); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-r * 0.13, -r * 0.12);
      ctx.quadraticCurveTo(-r * 0.09, -r * 0.34 * earScale, 0, -r * 0.42 * earScale);
      ctx.quadraticCurveTo(r * 0.09, -r * 0.34 * earScale, r * 0.13, -r * 0.12);
      ctx.closePath();
      ctx.fillStyle = 'rgba(232,160,150,0.5)'; ctx.fill();
    }
    ctx.restore();
  }
}

function drawEgg(t) {
  const s = depthScale();
  const r = pet.r * s;
  const warmth = typeof careStats === 'undefined' ? 0 : careStats.hatchWarmth;
  const shake = Math.sin(t * 18) * pet.eggShakeT * 0.12 + Math.sin(t * 4.5) * warmth * 0.035;
  const squash = 1 + Math.sin(t * 3.4) * 0.018 + pet.hatchFxT * 0.08;
  ctx.fillStyle = 'rgba(120,100,70,0.18)';
  ctx.beginPath();
  ctx.ellipse(pet.x, pet.y + 5, r * 0.62, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(pet.x, pet.y + pet.jy - r * 0.68);
  ctx.rotate(shake);
  ctx.scale(1 + (1 - squash) * 0.45, squash);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.58, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyColor();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = outlineWidth(r);
  ctx.stroke();

  ctx.fillStyle = bellyColor();
  for (const spot of pet.eggSpots) {
    ctx.beginPath();
    ctx.ellipse(spot.x * r, spot.y * r, spot.r * r * 1.15, spot.r * r, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (warmth > 0.82 || pet.hatchFxT > 0) {
    ctx.strokeStyle = PET_EGG_CRACK;
    ctx.lineWidth = Math.max(1.4, r * 0.03);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, -r * 0.42);
    ctx.lineTo(r * 0.02, -r * 0.27);
    ctx.lineTo(-r * 0.04, -r * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.18, r * 0.02);
    ctx.lineTo(r * 0.04, r * 0.14);
    ctx.lineTo(r * 0.16, r * 0.28);
    ctx.stroke();
  }
  ctx.restore();
}

function draw(t) {
  ctx.clearRect(0, 0, W, H);
  // 바닥 힌트
  ctx.fillStyle = '#ece5d3';
  ctx.fillRect(0, H * 0.38, W, H);

  if (currentStage() === 'egg') {
    drawEgg(t);
    drawParticlesLayer();
    drawPetCaption();
    return;
  }

  const s = depthScale(), r = stagedRadius();
  const sy = pet.squash, sx = 1 + (1 - sy) * 0.85;
  const sp = Math.hypot(pet.vx, pet.vy);
  const bob = Math.abs(Math.sin(pet.walkPhase)) * -4 * (sp > 10 ? 1 : 0);
  const breathe = (pet.behavior === 'sleep' ? Math.sin(t * 1.6) * 0.035 : Math.sin(t * 2.6) * 0.015);
  const cy = pet.y + pet.jy + bob - r * sy;

  // 그림자
  ctx.fillStyle = 'rgba(120,100,70,0.18)';
  ctx.beginPath();
  ctx.ellipse(pet.x, pet.y + 4, r * 1.15 * sx * (1 - pet.jy * -0.002), r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // 밥그릇
  if (food) {
    const foodType = foodTypeById(food.kind);
    const fs = 0.75 + (food.y / H) * 0.45;
    ctx.fillStyle = 'rgba(115,95,70,0.18)';
    ctx.beginPath(); ctx.ellipse(food.x, food.y + 2, 16 * fs, 5 * fs, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = foodType.fill;
    ctx.beginPath(); ctx.ellipse(food.x, food.y - 5 * fs, 14 * fs, 9 * fs, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = foodType.top;
    ctx.beginPath(); ctx.ellipse(food.x, food.y - 8 * fs, 11 * fs, 5 * fs, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = foodType.bits;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(food.x + Math.cos(i * 1.9) * 6 * fs, food.y - 8 * fs + Math.sin(i * 2.4) * 2 * fs, 2.6 * fs, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (ball && ball.phase !== 'carried') drawBallObject(ball.phase === 'fading' ? clamp(ball.fadeT / 1.5, 0, 1) : 1);
  drawBattleObject();

  // 꼬리 (몸 뒤)
  drawTail(tail, 8);

  // 다리 (뭉툭한 캡슐)
  ctx.strokeStyle = bodyDarkColor(); ctx.lineWidth = 9 * s * stageScale('leg'); ctx.lineCap = 'round';
  for (const f of feet) {
    ctx.beginPath();
    ctx.moveTo(pet.x + f.ox * r * 0.8, cy + r * 0.5 * sy);
    ctx.lineTo(f.x, f.y);
    ctx.stroke();
  }
  // 발끝
  ctx.fillStyle = bodyDarkColor();
  for (const f of feet) { ctx.beginPath(); ctx.arc(f.x, f.y, 5.5 * s * stageScale('leg'), 0, Math.PI * 2); ctx.fill(); }

  // 몸통 (머리 겸용 한 덩어리)
  ctx.save();
  ctx.translate(pet.x, cy);
  if (pet.behavior === 'wiggle') ctx.rotate(Math.sin(t * 14) * 0.13);
  if (pet.tripT > 0) ctx.rotate(pet.dir * pet.tripT * 0.35);
  ctx.scale(sx + breathe, sy - breathe);
  drawEars(r, 'outer');
  drawBlob(0, 0, r * 1.05 * geneValue('bodyAspect', 1), r);
  ctx.fillStyle = bodyColor(); ctx.fill();
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = outlineWidth(r); ctx.stroke();
  // 배 무늬
  ctx.beginPath(); ctx.ellipse(0, r * 0.45, r * 0.55, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = bellyColor(); ctx.fill();
  if (petHasTrait('foodie')) {
    ctx.fillStyle = PET_FOODIE_MARK;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc((i - 1) * r * 0.13, r * (0.38 + i * 0.04), r * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (typeof careStats !== 'undefined' && careStats.grime > 0.35) {
    ctx.fillStyle = PET_GRIME;
    const alpha = clamp((careStats.grime - 0.35) / 0.65, 0.18, 0.72);
    ctx.globalAlpha = alpha;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(Math.sin(i * 1.7) * r * 0.36, r * (0.05 + i * 0.12), r * (0.035 + i * 0.004), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  drawEars(r, 'inner');
  ctx.restore();

  // 얼굴
  const sniffing = pet.behavior === 'sniff';
  const headDip = sniffing ? r * 0.35 + Math.sin(t * 9) * 2 : 0;
  const fx = pet.x + pet.dir * r * 0.22 * sx;
  const fy = cy - r * 0.25 * sy + headDip + r * stageScale('eyeYOffset');
  const eyeGap = r * 0.3 * sx;
  const gx = pet.gazeX * 3.2, gy = pet.gazeY * 2.4;
  const sleeping = pet.behavior === 'sleep';
  const held = input.mode === 'drag';
  const falling = pet.jy < -8 && pet.landCaption;
  const justLanded = pet.landingT > 0;
  const closed = sleeping || pet.blink > 0 || (pet.behavior === 'plop' && pet.squash < 0.7);
  const mood = careMood();
  const hungryEyes = mood === 'hungry';
  const tiredEyes = mood === 'tired';
  const shyEyes = mood === 'shy';
  const happyEyes = pet.happy > 0.5 || mood === 'content';

  ctx.strokeStyle = '#4a3a2c'; ctx.fillStyle = '#4a3a2c'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  // 눈 두 개 — 일부러 크기가 다름 (하찮음 포인트)
  const eyes = [{ ox: -eyeGap, r: geneValue('eyeL', 3.6) * s * stageScale('eye'), oy: 0 }, { ox: eyeGap, r: geneValue('eyeR', 2.9) * s * stageScale('eye'), oy: geneValue('eyeTilt', -1.5) * s }];
  for (const e of eyes) {
    const ex = fx + e.ox + gx;
    const ey = fy + e.oy + gy;
    if (held || falling || justLanded) {
      const pinch = e.ox < 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(ex - 4.2 * pinch * s, ey - 2.6 * s);
      ctx.lineTo(ex, ey + 0.8 * s);
      ctx.lineTo(ex - 4.2 * pinch * s, ey + 4.2 * s);
      ctx.stroke();
    } else if (closed) {
      ctx.beginPath();
      ctx.moveTo(ex - 3.5, ey);
      ctx.lineTo(ex + 3.5, ey);
      ctx.stroke();
    } else if (tiredEyes) {
      ctx.beginPath();
      ctx.moveTo(ex - 4.6 * s, ey + 0.6 * s);
      ctx.quadraticCurveTo(ex, ey + 3.3 * s, ex + 4.6 * s, ey + 0.6 * s);
      ctx.stroke();
    } else if (hungryEyes) {
      ctx.beginPath();
      ctx.ellipse(ex, ey + 0.5 * s, e.r * 1.22, e.r * 1.45, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (shyEyes) {
      ctx.beginPath();
      ctx.arc(ex - Math.sign(e.ox) * 0.9 * s, ey + 0.8 * s, e.r * 0.72, 0, Math.PI * 2);
      ctx.fill();
    } else if (happyEyes) {
      ctx.beginPath();
      ctx.arc(ex, ey + 2, 4 * s, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(ex, ey, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // 어지러움 소용돌이
  if (pet.dizzy >= 3) {
    ctx.save(); ctx.strokeStyle = '#8a7a68'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(fx, fy - r * 0.8, 6, t * 6, t * 6 + 4.6); ctx.stroke();
    ctx.restore();
  }
  // 입: 항상 같은 ω 모양을 유지한다
  const my = fy + r * 0.28 * sy + gy * 0.5;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(fx + gx * 0.7 - 2.4 * s, my, 2.4 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.arc(fx + gx * 0.7 + 2.4 * s, my, 2.4 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.lineWidth = 2;
  // 볼터치
  const cheekAlpha = petHasTrait('cuddly') ? Math.max(0.18, pet.happy * 0.5) : pet.happy * 0.5;
  if (cheekAlpha > 0.12) {
    ctx.fillStyle = `rgba(${PET_CHEEK_CHANNELS},${cheekAlpha})`;
    ctx.beginPath(); ctx.arc(fx - eyeGap * 1.7, fy + r * 0.2, 5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + eyeGap * 1.7, fy + r * 0.2, 5 * s, 0, Math.PI * 2); ctx.fill();
  }
  if (ball && ball.phase === 'carried') drawBallObject(1);

  drawParticlesLayer();
  drawPetCaption();
}
