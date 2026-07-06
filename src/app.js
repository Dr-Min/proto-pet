'use strict';
// allow: SIZE_OK — temporary behavior prototype; next wave should split input, simulation, and rendering.
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
function resize() {
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', () => { resize(); applySize(); });
resize();

const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const urlParams = new URLSearchParams(location.search);
const forcedHour = Number(urlParams.get('hour'));
function nowTime() {
  const injectedNow = typeof window !== 'undefined' ? Number(window.__petNow) : NaN;
  return Number.isFinite(injectedNow) ? injectedNow : Date.now();
}
function currentHour() {
  if (Number.isInteger(forcedHour) && forcedHour >= 0 && forcedHour <= 23) return forcedHour;
  return new Date(nowTime()).getHours();
}
function dayPeriod() {
  const hour = currentHour();
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
function isNightPeriod() {
  return dayPeriod() === 'night';
}

const FOOD_TYPES = [
  { id: 'kibble', name: '동글 사료', fill: '#f0c98b', top: '#d59b57', bits: '#8c6042' },
  { id: 'berry', name: '베리 간식', fill: '#eeb0b7', top: '#ce7084', bits: '#89495b' },
  { id: 'leaf', name: '풀내음 밥', fill: '#c9d99a', top: '#94ad68', bits: '#5f7446' },
];
const FURNITURE_ITEMS = [
  { id: 'wheel', name: '쳇바퀴', price: 14, anchor: { x: 0.26, y: 0.66 }, zone: 'floor', scale: 1.7, baseRadius: 32, note: '달리다 굴러도 진지함' },
  { id: 'window', name: '창문', price: 10, anchor: { x: 0.76, y: 0.26 }, zone: 'wall', scale: 1.5, baseRadius: 44, note: '멍하니 바깥 봄' },
  { id: 'cushion', name: '쿠션', price: 8, anchor: { x: 0.56, y: 0.72 }, zone: 'floor', scale: 1.3, baseRadius: 38, note: '잠이 더 푹신함' },
  { id: 'plant', name: '화분', price: 6, anchor: { x: 0.16, y: 0.7 }, zone: 'floor', scale: 0.8, baseRadius: 36, note: '냄새 맡을 거리' },
];
function furnitureItemById(id) {
  return FURNITURE_ITEMS.find(item => item.id === id) || null;
}
function defaultFurnitureRatio(id) {
  const item = furnitureItemById(id);
  if (!item) return { xr: 0.5, yr: 0.65 };
  return { xr: item.anchor.x, yr: item.anchor.y };
}
function furnitureZone(id) {
  const item = furnitureItemById(id);
  return item && item.zone === 'wall' ? 'wall' : 'floor';
}
function furniturePrimarySize(id, y) {
  const item = furnitureItemById(id);
  const bodyR = pet.r * depthScaleAt(y) * stageScale('body');
  return bodyR * (item ? item.scale : 1);
}
function furnitureDrawScale(id, y) {
  const item = furnitureItemById(id);
  if (!item) return depthScaleAt(y);
  return furniturePrimarySize(id, y) / item.baseRadius;
}
function furnitureMinGap(y) {
  return pet.r * depthScaleAt(y) * stageScale('body') * 1.2;
}
function furnitureClampPoint(id, x, y) {
  const zone = furnitureZone(id);
  const clampedY = zone === 'wall'
    ? clamp(y, H * 0.16, H * 0.34)
    : clamp(y, H * 0.42, H * 0.83);
  const margin = clamp(furniturePrimarySize(id, clampedY) * 0.72, 34, Math.min(112, W * 0.24));
  return {
    x: clamp(x, margin, W - margin),
    y: clampedY,
  };
}
function furnitureRatioFromPoint(id, x, y) {
  const point = furnitureClampPoint(id, x, y);
  return {
    xr: clamp(point.x / Math.max(1, W), 0, 1),
    yr: clamp(point.y / Math.max(1, H), 0, 1),
  };
}
function furniturePointFromRatio(id, ratio) {
  const fallback = defaultFurnitureRatio(id);
  const xr = ratio && Number.isFinite(Number(ratio.xr)) ? Number(ratio.xr) : fallback.xr;
  const yr = ratio && Number.isFinite(Number(ratio.yr)) ? Number(ratio.yr) : fallback.yr;
  return furnitureClampPoint(id, clamp(xr, 0, 1) * W, clamp(yr, 0, 1) * H);
}
function furnitureRawAnchor(id) {
  if (typeof careStats === 'undefined') return furniturePointFromRatio(id, defaultFurnitureRatio(id));
  return furniturePointFromRatio(id, careStats.furniturePlaced && careStats.furniturePlaced[id]);
}
function furnitureDragAnchor(id) {
  if (typeof furnitureMotion !== 'undefined' && furnitureMotion.heldId === id) {
    return furnitureClampPoint(id, furnitureMotion.x, furnitureMotion.y);
  }
  return null;
}
function furnitureAnchor(id) {
  return furnitureDragAnchor(id) || furnitureRawAnchor(id);
}
function furnitureGroundY(id) {
  const anchor = furnitureAnchor(id);
  if (furnitureZone(id) === 'wall') return anchor.y - H;
  return anchor.y;
}
function ownedFurnitureIds() {
  if (typeof careStats === 'undefined' || !Array.isArray(careStats.furnitureOwned)) return [];
  return careStats.furnitureOwned.filter(id => furnitureItemById(id));
}
function floorFurnitureIds() {
  return ownedFurnitureIds().filter(id => furnitureZone(id) === 'floor');
}
function wallFurnitureIds() {
  return ownedFurnitureIds().filter(id => furnitureZone(id) === 'wall');
}
function constrainedFurniturePoint(id, x, y) {
  const origin = furnitureClampPoint(id, x, y);
  let point = { ...origin };
  const ids = ownedFurnitureIds().filter(otherId => otherId !== id && furnitureZone(otherId) === furnitureZone(id));
  for (let pass = 0; pass < 6; pass++) {
    let moved = false;
    for (let i = 0; i < ids.length; i++) {
      const other = furnitureRawAnchor(ids[i]);
      const dx = point.x - other.x;
      const dy = point.y - other.y;
      const d = Math.hypot(dx, dy);
      const minD = furnitureMinGap((point.y + other.y) / 2);
      if (d >= minD) continue;
      const a = d > 0.001 ? Math.atan2(dy, dx) : (i + 1) * 1.91;
      const push = (minD - d) * 0.62;
      point = furnitureClampPoint(id, point.x + Math.cos(a) * push, point.y + Math.sin(a) * push);
      moved = true;
    }
    if (!moved) break;
  }
  let best = point;
  let bestScore = furnitureSeparationScore(id, point, ids);
  const minTarget = furnitureMinGap(point.y);
  if (bestScore < minTarget) {
    for (let radiusStep = 1; radiusStep <= 5; radiusStep++) {
      const radius = minTarget * radiusStep * 0.52;
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2 + radiusStep * 0.37;
        const candidate = furnitureClampPoint(id, origin.x + Math.cos(a) * radius, origin.y + Math.sin(a) * radius);
        const score = furnitureSeparationScore(id, candidate, ids) - dist(origin.x, origin.y, candidate.x, candidate.y) * 0.04;
        if (score > bestScore) {
          best = candidate;
          bestScore = score;
        }
      }
    }
  }
  return best;
}
function furnitureSeparationScore(id, point, otherIds) {
  if (!otherIds.length) return Infinity;
  let score = Infinity;
  for (const otherId of otherIds) {
    const other = furnitureRawAnchor(otherId);
    score = Math.min(score, dist(point.x, point.y, other.x, other.y));
  }
  return score;
}
function furnitureHitTest(x, y) {
  const ids = ownedFurnitureIds().slice().sort((a, b) => furnitureGroundY(b) - furnitureGroundY(a));
  for (const id of ids) {
    const anchor = furnitureAnchor(id);
    const size = furniturePrimarySize(id, anchor.y);
    let cx = anchor.x;
    let cy = anchor.y;
    let rx = size * 0.95;
    let ry = size * 0.72;
    if (id === 'wheel') {
      cx = anchor.x;
      cy = anchor.y - size * 0.55;
      rx = size * 1.2;
      ry = size * 1.36;
    } else if (id === 'cushion') {
      rx = size * 1.28;
      ry = size * 0.62;
    } else if (id === 'plant') {
      cy = anchor.y - size * 0.42;
      rx = size * 0.76;
      ry = size * 1.15;
    } else if (id === 'window') {
      rx = size * 1.05;
      ry = size * 0.82;
    }
    const dx = (x - cx) / Math.max(1, rx);
    const dy = (y - cy) / Math.max(1, ry);
    if (dx * dx + dy * dy <= 1) return id;
  }
  return '';
}
function foodTypeById(id) {
  return FOOD_TYPES.find(type => type.id === id) || FOOD_TYPES[0];
}
function nextFoodType() {
  return FOOD_TYPES[careStats.mealsFed % FOOD_TYPES.length];
}
function foodObjectLabel(foodType) {
  const code = foodType.name.charCodeAt(foodType.name.length - 1) - 0xac00;
  const particle = code >= 0 && code <= 11171 && code % 28 === 0 ? '를' : '을';
  return `${foodType.name}${particle}`;
}

function makeGeneRng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function loadGeneSeed() {
  const urlSeed = new URLSearchParams(location.search).get('seed');
  if (urlSeed !== null && Number.isInteger(+urlSeed)) return +urlSeed;
  try {
    const saved = JSON.parse(localStorage.getItem('protopet-genes') || 'null');
    if (Number.isInteger(saved)) return saved;
  } catch (_) {}
  const seed = Math.floor(Math.random() * 2147483647);
  try { localStorage.setItem('protopet-genes', String(seed)); } catch (_) {}
  return seed;
}
const geneSeed = loadGeneSeed();
const geneRand = makeGeneRng(geneSeed);
function genePick(lo, hi) { return lo + geneRand() * (hi - lo); }
const genes = {
  seed: geneSeed,
  hue: genePick(24, 42),
  sat: genePick(34, 50),
  light: genePick(80, 87),
  bodyAspect: genePick(0.96, 1.1),
  earScale: genePick(0.84, 1.18),
  earSpread: genePick(0.48, 0.58),
  eyeL: genePick(3.0, 4.2),
  eyeR: genePick(2.5, 3.7),
  eyeTilt: genePick(-2.2, 0.8),
  tailLen: genePick(7, 10),
  lump: genePick(1.7, 3.0),
};
genes.favoriteFoodId = FOOD_TYPES[Math.floor(geneRand() * FOOD_TYPES.length)].id;
genes.body = `hsl(${genes.hue} ${genes.sat}% ${genes.light}%)`;
genes.bodyDark = `hsl(${genes.hue} ${Math.max(24, genes.sat - 8)}% ${Math.max(68, genes.light - 12)}%)`;
genes.belly = `hsla(${genes.hue + 8} 70% 96% / 0.58)`;

const STAGES = ['egg', 'baby', 'adult'];
const STAGE_PREVIEW = new URLSearchParams(location.search).get('stage');
const FAST_PREVIEW = new URLSearchParams(location.search).get('fast') === '1';
const STAGE_SCALES = {
  egg: { body: 0.74, eye: 1, eyeYOffset: 0, ear: 0, tail: 0, leg: 0, speed: 0, trip: 0, hunger: 0, energy: 0, zoomies: 0 },
  baby: { body: 0.62, eye: 1.35, eyeYOffset: 0.06, ear: 0.85, tail: 0.7, leg: 0.6, speed: 0.85, trip: 1.8, hunger: 1.2, energy: 1.25, zoomies: 1.3 },
  adult: { body: 1.12, eye: 1, eyeYOffset: 0, ear: 1, tail: 1.1, leg: 1.15, speed: 1.1, trip: 0.7, hunger: 1, energy: 1, zoomies: 1 },
};
function validStage(stage) { return STAGES.includes(stage); }
function stagePreview() { return validStage(STAGE_PREVIEW) ? STAGE_PREVIEW : ''; }
function isStagePreview() { return stagePreview() !== ''; }
function currentStage() {
  if (isStagePreview()) return stagePreview();
  if (typeof careStats === 'undefined' || !validStage(careStats.stage)) return 'egg';
  return careStats.stage;
}
function stageScale(name) {
  const stage = currentStage();
  const target = STAGE_SCALES[stage][name];
  if (typeof pet !== 'undefined' && pet.stageTween && !isStagePreview()) {
    const from = STAGE_SCALES[pet.stageTween.from][name];
    const to = STAGE_SCALES[pet.stageTween.to][name];
    const t = clamp(pet.stageTween.t / pet.stageTween.dur, 0, 1);
    return lerp(from, to, 1 - Math.pow(1 - t, 3));
  }
  return target;
}
function stagedRadius() { return pet.r * depthScale() * stageScale('body'); }
function stageAgeSeconds() {
  if (typeof careStats === 'undefined') return 0;
  const changedAt = Number.isFinite(careStats.stageChangedAt) ? careStats.stageChangedAt : nowTime();
  return Math.max(0, (nowTime() - changedAt) / 1000);
}
function eggHatchSeconds() { return FAST_PREVIEW ? 5 : 20; }
function adultGrowthSeconds() { return FAST_PREVIEW ? 60 : 24 * 3600; }

// ---------- 펫 상태 ----------
const pet = {
  x: 0, y: 0,          // 지면 위치 (y가 클수록 앞/아래)
  vx: 0, vy: 0,
  dir: 1,              // 바라보는 방향
  r: 46,               // 몸통 기본 반지름
  squash: 1, squashVel: 0,   // 말랑 스프링 (세로 스케일)
  jy: 0, jvy: 0,       // 점프 오프셋
  walkPhase: 0,
  wobblePhase: 0,
  gazeX: 0, gazeY: 0,  // 시선 (-1..1)
  blink: 0, nextBlink: 1,
  earTwitch: { side: 0, t: 9 }, nextTwitch: 3,   // 가끔 귀 움찔
  happy: 0, dizzy: 0,
  tripT: 0,
  behavior: 'stare', behaviorT: 2,
  munchT: 0,
  target: { x: 0, y: 0 },
  caption: '…',
  captionT: 0,
  landCaption: '',
  landingT: 0,
  eggShakeT: 0,
  hatchFxT: 0,
  stageTween: null,
  zTimer: 0,
  lumps: [],           // 몸통 비대칭 울퉁불퉁 (개체 고유)
  eggSpots: [],
};
pet.x = W / 2; pet.y = H * 0.62;
pet.target.x = pet.x; pet.target.y = pet.y;
for (let i = 0; i < 14; i++) pet.lumps.push((geneRand() * 2 - 1) * genes.lump);
for (let i = 0; i < 3; i++) {
  pet.eggSpots.push({
    x: genePick(-0.34, 0.34),
    y: genePick(-0.36, 0.28),
    r: genePick(0.055, 0.105),
  });
}

const furnitureMotion = {
  heldId: '',
  x: 0,
  y: 0,
  settleId: '',
  settleT: 0,
  settleDur: 0.34,
  sessionCaptionShown: false,
};

// PC에서 보이는 현재 비율을 기준으로 모바일에서도 같은 체감 크기를 유지한다.
function applySize() { pet.r = 46; }
applySize();

function depthScaleAt(y) { return 0.75 + (y / H) * 0.45; }
function depthScale() { return depthScaleAt(pet.y); }
function ownerPlayPoint(yRatio) {
  return { x: W / 2, y: H * yRatio };
}
function carriedBallPoint() {
  const s = depthScale(), r = pet.r * s;
  return {
    x: pet.x + pet.dir * r * 0.56,
    y: pet.y + pet.jy - r * 0.82,
  };
}
function topBounceLimit() { return Math.max(78, H * 0.1); }
function outlineWidth(r) { return clamp(r * 0.043, 1.8, 2.15); }

function makeLumps(rng, count, range) {
  const lumps = [];
  for (let i = 0; i < count; i++) lumps.push((rng() * 2 - 1) * range);
  return lumps;
}
function makeWalkGrass(rng, count) {
  const clusters = [];
  for (let i = 0; i < count; i++) {
    const blades = [];
    const bladeCount = 4 + Math.floor(rng() * 3);
    for (let j = 0; j < bladeCount; j++) {
      blades.push({
        ox: (j - (bladeCount - 1) / 2) * (0.009 + rng() * 0.004),
        h: 0.024 + rng() * 0.016,
        lean: -0.22 + rng() * 0.44,
        root: -0.006 + rng() * 0.012,
      });
    }
    clusters.push({
      x: 0.12 + rng() * 0.76,
      y: 0.48 + rng() * 0.34,
      phase: rng() * Math.PI * 2,
      blades,
    });
  }
  return clusters;
}
function makePlaceWorld() {
  const homeRng = makeGeneRng(0xC0A51E);
  const walkRng = makeGeneRng(0x2A11CE);
  const battleRng = makeGeneRng(0xBA771E);
  return {
    home: {
      furnitureLumps: {
        wheel: makeLumps(homeRng, 16, 0.06),
        cushion: makeLumps(homeRng, 12, 0.08),
        plant: makeLumps(homeRng, 9, 0.12),
      },
    },
    walk: {
      clouds: [
        { x: 0.2, y: 0.16, rx: 0.09, ry: 0.026, speed: 7, phase: walkRng() * 9, lumps: makeLumps(walkRng, 9, 0.16) },
        { x: 0.72, y: 0.22, rx: 0.07, ry: 0.022, speed: 4.5, phase: walkRng() * 9, lumps: makeLumps(walkRng, 8, 0.13) },
      ],
      grass: makeWalkGrass(walkRng, 6),
      props: [
        { kind: 'shrub', x: 0.18, y: 0.61, rx: 0.055, ry: 0.028, phase: walkRng() * 8, lumps: makeLumps(walkRng, 10, 0.18) },
        { kind: 'stone', x: 0.76, y: 0.68, rx: 0.034, ry: 0.02, phase: walkRng() * 8, lumps: makeLumps(walkRng, 9, 0.14) },
        { kind: 'shrub', x: 0.62, y: 0.55, rx: 0.044, ry: 0.024, phase: walkRng() * 8, lumps: makeLumps(walkRng, 10, 0.16) },
      ],
      sniffSpots: [
        { x: 0.26, y: 0.62, phase: walkRng() * 8 },
        { x: 0.68, y: 0.73, phase: walkRng() * 8 },
      ],
      butterfly: { x: 0.56, y: 0.44, rx: 0.18, ry: 0.09, phase: walkRng() * 8 },
    },
    battle: {
      ringLumps: makeLumps(battleRng, 18, 0.075),
      flags: [
        { x: 0.2, y: 0.51, side: 1, phase: battleRng() * 8 },
        { x: 0.8, y: 0.51, side: -1, phase: battleRng() * 8 },
      ],
      footprints: [
        { x: 0.37, y: 0.67, r: -0.3, phase: battleRng() * 8 },
        { x: 0.58, y: 0.73, r: 0.24, phase: battleRng() * 8 },
        { x: 0.49, y: 0.59, r: 0.1, phase: battleRng() * 8 },
      ],
    },
  };
}
const placeWorld = makePlaceWorld();

// ---------- 발: 절차적 걸음 ----------
// 발은 땅에 붙어 있다가, 몸이 지나가서 너무 멀어지면 앞쪽으로 폴짝 옮겨 딛는다
const feet = [-0.62, -0.22, 0.22, 0.62].map((ox, i) => ({
  ox, x: pet.x + ox * pet.r, y: pet.y,
  fromX: 0, fromY: 0, toX: 0, toY: 0,
  lift: -1,            // 0..1 진행중, -1이면 착지 상태
  group: i % 2,        // 대각선 발끼리 같이 움직임
}));
let stepClock = 0;

function footBodyTarget(f) {
  const s = depthScale(), r = stagedRadius(), legScale = stageScale('leg');
  return {
    x: pet.x + f.ox * r * 0.9,
    y: pet.y + pet.jy + r * (0.34 * legScale) + Math.abs(f.ox) * 3 * s * legScale,
  };
}

function reanchorFeetToBody(strength) {
  for (const f of feet) {
    const target = footBodyTarget(f);
    f.lift = -1;
    f.x = lerp(f.x, target.x, strength);
    f.y = lerp(f.y, target.y, strength);
    f.fromX = f.x; f.fromY = f.y;
    f.toX = f.x; f.toY = f.y;
  }
}

function updateHeldFeet(dt) {
  const s = depthScale();
  for (let i = 0; i < feet.length; i++) {
    const f = feet[i];
    const target = footBodyTarget(f);
    const pair = i % 2;
    const phase = pet.wobblePhase * 5 + pair * Math.PI;
    const side = i < 2 ? -1 : 1;
    const tuckX = side * 2.4 * s;
    const kickX = tuckX + Math.sin(phase) * (3.3 + Math.abs(f.ox) * 4.2) * s;
    const kickY = Math.cos(phase * 1.15) * 5.2 * s + pair * 1.5 * s;
    f.lift = -1;
    f.x = lerp(f.x, target.x + kickX, 1 - Math.exp(-18 * dt));
    f.y = lerp(f.y, target.y + kickY, 1 - Math.exp(-18 * dt));
    f.fromX = f.x; f.fromY = f.y;
    f.toX = f.x; f.toY = f.y;
  }
}

function updateFeet(dt) {
  if (currentStage() === 'egg') {
    reanchorFeetToBody(1);
    return;
  }
  const s = depthScale(), r = stagedRadius(), legScale = stageScale('leg');
  const speed = Math.hypot(pet.vx, pet.vy);
  stepClock += dt;
  if (input.mode === 'drag') {
    updateHeldFeet(dt);
    return;
  }
  if (pet.jy < -5) {
    reanchorFeetToBody(1 - Math.exp(-18 * dt));
    return;
  }
  for (const f of feet) {
    const idealX = pet.x + f.ox * r;
    const idealY = pet.y + Math.abs(f.ox) * 4 * s * legScale;
    if (f.lift < 0) {
      const d = Math.hypot(idealX - f.x, idealY - f.y);
      const thresh = speed > 150 ? 10 : 16;
      const groupBusy = feet.some(o => o !== f && o.group === f.group && o.lift >= 0);
      if (d > thresh * s && !groupBusy) {
        f.lift = 0;
        f.fromX = f.x; f.fromY = f.y;
        // 진행 방향으로 조금 앞서 딛기
        f.toX = idealX + pet.vx * 0.12;
        f.toY = idealY + pet.vy * 0.12;
      }
    } else {
      f.lift += dt / (speed > 150 ? 0.09 : 0.14);
      if (f.lift >= 1) {
        f.lift = -1; f.x = f.toX; f.y = f.toY;
        // 발 디딜 때 몸이 살짝 출렁
        pet.squashVel -= 0.9;
      } else {
        f.x = lerp(f.fromX, f.toX, f.lift);
        f.y = lerp(f.fromY, f.toY, f.lift) - Math.sin(f.lift * Math.PI) * 9 * s;
      }
    }
    const anchor = footBodyTarget(f);
    if (dist(f.x, f.y, anchor.x, anchor.y) > r * 1.35) {
      f.lift = -1;
      f.x = anchor.x;
      f.y = anchor.y;
    }
  }
}

// ---------- 꼬리: 버렛 체인 물리 + 매끈한 테이퍼 렌더링 ----------
function makeChain(n, segLen) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push({ x: pet.x, y: pet.y - 40 - i * segLen, px: pet.x, py: pet.y - 40 - i * segLen });
  return { pts, segLen };
}
const tail = makeChain(4, genes.tailLen);

