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
const SURFACE_PAGE = '#f4efe4';
const SURFACE_FLOOR = '#ece5d3';
const WALK_FLOOR = '#e1e7d1';
const WALK_SKY = '#f7f3e6';
const WALK_HILL = '#d7dfc7';
const WALK_PATH = '#d7ccb7';
const WALK_GRASS = 'rgba(104,132,86,0.38)';
const WALK_SHRUB = '#c7d3aa';
const WALK_STONE = '#c8c1ae';
const WALK_CLOUD = 'rgba(255,251,240,0.72)';
const WALK_BUTTERFLY = '#d8b0a3';
const WALK_SPARK = 'rgba(232,184,127,0.55)';
const FURNITURE_WHEEL = '#d2bda5';
const FURNITURE_WHEEL_DARK = 'rgba(104,82,62,0.34)';
const FURNITURE_CUSHION = '#d9a6a0';
const FURNITURE_WINDOW = '#bac9c6';
const FURNITURE_WINDOW_LIGHT = '#eef0e8';
const FURNITURE_POT = '#c79b78';
const FURNITURE_LEAF = '#8faf77';
const BATTLE_FLOOR = '#e2d8c7';
const BATTLE_SKY = '#eee8dc';
const BATTLE_SAND = '#d8c8b1';
const BATTLE_RING = 'rgba(120,96,72,0.22)';
const BATTLE_FLAG = '#c9a8a0';
const BATTLE_FOOTPRINT = 'rgba(112,91,70,0.13)';
const DAY_MORNING_TONE = 'rgba(232,184,127,0.04)';
const DAY_TONE = 'rgba(0,0,0,0)';
const DAY_EVENING_TONE = 'rgba(217,143,122,0.06)';
const DAY_NIGHT_TONE = 'rgba(64,78,118,0.10)';
const HAND_FONT = '"Gaegu", "Apple SD Gothic Neo", -apple-system, sans-serif';

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
      ctx.font = `700 ${12 + a * 5}px ${HAND_FONT}`;
      ctx.fillText('♥', p.x, p.y);
    } else if (p.type === 'z') {
      ctx.fillStyle = `rgba(140,125,105,${a})`;
      ctx.font = `700 ${11 + (1 - a) * 8}px ${HAND_FONT}`;
      ctx.fillText('z', p.x + (1 - a) * 14, p.y - (1 - a) * 20);
    } else if (p.type === 'spark') {
      ctx.fillStyle = `rgba(232,184,127,${a * 0.9})`;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 3.8 * a, 1.5 * a, p.t * 4, 0, Math.PI * 2);
      ctx.fill();
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
  ctx.font = `400 17px ${HAND_FONT}`;
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
  const defeated = battle.phase === 'defeated';
  const physicsAngle = Number.isFinite(battle.angle) ? Math.sin(battle.angle) * 0.34 : 0;
  const entryRoll = battle.phase === 'entering' ? battle.angle : 0;
  const wobble = defeated ? physicsAngle : Math.sin(battle.t * 9) * 0.08 + battle.hitT * 0.28 + physicsAngle + entryRoll;
  ctx.save();
  ctx.fillStyle = 'rgba(115,95,70,0.18)';
  ctx.beginPath();
  ctx.ellipse(battle.x, battle.y + br * 0.08, br * 0.92, br * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(battle.x, battle.y - br * 0.7);
  ctx.rotate(wobble);
  drawOpponentBlob(0, 0, br, battle.shape || makeBlobGenes(11), battle.t, battle.hitT, ctx, defeated);
  ctx.restore();
  if (defeated && battle.haloVisible) drawBattleFoeHalo(battle.x, battle.y - br * 1.76, br, battle.haloT || 0);
  if (battle.phase === 'active') {
    ctx.save();
    ctx.translate(battle.x, battle.y - br * 0.7);
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = 'rgba(102,80,62,0.24)';
    ctx.fillRect(-br * 0.62, -br * 0.95, br * 1.24, br * 0.1);
    ctx.fillStyle = '#d97883';
    ctx.fillRect(-br * 0.62, -br * 0.95, br * 1.24 * battle.hp, br * 0.1);
    ctx.restore();
    drawBattleHud();
  }
}

