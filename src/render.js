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

function drawLumpyBlobShape(cx, cy, rx, ry, lumps, t, wobble) {
  const n = lumps.length;
  const lastA = (n - 1) / n * Math.PI * 2;
  let prevN = 1 + lumps[n - 1] + Math.sin(lastA * 3 + t) * wobble;
  let curN = 1 + lumps[0] + Math.sin(t) * wobble;
  let prevX = cx + Math.cos(lastA) * rx * prevN;
  let prevY = cy + Math.sin(lastA) * ry * prevN;
  let curX = cx + rx * curN;
  let curY = cy;
  ctx.beginPath();
  ctx.moveTo((prevX + curX) / 2, (prevY + curY) / 2);
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const nextA = next / n * Math.PI * 2;
    const nextN = 1 + lumps[next] + Math.sin(nextA * 3 + t) * wobble;
    const nextX = cx + Math.cos(nextA) * rx * nextN;
    const nextY = cy + Math.sin(nextA) * ry * nextN;
    ctx.quadraticCurveTo(curX, curY, (curX + nextX) / 2, (curY + nextY) / 2);
    curX = nextX;
    curY = nextY;
  }
  ctx.closePath();
}

function drawHomeWorld(t) {
  const floorY = H * 0.38;
  ctx.fillStyle = SURFACE_PAGE;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = SURFACE_FLOOR;
  ctx.fillRect(0, floorY, W, H - floorY);
  drawOwnedFurniture(t);
}

function drawWheelFurniture(x, y, s, t) {
  const spin = typeof furnitureState === 'undefined' ? t * 0.8 : furnitureState.wheelSpin;
  const r = 32 * s;
  ctx.save();
  ctx.translate(x, y - r * 0.55);
  ctx.strokeStyle = FURNITURE_WHEEL_DARK;
  ctx.lineWidth = Math.max(2, 3 * s);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.64, r * 0.88);
  ctx.lineTo(-r * 0.22, r * 0.24);
  ctx.moveTo(r * 0.64, r * 0.88);
  ctx.lineTo(r * 0.22, r * 0.24);
  ctx.stroke();
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

function drawFurnitureItem(id, t) {
  const anchor = furnitureAnchor(id);
  const s = depthScaleAt(anchor.y);
  if (id === 'wheel') drawWheelFurniture(anchor.x, anchor.y, s, t);
  else if (id === 'cushion') drawCushionFurniture(anchor.x, anchor.y, s, t);
  else if (id === 'plant') drawPlantFurniture(anchor.x, anchor.y, s, t);
  else if (id === 'window') drawWindowFurniture(anchor.x, anchor.y, s, t);
}

function drawOwnedFurniture(t) {
  if (typeof careStats === 'undefined' || !Array.isArray(careStats.furnitureOwned)) return;
  for (const id of careStats.furnitureOwned) drawFurnitureItem(id, t);
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
    return;
  }
  if (placeName === 'battle') {
    drawBattleWorld(t);
    return;
  }
  drawHomeWorld(t);
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
  drawWorld(t);

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
  if (butterfly && butterfly.noseT > 0) drawButterfly(t);

  drawParticlesLayer();
  drawPetCaption();
}