function updateChain(ch, ax, ay, dt, gravity, windX) {
  const p0 = ch.pts[0];
  p0.px = p0.x; p0.py = p0.y; p0.x = ax; p0.y = ay;
  for (let i = 1; i < ch.pts.length; i++) {
    const p = ch.pts[i];
    const nx = p.x + (p.x - p.px) * 0.86 + windX * dt * dt;
    const ny = p.y + (p.y - p.py) * 0.86 + gravity * dt * dt;
    p.px = p.x; p.py = p.y; p.x = nx; p.y = ny;
  }
  for (let k = 0; k < 3; k++) {
    for (let i = 1; i < ch.pts.length; i++) {
      const a = ch.pts[i - 1], b = ch.pts[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const diff = (d - ch.segLen * depthScale() * stageScale('tail')) / d;
      b.x -= dx * diff; b.y -= dy * diff;
    }
  }
}

// 체인을 원이 아니라 하나의 테이퍼진 살덩이로 그린다 (포도송이 금지)
function drawTail(ch, baseR) {
  const pts = ch.pts, n = pts.length, s = depthScale();
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const o = pts[Math.max(i - 1, 0)], q = pts[Math.min(i + 1, n - 1)];
    let dx = q.x - o.x, dy = q.y - o.y;
    const d = Math.hypot(dx, dy) || 1;
    const w = baseR * (1 - (i / n) * 0.75) * s;
    left.push({ x: p.x - dy / d * w, y: p.y + dx / d * w });
    right.push({ x: p.x + dy / d * w, y: p.y - dx / d * w });
  }
  const tip = pts[n - 1], prev = pts[n - 2];
  const ex = tip.x + (tip.x - prev.x) * 0.6, ey = tip.y + (tip.y - prev.y) * 0.6;
  ctx.beginPath();
  ctx.moveTo(right[0].x, right[0].y);
  for (let i = 0; i < n - 1; i++) {
    ctx.quadraticCurveTo(right[i].x, right[i].y, (right[i].x + right[i + 1].x) / 2, (right[i].y + right[i + 1].y) / 2);
  }
  ctx.quadraticCurveTo(ex, ey, (left[n - 1].x + left[n - 2].x) / 2, (left[n - 1].y + left[n - 2].y) / 2);
  for (let i = n - 2; i > 0; i--) {
    ctx.quadraticCurveTo(left[i].x, left[i].y, (left[i].x + left[i - 1].x) / 2, (left[i].y + left[i - 1].y) / 2);
  }
  ctx.lineTo(left[0].x, left[0].y);
  ctx.closePath();
  ctx.fillStyle = bodyColor(); ctx.fill();
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = outlineWidth(pet.r * depthScale()); ctx.stroke();
}