function drawBattleFoeHalo(x, y, r, t) {
  const rise = Math.min(t, 1.2) * r * 0.22;
  const wobble = Math.sin(t * 5.2) * r * 0.04;
  ctx.save();
  ctx.globalAlpha = clamp(t * 2.4, 0, 0.92);
  ctx.translate(x + wobble, y - rise);
  ctx.strokeStyle = 'rgba(232,184,127,0.78)';
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.52, r * 0.18, Math.sin(t * 2.1) * 0.08, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,251,240,0.7)';
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.beginPath();
  ctx.arc(r * 0.28, -r * 0.02, r * 0.08, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBattleHud() {
  if (!battle) return;
  const panelW = Math.min(268, W - 56);
  const panelH = 34;
  const panelX = (W - panelW) / 2;
  const panelY = Math.max(H * 0.34, 278);
  const trackX = panelX + 46;
  const trackY = panelY + panelH / 2;
  const trackW = panelW - 92;
  const trackH = 10;
  const petHp = clamp(Number(battle.petHp) || 0, 0, 1);
  const foeHp = clamp(Number(battle.hp) || 0, 0, 1);
  ctx.save();
  ctx.fillStyle = 'rgba(244,239,228,0.82)';
  ctx.strokeStyle = 'rgba(111,90,69,0.34)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 17);
  ctx.fill();
  ctx.stroke();
  drawBattleHudFace(panelX + 23, trackY, 8.5, bodyColor(), OUTLINE, true);
  drawBattleHudFace(panelX + panelW - 23, trackY, 8.5, BATTLE_FOE, BATTLE_FOE_DARK, false);
  ctx.fillStyle = 'rgba(102,80,62,0.18)';
  ctx.beginPath();
  ctx.roundRect(trackX, trackY - trackH / 2, trackW, trackH, 5);
  ctx.fill();
  ctx.fillStyle = '#8fb7d9';
  ctx.beginPath();
  ctx.roundRect(trackX, trackY - trackH / 2, trackW * 0.5 * petHp, trackH, 5);
  ctx.fill();
  ctx.fillStyle = '#d97883';
  const foeW = trackW * 0.5 * foeHp;
  ctx.beginPath();
  ctx.roundRect(trackX + trackW - foeW, trackY - trackH / 2, foeW, trackH, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(111,90,69,0.22)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(trackX + trackW / 2, trackY - 7);
  ctx.lineTo(trackX + trackW / 2, trackY + 7);
  ctx.stroke();
  ctx.restore();
}

function drawBattleHudFace(x, y, r, fill, stroke, petSide) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(x, y, r * (petSide ? 1.08 : 0.96), r, petSide ? -0.1 : 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6f5a45';
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.12, 1.2, 0, Math.PI * 2);
  ctx.arc(x + r * 0.22, y - r * 0.1, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBattleResult() {
  if (typeof battleResult === 'undefined' || !battleResult || battleResult.t <= 0) return;
  const a = clamp(Math.min(battleResult.t, 0.6) / 0.6, 0, 1);
  const w = Math.min(230, W - 64);
  const x = (W - w) / 2;
  const y = Math.max(H * 0.275, 226);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = battleResult.won ? 'rgba(185,207,166,0.78)' : 'rgba(232,223,203,0.84)';
  ctx.strokeStyle = battleResult.won ? 'rgba(96,116,74,0.34)' : 'rgba(111,90,69,0.34)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 50, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6f5a45';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 18px ${HAND_FONT}`;
  ctx.fillText(battleResult.title, x + w / 2, y + 19);
  ctx.font = `400 15px ${HAND_FONT}`;
  ctx.fillStyle = 'rgba(111,90,69,0.78)';
  ctx.fillText(battleResult.line, x + w / 2, y + 36);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawOpponentBlob(cx, cy, r, shape, t, hitT = 0, targetCtx = ctx, defeated = false) {
  const g = targetCtx;
  const body = shape && shape.body ? shape.body : BATTLE_FOE;
  const bodyDark = shape && shape.bodyDark ? shape.bodyDark : BATTLE_FOE_DARK;
  const belly = shape && shape.belly ? shape.belly : 'rgba(255,250,240,0.45)';
  const lumps = shape && Array.isArray(shape.lumps) ? shape.lumps : [0, 0, 0, 0, 0, 0, 0, 0];
  const aspect = shape && Number.isFinite(shape.bodyAspect) ? shape.bodyAspect : 1;
  const earScale = shape && Number.isFinite(shape.earScale) ? shape.earScale : 1;
  const earSpread = shape && Number.isFinite(shape.earSpread) ? shape.earSpread : 0.52;
  const squashX = 1 + hitT * 0.18;
  const squashY = 1 - hitT * 0.08;
  g.save();
  g.translate(cx, cy);
  g.scale(squashX, squashY);
  g.fillStyle = bodyDark;
  for (const side of [-1, 1]) {
    g.save();
    g.translate(side * r * earSpread, -r * 0.55);
    g.rotate(side * 0.28 + Math.sin(t * 5 + side) * 0.04);
    g.beginPath();
    g.moveTo(-r * 0.18, 0);
    g.quadraticCurveTo(0, -r * 0.46 * earScale, r * 0.18, 0);
    g.closePath();
    g.fillStyle = body;
    g.fill();
    g.strokeStyle = OUTLINE;
    g.lineWidth = outlineWidth(r);
    g.stroke();
    g.restore();
  }
  g.strokeStyle = bodyDark;
  g.lineWidth = Math.max(2.4, r * 0.13);
  g.lineCap = 'round';
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(side * r * 0.28, r * 0.48);
    g.lineTo(side * r * 0.36, r * 0.72);
    g.stroke();
  }
  drawLumpyBlobOn(g, 0, 0, r * 0.82 * aspect, r * 0.68, lumps, t * 1.4, 0.018);
  g.fillStyle = body;
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = outlineWidth(r);
  g.stroke();
  g.beginPath();
  g.ellipse(0, r * 0.28, r * 0.42, r * 0.26, 0, 0, Math.PI * 2);
  g.fillStyle = belly;
  g.fill();
  g.fillStyle = bodyDark;
  const eyeL = shape && Number.isFinite(shape.eyeL) ? shape.eyeL : 3.3;
  const eyeR = shape && Number.isFinite(shape.eyeR) ? shape.eyeR : 3.0;
  if (defeated) {
    g.strokeStyle = bodyDark;
    g.lineWidth = Math.max(1.7, r * 0.06);
    for (const eye of [{ x: -r * 0.23, y: -r * 0.12 }, { x: r * 0.22, y: -r * 0.1 }]) {
      const er = Math.max(2.4, r * 0.12);
      g.beginPath();
      g.moveTo(eye.x - er, eye.y - er);
      g.lineTo(eye.x + er, eye.y + er);
      g.moveTo(eye.x + er, eye.y - er);
      g.lineTo(eye.x - er, eye.y + er);
      g.stroke();
    }
  } else {
    g.beginPath();
    g.arc(-r * 0.23, -r * 0.12, Math.max(1.4, eyeL * r / 28), 0, Math.PI * 2);
    g.arc(r * 0.22, -r * 0.1, Math.max(1.4, eyeR * r / 28), 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  g.arc(-r * 0.05, r * 0.1, r * 0.07, 0.1 * Math.PI, 0.85 * Math.PI);
  g.arc(r * 0.08, r * 0.1, r * 0.07, 0.15 * Math.PI, 0.9 * Math.PI);
  g.strokeStyle = bodyDark;
  g.lineWidth = Math.max(1.2, r * 0.045);
  g.stroke();
  g.restore();
}

function drawOpponentPreviewCanvas(canvas, opponent) {
  const pctx = canvas.getContext('2d');
  if (!pctx || !opponent) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = 96;
  const height = 72;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  pctx.clearRect(0, 0, width, height);
  pctx.fillStyle = 'rgba(116,96,72,0.08)';
  pctx.beginPath();
  pctx.ellipse(width / 2, 58, 28, 6, 0, 0, Math.PI * 2);
  pctx.fill();
  drawOpponentBlob(width / 2, 38, 27, makeBlobGenes(opponent.seed), 0.7, 0, pctx);
}

function drawLumpyBlobShape(cx, cy, rx, ry, lumps, t, wobble) {
  drawLumpyBlobOn(ctx, cx, cy, rx, ry, lumps, t, wobble);
}

function drawLumpyBlobOn(targetCtx, cx, cy, rx, ry, lumps, t, wobble) {
  const n = lumps.length;
  const lastA = (n - 1) / n * Math.PI * 2;
  let prevN = 1 + lumps[n - 1] + Math.sin(lastA * 3 + t) * wobble;
  let curN = 1 + lumps[0] + Math.sin(t) * wobble;
  let prevX = cx + Math.cos(lastA) * rx * prevN;
  let prevY = cy + Math.sin(lastA) * ry * prevN;
  let curX = cx + rx * curN;
  let curY = cy;
  targetCtx.beginPath();
  targetCtx.moveTo((prevX + curX) / 2, (prevY + curY) / 2);
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const nextA = next / n * Math.PI * 2;
    const nextN = 1 + lumps[next] + Math.sin(nextA * 3 + t) * wobble;
    const nextX = cx + Math.cos(nextA) * rx * nextN;
    const nextY = cy + Math.sin(nextA) * ry * nextN;
    targetCtx.quadraticCurveTo(curX, curY, (curX + nextX) / 2, (curY + nextY) / 2);
    curX = nextX;
    curY = nextY;
  }
  targetCtx.closePath();
}

function drawHomeWorld(t) {
  const floorY = H * 0.38;
  ctx.fillStyle = SURFACE_PAGE;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = SURFACE_FLOOR;
  ctx.fillRect(0, floorY, W, H - floorY);
  drawWallFurniture(t);
}

function drawWheelFurniture(x, y, s, t, part = 'full') {
  const spin = typeof furnitureState === 'undefined' ? t * 0.8 : furnitureState.wheelSpin;
  const r = 32 * s;
  ctx.save();
  ctx.translate(x, y - r * 0.55);
  if (part !== 'front') {
    ctx.strokeStyle = FURNITURE_WHEEL_DARK;
    ctx.lineWidth = Math.max(2, 3 * s);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.64, r * 0.88);
    ctx.lineTo(-r * 0.22, r * 0.24);
    ctx.moveTo(r * 0.64, r * 0.88);
    ctx.lineTo(r * 0.22, r * 0.24);
    ctx.stroke();
    ctx.save();
    ctx.rotate(spin + Math.PI / 5);
    drawLumpyBlobShape(0, 0, r * 0.86, r * 0.82, placeWorld.home.furnitureLumps.wheel, t * 0.6 + 1.4, 0.005);
    ctx.globalAlpha = 0.48;
    ctx.strokeStyle = FURNITURE_WHEEL_DARK;
    ctx.lineWidth = Math.max(3, 4.5 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  if (part !== 'back') {
    ctx.rotate(spin);
    drawLumpyBlobShape(0, 0, r, r * 0.96, placeWorld.home.furnitureLumps.wheel, t * 0.6, 0.006);
    ctx.strokeStyle = FURNITURE_WHEEL;
    ctx.lineWidth = Math.max(5, 7 * s);
    ctx.stroke();
    ctx.strokeStyle = FURNITURE_WHEEL_DARK;
    ctx.lineWidth = Math.max(1.4, 1.8 * s);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 0.74, Math.sin(a) * r * 0.74);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 4.2 * s, 0, Math.PI * 2);
    ctx.fillStyle = FURNITURE_WHEEL_DARK;
    ctx.fill();
  }
  ctx.restore();
}

function drawCushionFurniture(x, y, s, t) {
  const wobble = Math.sin(t * 1.6) * 0.018;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 + wobble, 1 - wobble);
  ctx.fillStyle = 'rgba(115,95,70,0.13)';
  ctx.beginPath();
  ctx.ellipse(0, 7 * s, 42 * s, 11 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  drawLumpyBlobShape(0, -2 * s, 38 * s, 17 * s, placeWorld.home.furnitureLumps.cushion, t * 0.5, 0.01);
  ctx.fillStyle = FURNITURE_CUSHION;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = outlineWidth(36 * s);
  ctx.stroke();
  ctx.restore();
}

function drawPlantFurniture(x, y, s, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(115,95,70,0.13)';
  ctx.beginPath();
  ctx.ellipse(0, 4 * s, 20 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = FURNITURE_LEAF;
  ctx.lineWidth = Math.max(2, 2.4 * s);
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const side = i - 2;
    const sway = Math.sin(t * 1.8 + i) * 4 * s;
    ctx.beginPath();
    ctx.moveTo(0, -16 * s);
    ctx.quadraticCurveTo(side * 5 * s + sway * 0.3, -29 * s, side * 11 * s + sway, -40 * s + Math.abs(side) * 3 * s);
    ctx.stroke();
  }
  drawLumpyBlobShape(0, -7 * s, 16 * s, 12 * s, placeWorld.home.furnitureLumps.plant, t * 0.4, 0.012);
  ctx.fillStyle = FURNITURE_POT;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = outlineWidth(24 * s);
  ctx.stroke();
  ctx.restore();
}

function drawWindowFurniture(x, y, s, t) {
  const wave = Math.sin(t * 0.8) * 1.5 * s;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = FURNITURE_WINDOW_LIGHT;
  ctx.beginPath();
  ctx.ellipse(0, 0, 44 * s, 30 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = FURNITURE_WINDOW;
  ctx.lineWidth = Math.max(4, 5 * s);
  ctx.stroke();
  ctx.strokeStyle = FURNITURE_WHEEL_DARK;
  ctx.lineWidth = Math.max(1.2, 1.5 * s);
  ctx.beginPath();
  ctx.moveTo(-32 * s, wave);
  ctx.quadraticCurveTo(0, -5 * s, 32 * s, wave);
  ctx.moveTo(0, -25 * s);
  ctx.lineTo(0, 25 * s);
  ctx.stroke();
  ctx.restore();
}

function furnitureDrawEffect(id, t) {
  const held = typeof furnitureMotion !== 'undefined' && furnitureMotion.heldId === id;
  const settling = typeof furnitureMotion !== 'undefined' && furnitureMotion.settleId === id && furnitureMotion.settleT > 0;
  if (held) {
    return {
      lift: 8,
      sx: 1.04 + Math.sin(t * 18) * 0.018,
      sy: 0.97 + Math.cos(t * 15) * 0.014,
      rot: Math.sin(t * 12) * 0.035,
      shadow: 1.45,
    };
  }
  if (settling) {
    const p = clamp(furnitureMotion.settleT / furnitureMotion.settleDur, 0, 1);
    const spring = Math.sin((1 - p) * Math.PI * 2.2) * p;
    return {
      lift: 0,
      sx: 1 + spring * 0.16,
      sy: 1 - spring * 0.12,
      rot: 0,
      shadow: 1,
    };
  }
  return { lift: 0, sx: 1, sy: 1, rot: 0, shadow: 1 };
}

function drawFurnitureGroundShadow(id, anchor, size, effect) {
  if (furnitureZone(id) === 'wall') return;
  const w = id === 'wheel' ? 1.24 : id === 'cushion' ? 1.38 : 0.72;
  const h = id === 'wheel' ? 0.22 : id === 'cushion' ? 0.28 : 0.2;
  ctx.save();
  ctx.fillStyle = `rgba(115,95,70,${0.11 + (effect.shadow - 1) * 0.05})`;
  ctx.beginPath();
  ctx.ellipse(anchor.x, anchor.y + 6, size * w * effect.shadow, size * h * effect.shadow, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFurnitureItem(id, t, part = 'full') {
  const anchor = furnitureAnchor(id);
  const s = furnitureDrawScale(id, anchor.y);
  const size = furniturePrimarySize(id, anchor.y);
  const effect = furnitureDrawEffect(id, t);
  if (part !== 'front') drawFurnitureGroundShadow(id, anchor, size, effect);
  ctx.save();
  ctx.translate(anchor.x, anchor.y - effect.lift);
  ctx.rotate(effect.rot);
  ctx.scale(effect.sx, effect.sy);
  if (id === 'wheel') drawWheelFurniture(0, 0, s, t, part);
  else if (id === 'cushion') drawCushionFurniture(0, 0, s, t);
  else if (id === 'plant') drawPlantFurniture(0, 0, s, t);
  else if (id === 'window') drawWindowFurniture(0, 0, s, t);
  ctx.restore();
}

function drawOwnedFurniture(t) {
  for (const id of ownedFurnitureIds()) drawFurnitureItem(id, t);
}

function drawWallFurniture(t) {
  for (const id of wallFurnitureIds()) drawFurnitureItem(id, t);
}

function wheelHasPetInside() {
  if (typeof careStats === 'undefined' || !hasFurniture('wheel')) return false;
  if (pet.behavior !== 'wheel') return false;
  const target = furnitureUsePoint('wheel');
  return dist(pet.x, pet.y, target.x, target.y) < 48;
}

function drawFloorFurnitureBehindPet(t) {
  const ids = floorFurnitureIds().slice().sort((a, b) => furnitureGroundY(a) - furnitureGroundY(b));
  const wheelInside = wheelHasPetInside();
  for (const id of ids) {
    if (id === 'wheel' && wheelInside) {
      drawFurnitureItem(id, t, 'back');
      continue;
    }
    if (furnitureGroundY(id) <= pet.y) drawFurnitureItem(id, t);
  }
}

function drawFloorFurnitureInFrontOfPet(t) {
  const ids = floorFurnitureIds().slice().sort((a, b) => furnitureGroundY(a) - furnitureGroundY(b));
  const wheelInside = wheelHasPetInside();
  for (const id of ids) {
    if (id === 'wheel' && wheelInside) {
      drawFurnitureItem(id, t, 'front');
      continue;
    }
    if (furnitureGroundY(id) > pet.y) drawFurnitureItem(id, t);
  }
}

function drawFurniturePreviewCanvas(canvas, id) {
  const pctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = 72;
  const height = 56;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  pctx.clearRect(0, 0, width, height);
  pctx.fillStyle = 'rgba(116,96,72,0.08)';
  pctx.beginPath();
  pctx.ellipse(width / 2, 46, 26, 6, 0, 0, Math.PI * 2);
  pctx.fill();
  pctx.lineCap = 'round';
  if (id === 'wheel') {
    pctx.strokeStyle = FURNITURE_WHEEL;
    pctx.lineWidth = 6;
    pctx.beginPath();
    pctx.arc(36, 27, 17, 0, Math.PI * 2);
    pctx.stroke();
    pctx.strokeStyle = FURNITURE_WHEEL_DARK;
    pctx.lineWidth = 2;
    pctx.beginPath();
    pctx.moveTo(26, 46); pctx.lineTo(32, 32);
    pctx.moveTo(46, 46); pctx.lineTo(40, 32);
    pctx.moveTo(36, 27); pctx.lineTo(51, 27);
    pctx.moveTo(36, 27); pctx.lineTo(36, 12);
    pctx.stroke();
  } else if (id === 'cushion') {
    pctx.fillStyle = FURNITURE_CUSHION;
    pctx.beginPath();
    pctx.ellipse(36, 33, 25, 12, 0, 0, Math.PI * 2);
    pctx.fill();
    pctx.strokeStyle = OUTLINE;
    pctx.lineWidth = 2;
    pctx.stroke();
  } else if (id === 'plant') {
    pctx.strokeStyle = FURNITURE_LEAF;
    pctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const side = i - 2;
      pctx.beginPath();
      pctx.moveTo(36, 34);
      pctx.quadraticCurveTo(36 + side * 4, 23, 36 + side * 8, 14 + Math.abs(side) * 2);
      pctx.stroke();
    }
    pctx.fillStyle = FURNITURE_POT;
    pctx.beginPath();
    pctx.ellipse(36, 39, 12, 9, 0, 0, Math.PI * 2);
    pctx.fill();
  } else if (id === 'window') {
    pctx.fillStyle = FURNITURE_WINDOW_LIGHT;
    pctx.beginPath();
    pctx.ellipse(36, 27, 25, 17, 0, 0, Math.PI * 2);
    pctx.fill();
    pctx.strokeStyle = FURNITURE_WINDOW;
    pctx.lineWidth = 5;
    pctx.stroke();
    pctx.strokeStyle = FURNITURE_WHEEL_DARK;
    pctx.lineWidth = 1.5;
    pctx.beginPath();
    pctx.moveTo(36, 13);
    pctx.lineTo(36, 41);
    pctx.stroke();
  }
}

function drawWalkHill(floorY, y, h, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = WALK_HILL;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.quadraticCurveTo(W * 0.25, y - h * 0.55, W * 0.5, y - h * 0.18);
  ctx.quadraticCurveTo(W * 0.75, y + h * 0.14, W, y - h * 0.36);
  ctx.lineTo(W, floorY);
  ctx.lineTo(0, floorY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWalkTrail() {
  const y = H * 0.69;
  const wide = Math.min(72, W * 0.16);
  const narrow = Math.max(14, wide * 0.28);
  ctx.fillStyle = WALK_PATH;
  ctx.beginPath();
  ctx.moveTo(-45, y - narrow * 0.15);
  ctx.bezierCurveTo(W * 0.18, y - wide * 0.62, W * 0.38, y + wide * 0.45, W * 0.58, y - wide * 0.08);
  ctx.bezierCurveTo(W * 0.78, y - wide * 0.54, W * 0.92, y + narrow * 0.4, W + 45, y - narrow * 0.05);
  ctx.lineTo(W + 45, y + narrow * 0.85);
  ctx.bezierCurveTo(W * 0.88, y + wide * 0.85, W * 0.7, y + wide * 0.32, W * 0.54, y + wide * 0.7);
  ctx.bezierCurveTo(W * 0.34, y + wide * 1.14, W * 0.16, y + wide * 0.12, -45, y + narrow * 0.7);
  ctx.closePath();
  ctx.fill();
}

function drawWalkGrass(t) {
  ctx.strokeStyle = WALK_GRASS;
  ctx.lineCap = 'round';
  for (const cluster of placeWorld.walk.grass) {
    const bx = cluster.x * W;
    const by = cluster.y * H;
    const s = depthScaleAt(by);
    ctx.lineWidth = Math.max(1.2, 1.5 * s);
    for (const blade of cluster.blades) {
      const ox = blade.ox * W;
      const root = blade.root * W;
      const sway = Math.sin(t * 1.8 + cluster.phase + ox * 0.02) * 3.2 * s;
      const h = blade.h * H * s;
      ctx.beginPath();
      ctx.moveTo(bx + root, by);
      ctx.quadraticCurveTo(bx + ox + blade.lean * 4 * s + sway * 0.35, by - h * 0.52, bx + ox + blade.lean * 7 * s + sway, by - h);
      ctx.stroke();
    }
  }
}

function drawWalkProps(t) {
  for (const prop of placeWorld.walk.props) {
    const x = prop.x * W;
    const y = prop.y * H;
    const s = depthScaleAt(y);
    const wobble = Math.sin(t * 1.7 + prop.phase) * 0.025;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 + wobble, 1 - wobble * 0.6);
    drawLumpyBlobShape(0, 0, prop.rx * W * s, prop.ry * H * s, prop.lumps, t + prop.phase, 0.018);
    ctx.fillStyle = prop.kind === 'stone' ? WALK_STONE : WALK_SHRUB;
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = outlineWidth(34 * s);
    ctx.stroke();
    ctx.restore();
  }
}

function drawWalkClouds(t) {
  for (const cloud of placeWorld.walk.clouds) {
    const pad = cloud.rx * W + 60;
    const x = ((cloud.x * W + t * cloud.speed + pad) % (W + pad * 2)) - pad;
    const y = cloud.y * H;
    drawLumpyBlobShape(x, y, cloud.rx * W, cloud.ry * H, cloud.lumps, t * 0.8 + cloud.phase, 0.022);
    ctx.fillStyle = WALK_CLOUD;
    ctx.fill();
  }
}

function drawWalkSniffSpots(t) {
  if (!walkVisit || !walkVisit.active || walkVisit.discoveries >= walkVisit.maxDiscoveries) return;
  const spot = placeWorld.walk.sniffSpots[walkVisit.targetSpot % placeWorld.walk.sniffSpots.length];
  const x = spot.x * W;
  const y = spot.y * H;
  const s = depthScaleAt(y);
  const pulse = 0.55 + Math.sin(t * 2 + spot.phase) * 0.18;
  ctx.save();
  ctx.globalAlpha = walkVisit.sniffing ? pulse : 0.24;
  ctx.fillStyle = WALK_SPARK;
  ctx.beginPath();
  ctx.ellipse(x, y - 5 * s, 6 * s, 2.8 * s, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawButterfly(t) {
  if (!butterfly || (!butterfly.active && butterfly.noseT <= 0)) return;
  const s = depthScaleAt(butterfly.y);
  const flap = Math.sin(t * 24 + butterfly.t * 3);
  ctx.save();
  ctx.translate(butterfly.x, butterfly.y);
  ctx.rotate(Math.sin(t * 3 + butterfly.t) * 0.18);
  ctx.fillStyle = WALK_BUTTERFLY;
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  ctx.ellipse(-4 * s, -1 * s, 4.8 * s, (2.7 + flap * 1.1) * s, -0.55, 0, Math.PI * 2);
  ctx.ellipse(4 * s, -1 * s, 4.8 * s, (2.7 - flap * 1.1) * s, 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(1, 1.2 * s);
  ctx.beginPath();
  ctx.moveTo(0, -5 * s);
  ctx.quadraticCurveTo(1.5 * s, -1 * s, 0, 5 * s);
  ctx.stroke();
  ctx.restore();
}

function drawWalkWorld(t) {
  const floorY = H * 0.39;
  ctx.fillStyle = WALK_SKY;
  ctx.fillRect(0, 0, W, H);
  drawWalkClouds(t);
  drawWalkHill(floorY, floorY + H * 0.035, H * 0.08, 0.78);
  drawWalkHill(floorY, floorY + H * 0.07, H * 0.06, 0.48);
  ctx.fillStyle = WALK_FLOOR;
  ctx.fillRect(0, floorY, W, H - floorY);
  drawWalkTrail();
  drawWalkSniffSpots(t);
  drawWalkGrass(t);
  drawWalkProps(t);
  if (!butterfly || butterfly.noseT <= 0) drawButterfly(t);
}

function drawBattleFlag(flag, t) {
  const x = flag.x * W;
  const y = flag.y * H;
  const s = depthScaleAt(y);
  const poleH = 42 * s;
  const wave = Math.sin(t * 3.6 + flag.phase) * 5 * s;
  ctx.strokeStyle = BATTLE_RING;
  ctx.lineWidth = Math.max(1.5, 2 * s);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y + 14 * s);
  ctx.lineTo(x, y - poleH);
  ctx.stroke();
  ctx.fillStyle = BATTLE_FLAG;
  ctx.beginPath();
  ctx.moveTo(x, y - poleH + 5 * s);
  ctx.quadraticCurveTo(x + flag.side * (20 * s + wave), y - poleH + 1 * s, x + flag.side * 31 * s, y - poleH + 11 * s);
  ctx.quadraticCurveTo(x + flag.side * (18 * s + wave * 0.4), y - poleH + 19 * s, x, y - poleH + 18 * s);
  ctx.closePath();
  ctx.fill();
}

function drawBattleFootprints() {
  ctx.fillStyle = BATTLE_FOOTPRINT;
  for (const fp of placeWorld.battle.footprints) {
    const x = fp.x * W;
    const y = fp.y * H;
    const s = depthScaleAt(y);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(fp.r);
    ctx.beginPath();
    ctx.ellipse(-7 * s, -2 * s, 6 * s, 2.8 * s, -0.25, 0, Math.PI * 2);
    ctx.ellipse(7 * s, 5 * s, 6 * s, 2.8 * s, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBattleWorld(t) {
  const floorY = H * 0.39;
  ctx.fillStyle = BATTLE_SKY;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = BATTLE_FLOOR;
  ctx.fillRect(0, floorY, W, H - floorY);
  const cx = W * 0.5;
  const cy = H * 0.67;
  const rx = Math.min(W * 0.34, 184);
  const ry = H * 0.135;
  drawLumpyBlobShape(cx, cy, rx * 0.96, ry * 1.1, placeWorld.battle.ringLumps, t * 0.15, 0.006);
  ctx.fillStyle = BATTLE_SAND;
  ctx.fill();
  ctx.strokeStyle = BATTLE_RING;
  ctx.lineWidth = Math.max(3, W * 0.005);
  drawLumpyBlobShape(cx, cy, rx, ry, placeWorld.battle.ringLumps, t * 0.12, 0.01);
  ctx.stroke();
  ctx.strokeStyle = BATTLE_RING;
  ctx.lineWidth = Math.max(1.5, W * 0.0025);
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.74, cy + Math.sin(t) * 2);
  ctx.quadraticCurveTo(cx, cy - ry * 0.12, cx + rx * 0.74, cy + Math.cos(t * 0.7) * 2);
  ctx.stroke();
  for (const flag of placeWorld.battle.flags) drawBattleFlag(flag, t);
  drawBattleFootprints();
}

function drawWorld(t) {
  const placeName = typeof currentPlace === 'function' ? currentPlace() : 'home';
  if (placeName === 'walk') {
    drawWalkWorld(t);
  } else if (placeName === 'battle') {
    drawBattleWorld(t);
  } else {
    drawHomeWorld(t);
  }
  drawDayCycleOverlay();
}

function drawDayCycleOverlay() {
  const period = typeof dayPeriod === 'function' ? dayPeriod() : 'day';
  const tones = {
    morning: DAY_MORNING_TONE,
    day: DAY_TONE,
    evening: DAY_EVENING_TONE,
    night: DAY_NIGHT_TONE,
  };
  if (period === 'night') {
    ctx.fillStyle = DAY_NIGHT_TONE;
    ctx.fillRect(0, 0, W, H * 0.39);
  }
  ctx.fillStyle = tones[period] || DAY_TONE;
  ctx.fillRect(0, 0, W, H);
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
  const alertPulse = clamp(
    reactionPulse('startle') + reactionPulse('lift') * 0.65 + reactionPulse('dizzy') * 0.45 + reactionPulse('proud') * 0.25 + reactionPulse('gift') * 0.25,
    0,
    1
  );
  const earScale = geneValue('earScale', 1) * stageScale('ear');
  const earSpread = geneValue('earSpread', 0.52);
  for (const side of [-1, 1]) {
    let twitch = 0;
    if (tw.side === side && tw.t < 0.4) twitch = Math.sin(tw.t * 28) * 0.25 * (1 - tw.t / 0.4);
    const baseTilt = heldOrFalling ? 0.43 : mellow ? 0.22 : 0.3;
    ctx.save();
    ctx.translate(side * r * earSpread, -r * 0.66 + (heldOrFalling ? r * 0.06 : 0) + (mellow ? r * 0.035 : 0) - alertPulse * r * 0.08);
    ctx.rotate(side * (baseTilt + alertPulse * 0.08) + twitch * (heldOrFalling ? 0.35 : mellow ? 0.65 : 1));
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

function poseValue(name) {
  return clamp(pet.pose && Number.isFinite(pet.pose[name]) ? pet.pose[name] : 0, 0, 1);
}

function posePulse() {
  const age = pet.pose && Number.isFinite(pet.pose.t) ? pet.pose.t : 9;
  if (age >= 0.48) return 0;
  return Math.sin(age / 0.48 * Math.PI);
}

function reactionPulse(kind) {
  if (pet.reactionKind !== kind || !(pet.reactionT > 0) || !(pet.reactionDur > 0)) return 0;
  const age = clamp(1 - pet.reactionT / pet.reactionDur, 0, 1);
  return Math.sin(age * Math.PI);
}

function draw(t) {
  ctx.clearRect(0, 0, W, H);
  drawWorld(t);

  if (currentStage() === 'egg') {
    if (currentPlace() === 'home') drawFloorFurnitureBehindPet(t);
    drawEgg(t);
    if (currentPlace() === 'home') drawFloorFurnitureInFrontOfPet(t);
    drawParticlesLayer();
    drawPetCaption();
    return;
  }

  if (currentPlace() === 'home') drawFloorFurnitureBehindPet(t);

  const s = depthScale(), r = stagedRadius();
  const bellyBlend = poseValue('belly');
  const sleepBlend = poseValue('sleep');
  const sniffBlend = poseValue('sniff');
  const plopBlend = poseValue('plop');
  const wiggleBlend = poseValue('wiggle');
  const liftPulse = reactionPulse('lift');
  const startlePulse = reactionPulse('startle');
  const dizzyPulse = reactionPulse('dizzy');
  const proudPulse = reactionPulse('proud');
  const giftPulse = reactionPulse('gift');
  const bouncePulse = reactionPulse('bounce');
  const loafBlend = clamp(Math.max(sleepBlend * 0.42, plopBlend * 0.78), 0, 1);
  const defeatedPose = (pet.defeatT || 0) > 0;
  const sy = pet.squash, sx = 1 + (1 - sy) * 0.85;
  const sp = Math.hypot(pet.vx, pet.vy);
  const normalBob = Math.abs(Math.sin(pet.walkPhase)) * -4 * (sp > 10 ? 1 : 0);
  const bob = normalBob * (1 - bellyBlend);
  const breathe = lerp(Math.sin(t * 2.6) * 0.015, Math.sin(t * 1.6) * 0.035, sleepBlend);
  const normalCy = pet.y + pet.jy + bob - r * sy;
  const bellyCy = pet.y + pet.jy - r * 0.46;
  const cy = lerp(normalCy, bellyCy, bellyBlend) + loafBlend * r * 0.08 - r * (startlePulse * 0.08 + liftPulse * 0.05 + proudPulse * 0.04 + giftPulse * 0.03);
  const settle = posePulse();
  const bodyScaleX = lerp(sx + breathe, 1.28 + breathe, bellyBlend) + loafBlend * 0.12 + settle * 0.025 - startlePulse * 0.04 - liftPulse * 0.025 + proudPulse * 0.035 + giftPulse * 0.025 + bouncePulse * 0.035;
  const bodyScaleY = clamp(lerp(sy - breathe, 0.68 - breathe * 0.45, bellyBlend) - loafBlend * 0.1 - settle * 0.018 + startlePulse * 0.08 + liftPulse * 0.055 - proudPulse * 0.025 - giftPulse * 0.018 - bouncePulse * 0.035 + dizzyPulse * 0.035, 0.5, 1.55);

  // 그림자
  ctx.fillStyle = 'rgba(120,100,70,0.18)';
  ctx.beginPath();
  ctx.ellipse(
    pet.x,
    pet.y + 4,
    r * (lerp(1.15, 1.45, bellyBlend) + loafBlend * 0.2) * sx * (1 - pet.jy * -0.002),
    r * clamp(lerp(0.28, 0.22, bellyBlend) - loafBlend * 0.035, 0.16, 0.32),
    0,
    0,
    Math.PI * 2
  );
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
  drawBattleResult();

  // 꼬리 (몸 뒤)
  if (bellyBlend < 0.98) {
    ctx.save();
    ctx.globalAlpha *= 1 - bellyBlend;
    drawTail(tail, 8);
    ctx.restore();
  }

  ctx.fillStyle = bodyColor();
  if (defeatedPose) {
    ctx.fillStyle = 'rgba(120,100,70,0.11)';
    ctx.beginPath();
    ctx.ellipse(pet.x - pet.dir * r * 0.22, cy + r * 0.48, r * 0.46, r * 0.08, -0.15, 0, Math.PI * 2);
    ctx.fill();
  } else {
    if (bellyBlend > 0.02) {
      ctx.save();
      ctx.globalAlpha *= bellyBlend;
      const pawBob = Math.sin(t * 2.3) * r * 0.025;
      for (const paw of [
        { x: -0.56, y: -0.08 },
        { x: 0.55, y: -0.06 },
        { x: -0.42, y: 0.34 },
        { x: 0.43, y: 0.35 },
      ]) {
        ctx.beginPath();
        ctx.ellipse(pet.x + paw.x * r, cy + paw.y * r + pawBob, 6.2 * s * stageScale('leg'), 4.2 * s * stageScale('leg'), paw.x * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (bellyBlend < 0.98) {
      ctx.save();
      ctx.globalAlpha *= 1 - bellyBlend;
      // 다리 (뭉툭한 캡슐)
      ctx.strokeStyle = bodyColor(); ctx.lineWidth = 9 * s * stageScale('leg'); ctx.lineCap = 'round';
      for (const f of feet) {
        ctx.beginPath();
        ctx.moveTo(pet.x + f.ox * r * 0.8, cy + r * 0.5 * bodyScaleY);
        ctx.lineTo(f.x, f.y);
        ctx.stroke();
      }
      // 발끝
      for (const f of feet) { ctx.beginPath(); ctx.arc(f.x, f.y, 5.5 * s * stageScale('leg'), 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }

  // 몸통 (머리 겸용 한 덩어리)
  ctx.save();
  ctx.translate(pet.x, cy);
  if (defeatedPose) ctx.rotate(pet.rollSpin || Math.sin(t * 7) * 0.2);
  ctx.rotate(startlePulse * Math.sin(t * 22) * 0.035 + dizzyPulse * Math.sin(t * 18) * 0.08 + bouncePulse * Math.sin(t * 24) * 0.045);
  if (wiggleBlend > 0.01) ctx.rotate(Math.sin(t * 14) * 0.13 * wiggleBlend);
  if (pet.tripT > 0) ctx.rotate(pet.dir * pet.tripT * 0.35);
  ctx.scale(bodyScaleX, bodyScaleY);
  drawEars(r, 'outer');
  drawBlob(0, 0, r * 1.05 * geneValue('bodyAspect', 1), r);
  ctx.fillStyle = bodyColor(); ctx.fill();
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = outlineWidth(r); ctx.stroke();
  // 배 무늬
  ctx.beginPath(); ctx.ellipse(0, r * lerp(0.45, 0.1, bellyBlend), r * lerp(0.55, 0.66, bellyBlend), r * lerp(0.4, 0.5, bellyBlend), 0, 0, Math.PI * 2);
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
  const headDip = sniffBlend * (r * 0.35 + Math.sin(t * 9) * 2);
  const fx = pet.x + pet.dir * r * 0.22 * bodyScaleX;
  const fy = cy - r * 0.25 * bodyScaleY + headDip + r * stageScale('eyeYOffset');
  const eyeGap = r * 0.3 * bodyScaleX;
  const gx = pet.gazeX * 3.2, gy = pet.gazeY * 2.4;
  const held = input.mode === 'drag';
  const falling = pet.jy < -8 && pet.landCaption;
  const justLanded = pet.landingT > 0;
  let eyeClose = clamp(sleepBlend + (pet.blink > 0 ? 1 : 0) + plopBlend * clamp((0.78 - pet.squash) / 0.3, 0, 1), 0, 1);
  const mood = careMood();
  const hungryEyes = mood === 'hungry';
  const tiredEyes = mood === 'tired';
  const shyEyes = mood === 'shy';
  const startleEyes = !held && !falling && !justLanded && (startlePulse > 0.12 || liftPulse > 0.28);
  if (startleEyes) eyeClose = 0;
  const happyEyes = pet.happy > 0.5 || mood === 'content' || proudPulse > 0.08 || giftPulse > 0.08;

  if (defeatedPose) {
    ctx.save();
    ctx.translate(pet.x, cy);
    ctx.rotate(pet.rollSpin || Math.sin(t * 7) * 0.2);
    ctx.translate(-pet.x, -cy);
  }
  ctx.strokeStyle = '#4a3a2c'; ctx.fillStyle = '#4a3a2c'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  // 눈 두 개 — 일부러 크기가 다름 (하찮음 포인트)
  const eyes = [{ ox: -eyeGap, r: geneValue('eyeL', 3.6) * s * stageScale('eye'), oy: 0 }, { ox: eyeGap, r: geneValue('eyeR', 2.9) * s * stageScale('eye'), oy: geneValue('eyeTilt', -1.5) * s }];
  for (const e of eyes) {
    const ex = fx + e.ox + gx;
    const ey = fy + e.oy + gy;
    if (defeatedPose) {
      ctx.beginPath();
      ctx.moveTo(ex - 4.2 * s, ey - 4.2 * s);
      ctx.lineTo(ex + 4.2 * s, ey + 4.2 * s);
      ctx.moveTo(ex + 4.2 * s, ey - 4.2 * s);
      ctx.lineTo(ex - 4.2 * s, ey + 4.2 * s);
      ctx.stroke();
    } else if (held || falling || justLanded) {
      const pinch = e.ox < 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(ex - 4.2 * pinch * s, ey - 2.6 * s);
      ctx.lineTo(ex, ey + 0.8 * s);
      ctx.lineTo(ex - 4.2 * pinch * s, ey + 4.2 * s);
      ctx.stroke();
    } else {
      if (eyeClose < 0.98) {
        ctx.save();
        ctx.globalAlpha *= 1 - eyeClose;
        if (startleEyes) {
          ctx.beginPath();
          ctx.ellipse(ex, ey + 0.2 * s, e.r * 1.35, e.r * 1.55, 0, 0, Math.PI * 2);
          ctx.fill();
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
        ctx.restore();
      }
      if (eyeClose > 0.02) {
        ctx.save();
        ctx.globalAlpha *= eyeClose;
        ctx.beginPath();
        ctx.moveTo(ex - 3.5, ey);
        ctx.lineTo(ex + 3.5, ey);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  // 어지러움 소용돌이
  if (pet.dizzy >= 3) {
    ctx.save(); ctx.strokeStyle = '#8a7a68'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(fx, fy - r * 0.8, 6, t * 6, t * 6 + 4.6); ctx.stroke();
    ctx.restore();
  }
  // 입: 항상 같은 ω 모양을 유지한다
  const my = fy + r * 0.28 * bodyScaleY + gy * 0.5;
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
  if (defeatedPose) ctx.restore();
  if (ball && ball.phase === 'carried') drawBallObject(1);
  if (butterfly && butterfly.noseT > 0) drawButterfly(t);
  if (currentPlace() === 'home') drawFloorFurnitureInFrontOfPet(t);

  drawParticlesLayer();
  drawPetCaption();
}