// ---------- 파티클 (하트, Zzz, 먼지) ----------
const particles = [];
function spawn(type, x, y) {
  particles.push({ type, x, y, vx: rand(-14, 14), vy: rand(-46, -26), life: type === 'spark' ? 1.05 : 1.4, t: 0 });
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.type === 'dust' ? 40 : -6) * dt;
    if (p.t > p.life) particles.splice(i, 1);
  }
}

// ---------- 행동 스케줄러: 가만히 있질 못함 ----------
const BEHAVIORS = {
  wander:  { w: 3.0, dur: [2.5, 5] },
  stare:   { w: 1.8, dur: [1.5, 3.5] },
  sniff:   { w: 2.0, dur: [2, 3.5] },
  plop:    { w: 1.4, dur: [2, 4] },
  zoomies: { w: 1.0, dur: [1.8, 3] },
  wiggle:  { w: 1.6, dur: [1, 2] },
  sleep:   { w: 0.6, dur: [6, 10] },
  belly:   { w: 0.28, dur: [3.5, 6] },
  eat:     { w: 0, dur: [60, 60] },
  fetch:   { w: 0, dur: [60, 60] },
  wheel:   { w: 0.85, dur: [4.5, 6.5] },
  butterfly: { w: 0, dur: [60, 60] },
  battle:  { w: 0, dur: [60, 60] },
  travel:  { w: 0, dur: [60, 60] },
};
const CAPTIONS = {
  wander: ['어슬렁어슬렁', '산책 중', '어디 가는진 모름'],
  stare: ['멍…', '아무것도 안 보는 중', '생각이 없다'],
  sniff: ['킁킁', '바닥에서 뭔가 발견', '킁킁킁…'],
  plop: ['철푸덕', '움직이기 싫음', '녹는 중'],
  zoomies: ['갑자기 신남!!', '우다다다!!'],
  wiggle: ['꼬물꼬물', '춤(본인 생각)'],
  sleep: ['Zzz…', '꿈나라'],
  belly: ['배 보임', '누워 있음'],
  eat: ['밥이다!!', '우걱우걱'],
  fetch: ['공이다!!', '잡으러 감'],
  wheel: ['달려봄', '쳇바퀴 봄'],
  butterfly: ['잡으러 감', '저거 움직임'],
  battle: ['진지해짐', '나가봄'],
  travel: ['나감', '어디 가는 중'],
};
const PICKUP_LINES = ['어? 나?', '들렸어…', '왜 공중이야', '잠깐만', '발이 없어짐'];
const CARRY_LINES = ['어디가…', '나 이동중…', '발 안 닿아…', '공중 산책', '주인 손이다'];
const DROP_LINES = ['어어… 내려간다', '착지 준비…', '후웅', '나 내려놔짐', '바닥 온다'];
const LAND_LINES = ['착지…', '콩', '살았다', '땅이다', '다리 있음'];
const BOUNCE_LINES = ['통!', '퐁!', '앗 통통', '말랑반사', '벽이 있었네'];
const PETTING_LINES = ['좋아…', '거기 좋아', '손이다 손', '나 지금 행복함', '더 해줘'];
const BOND_LINES = ['옆에 있을래', '너 냄새 안다', '나 너 좋아', '같이 있자'];
function randomLine(lines) { return lines[Math.floor(Math.random() * lines.length)]; }
function setBehavior(name) {
  if (currentStage() === 'egg' && name !== 'stare') name = 'stare';
  pet.behavior = name;
  const b = BEHAVIORS[name];
  pet.behaviorT = rand(b.dur[0], b.dur[1]);
  const caps = typeof careBehaviorCaptions === 'function' ? careBehaviorCaptions(name, CAPTIONS[name]) : CAPTIONS[name];
  pet.caption = caps[Math.floor(Math.random() * caps.length)];
  pet.captionT = 0;
  if (name === 'wander' || name === 'zoomies') pickTarget();
  if (name === 'plop') pet.squashVel -= 3.5;
  if (typeof setFurnitureBehaviorTarget === 'function') setFurnitureBehaviorTarget(name);
  if (typeof careBehaviorStarted === 'function') careBehaviorStarted(name);
}
function pickTarget() {
  pet.target.x = rand(90, W - 90);
  pet.target.y = rand(H * 0.42, H * 0.82);
}
function nextBehavior() {
  if (currentStage() === 'egg') return setBehavior('stare');
  if (typeof isTraveling === 'function' && isTraveling()) return;
  if (food && needs.hunger < 0.98) return setBehavior('eat');
  if (typeof tryResumeFetch === 'function' && tryResumeFetch()) return;
  if (needs.energy < 0.16) return setBehavior('sleep');
  const entries = Object.entries(BEHAVIORS).filter(([n]) => n !== pet.behavior && n !== 'eat' && n !== 'fetch' && n !== 'butterfly' && n !== 'battle' && n !== 'travel');
  let total = entries.reduce((s, [n, b]) => s + behaviorWeight(n, b), 0);
  let roll = Math.random() * total;
  for (const [name, b] of entries) { roll -= behaviorWeight(name, b); if (roll <= 0) return setBehavior(name); }
  setBehavior('stare');
}

window.__petDebug = {
  snapshot() {
    const r = stagedRadius();
    const anchors = feet.map(f => footBodyTarget(f));
    return {
      viewport: { width: W, height: H },
      pet: {
        x: pet.x, y: pet.y, jy: pet.jy,
        vx: pet.vx, vy: pet.vy, jvy: pet.jvy,
        squash: pet.squash,
        behavior: pet.behavior,
        caption: pet.caption,
        landingT: pet.landingT,
        needs: { ...needs },
        mood: careMood(),
        dayPeriod: typeof dayPeriod === 'function' ? dayPeriod() : 'day',
        stage: currentStage(),
        stagePreview: stagePreview(),
        stageAge: stageAgeSeconds(),
        traits: typeof careTraitNames === 'function' ? careTraitNames() : [],
        careStats: { ...careStats },
        togetherDays: typeof togetherDays === 'function' ? togetherDays() : 1,
        genes: { ...genes },
        bondMilestone,
        food: food ? { ...food } : null,
        battle: typeof battle === 'undefined' || !battle ? null : { ...battle },
        ball: typeof ball === 'undefined' || !ball ? null : { ...ball },
        butterfly: typeof butterfly === 'undefined' ? null : { ...butterfly },
        walkVisit: typeof walkVisit === 'undefined' ? null : { ...walkVisit },
        furnitureState: typeof furnitureState === 'undefined' ? null : { ...furnitureState },
        place: typeof currentPlace === 'function' ? currentPlace() : 'home',
        travel: typeof travelState === 'function' ? travelState() : null,
      },
      visualTop: pet.y + pet.jy - r,
      topBounceLimit: topBounceLimit(),
      input: { active: input.active, mode: input.mode },
      feet: feet.map((f, i) => ({
        x: f.x,
        y: f.y,
        anchorX: anchors[i].x,
        anchorY: anchors[i].y,
        distance: dist(f.x, f.y, anchors[i].x, anchors[i].y),
      })),
      maxFootDistance: Math.max(...feet.map((f, i) => dist(f.x, f.y, anchors[i].x, anchors[i].y))),
      radius: r,
    };
  },
};
