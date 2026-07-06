// ---------- 욕구 ----------
const needs = { hunger: 0.85, energy: 0.9, bond: 0.08 }; // bond는 쓰다듬기로 쌓이는 친밀도
const careStats = {
  mealsFed: 0,
  lastMealAt: 0,
  napsTaken: 0,
  lastNapAt: 0,
  petStrokes: 0,
  lastPetAt: 0,
  lastCareLine: '아직 세상 구경 전',
  lastCareAt: 0,
  favoriteMeals: 0,
  routineBits: 0,
  routineCount: 0,
  lastRoutineAt: 0,
  traitMask: 0,
  fetchCount: 0,
  lastPlayAt: 0,
  stage: 'egg',
  stageChangedAt: Date.now(),
  hatchWarmth: 0,
  battleWins: 0,
  lastBattleAt: 0,
  grime: 0,
  memoryLog: [{ text: '아직 세상 구경 전', at: 0 }],
  pebbles: 0,
  lastWalkPebbleDay: -1,
  furnitureOwned: [],
  furniturePlaced: {},
  stats: { tough: 0, quick: 0, power: 0 },
};
careStats.furniturePlaced = migrateFurniturePlaced(null);
let food = null;                             // {x, y} 밥그릇
let ball = null;
let battle = null;
let place = 'home';
let travel = null;
const SAVE_KEY = 'protopet-care-v1';
const CARE_ACTION_BITS = { meal: 1, rest: 2, pet: 4 };
const ROUGHNESS_THROW_GAIN = 0.34;
const ROUGHNESS_SURPRISE_GAIN = 0.18;
const ROUGHNESS_DECAY_PER_SECOND = 0.06;
const ROUGHNESS_PENALTY_THRESHOLD = 0.5;
const ROUGHNESS_CLOSE_BOND = 0.55;
const ROUGHNESS_BOND_PENALTY = -0.012;
const ROUGHNESS_CLOSE_BOND_PENALTY = -0.006;
const ROUGH_HURT_LINES = ['…', '어지러워', '무서웠어', '잠깐 내려놔 줘', '나 공 아님'];
const ROUGH_FUN_LINES = ['한 번 더!!', '재밌다!!', '날았다!!'];
const FETCH_START_LINES = ['공이다!!', '잡으러 감'];
const FETCH_CAUGHT_LINES = ['잡았다', '입에 넣음'];
const FETCH_DONE_LINES = ['가져왔다', '나 잘했지'];
const FETCH_REFUSE_LINES = ['지금은 패스…', '공은 내일'];
const FETCH_SKILL_LINES = ['이제 좀 익숙함'];
const EGG_LINES = ['콩', '아직 안 나감', '안에서 듣는 중'];
const HATCH_WARM_LINES = ['따뜻함 저장 중', '안쪽이 포근함'];
const BATTLE_START_LINES = ['나가봄', '앞에 뭐 있음', '진지해짐'];
const BATTLE_WIN_LINES = ['이겼나 봄', '나 좀 했음', '앞에 없어짐'];
const BATTLE_LOSE_LINES = ['좀 누울래', '오늘은 여기까지', '다리 쉬는 중'];
const BATTLE_CHEER_LINES = ['들었음', '힘 조금 남', '나 해봄'];
const BATTLE_IGNORE_LINES = ['못 들은 척함', '내 맘대로 함'];
const TRAVEL_BATTLE_LINES = ['싸움터 감', '밖에 일 있음', '진지하게 나감'];
const TRAVEL_WALK_LINES = ['밖에 감', '냄새 맡으러 감', '발 바쁨'];
const WALK_ARRIVE_LINES = ['바깥 냄새 남', '풀 냄새 발견', '여기 넓다'];
const RETURN_HOME_LINES = ['집이다', '돌아옴', '바닥 익숙함'];
const WALK_DISCOVERY_LINES = ['풀 냄새 좋은 데 찾음', '냄새 좋은 바닥 찾음'];
const WALK_DISCOVERY_CAPTIONS = ['여기 냄새 좋음', '킁킁 성공'];
const SHINY_PEBBLE_CAPTIONS = ['반짝이는 거 주움', '반짝 하나 물고 옴'];
const ROUTINE_PEBBLE_CAPTIONS = ['어디서 반짝 물어옴', '반짝 놓고 감'];
const WHEEL_FALL_CAPTIONS = ['바퀴가 이김'];
const WHEEL_RUN_CAPTIONS = ['다리 빠름', '바퀴 안에 있음'];
const CUSHION_SLEEP_CAPTIONS = ['푹신한 데 있음', '여기 잠 잘 옴'];
const BUTTERFLY_START_LINES = ['저거 움직임', '잡으러 감'];
const BUTTERFLY_MISS_LINES = ['놓쳤다'];
const BUTTERFLY_NOSE_LINES = ['코에 뭐 있음'];
const AI_LINE_COOLDOWN = 12000;
let sessionFetchRecorded = false;
let nextAiLineAt = 0;
const STAT_KEYS = ['tough', 'quick', 'power'];
const STAT_LABELS = { tough: '튼튼', quick: '빠름', power: '힘' };
const STAT_OBSERVATIONS = {
  tough: ['아직 평범함', '산책 뒤 덜 헉헉거림', '요즘 오래 버팀'],
  quick: ['아직 평범함', '요즘 눈에 띄게 빨라짐', '발이 먼저 나감'],
  power: ['아직 평범함', '부딪히면 제법 묵직함', '힘 쓰는 법 조금 앎'],
};
const STAT_HINTS = {
  tough: '산책과 싸움 뒤에 느는 듯',
  quick: '공놀이랑 쳇바퀴로 느는 듯',
  power: '싸움에서 버티면 느는 듯',
};
const furnitureState = {
  wheelRunT: 0,
  wheelSpin: 0,
  wheelRewarded: false,
  wheelCheered: false,
};
const CARE_TRAITS = {
  cuddly: { bit: 1, line: '손길 없으면 허전해짐', caption: '손 찾는 중' },
  foodie: { bit: 2, line: '나 밥 좋아하는 거 들킴', caption: '밥 냄새 기억함' },
  mellow: { bit: 4, line: '서두르는 법을 까먹음', caption: '천천히 할래' },
};
const BOND_MILESTONES = [
  { at: 0.25, line: '조금 친해졌어' },
  { at: 0.55, line: '이제 나 알아보지?' },
  { at: 0.85, line: '완전 믿고 있어' },
];
const roughPlayState = {
  roughness: 0,
  penaltyCount: 0,
  flightMemoryRecorded: false,
};
let bondMilestone = 0;
const walkVisit = {
  active: false,
  discoveries: 0,
  maxDiscoveries: 0,
  nextDiscoveryAt: 0,
  targetSpot: 0,
  sniffing: false,
  sniffT: 0,
};
const butterfly = {
  active: false,
  t: 0,
  cooldown: 7,
  x: 0,
  y: 0,
  chaseT: 0,
  noseT: 0,
};

function bondStage(value) {
  let stage = 0;
  for (let i = 0; i < BOND_MILESTONES.length; i++) if (value >= BOND_MILESTONES[i].at) stage = i + 1;
  return stage;
}

function updateBondMilestone() {
  const next = bondStage(needs.bond);
  if (next <= bondMilestone) return;
  bondMilestone = next;
  const milestone = BOND_MILESTONES[next - 1];
  pet.caption = milestone.line;
  pet.captionT = 0;
  rememberCare(milestone.line);
  pet.happy = Math.max(pet.happy, 0.75);
  for (let i = 0; i < 5; i++) spawn('heart', pet.x + rand(-26, 26), pet.y - pet.r * depthScale() * rand(1.0, 1.8));
}

function saveCareState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      hunger: needs.hunger,
      energy: needs.energy,
      bond: needs.bond,
      mealsFed: careStats.mealsFed,
      lastMealAt: careStats.lastMealAt,
      napsTaken: careStats.napsTaken,
      lastNapAt: careStats.lastNapAt,
      petStrokes: careStats.petStrokes,
      lastPetAt: careStats.lastPetAt,
      lastCareLine: careStats.lastCareLine,
      lastCareAt: careStats.lastCareAt,
      favoriteMeals: careStats.favoriteMeals,
      routineBits: careStats.routineBits,
      routineCount: careStats.routineCount,
      lastRoutineAt: careStats.lastRoutineAt,
      traitMask: careStats.traitMask,
      fetchCount: careStats.fetchCount,
      lastPlayAt: careStats.lastPlayAt,
      stage: careStats.stage,
      stageChangedAt: careStats.stageChangedAt,
      hatchWarmth: careStats.hatchWarmth,
      battleWins: careStats.battleWins,
      lastBattleAt: careStats.lastBattleAt,
	      grime: careStats.grime,
	      memoryLog: careStats.memoryLog,
	      pebbles: careStats.pebbles,
	      lastWalkPebbleDay: careStats.lastWalkPebbleDay,
	      furnitureOwned: careStats.furnitureOwned,
	      furniturePlaced: careStats.furniturePlaced,
	      stats: careStats.stats,
	      bondMilestone,
      ts: Date.now(),
    }));
  } catch (_) {}
}

function loadCareState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!saved) return;
    const away = clamp((Date.now() - saved.ts) / 1000, 0, 12 * 3600);
    const savedHunger = Number(saved.hunger);
    const savedEnergy = Number(saved.energy);
    const savedBond = Number(saved.bond);
    const savedBondMilestone = Number(saved.bondMilestone);
    const savedMealsFed = Number(saved.mealsFed);
    const savedLastMealAt = Number(saved.lastMealAt);
    const savedNapsTaken = Number(saved.napsTaken);
    const savedLastNapAt = Number(saved.lastNapAt);
    const savedPetStrokes = Number(saved.petStrokes);
    const savedLastPetAt = Number(saved.lastPetAt);
    const savedLastCareAt = Number(saved.lastCareAt);
    const savedFavoriteMeals = Number(saved.favoriteMeals);
    const savedRoutineBits = Number(saved.routineBits);
    const savedRoutineCount = Number(saved.routineCount);
    const savedLastRoutineAt = Number(saved.lastRoutineAt);
    const savedTraitMask = Number(saved.traitMask);
    const savedFetchCount = Number(saved.fetchCount);
    const savedLastPlayAt = Number(saved.lastPlayAt);
    const savedStageChangedAt = Number(saved.stageChangedAt);
    const savedHatchWarmth = Number(saved.hatchWarmth);
    const savedBattleWins = Number(saved.battleWins);
	    const savedLastBattleAt = Number(saved.lastBattleAt);
	    const savedGrime = Number(saved.grime);
	    const savedPebbles = Number(saved.pebbles);
	    const savedLastWalkPebbleDay = Number(saved.lastWalkPebbleDay);
	    needs.hunger = clamp((Number.isFinite(savedHunger) ? savedHunger : needs.hunger) - away * 0.00012, 0, 1);
    needs.energy = clamp((Number.isFinite(savedEnergy) ? savedEnergy : needs.energy) + away * 0.0002, 0, 1);
    needs.bond = clamp(Number.isFinite(savedBond) ? savedBond : needs.bond, 0, 1);
    careStats.mealsFed = Math.max(0, Math.floor(Number.isFinite(savedMealsFed) ? savedMealsFed : careStats.mealsFed));
    careStats.lastMealAt = Math.max(0, Number.isFinite(savedLastMealAt) ? savedLastMealAt : careStats.lastMealAt);
    careStats.napsTaken = Math.max(0, Math.floor(Number.isFinite(savedNapsTaken) ? savedNapsTaken : careStats.napsTaken));
    careStats.lastNapAt = Math.max(0, Number.isFinite(savedLastNapAt) ? savedLastNapAt : careStats.lastNapAt);
    careStats.petStrokes = Math.max(0, Number.isFinite(savedPetStrokes) ? savedPetStrokes : careStats.petStrokes);
    careStats.lastPetAt = Math.max(0, Number.isFinite(savedLastPetAt) ? savedLastPetAt : careStats.lastPetAt);
    const memoryFallbackAt = Math.max(0, Number.isFinite(savedLastCareAt) ? savedLastCareAt : 0);
    careStats.lastCareAt = Math.max(0, Number.isFinite(savedLastCareAt) ? savedLastCareAt : careStats.lastCareAt);
    careStats.lastCareLine = typeof saved.lastCareLine === 'string' ? saved.lastCareLine : careStats.lastCareLine;
    careStats.memoryLog = migrateMemoryLog(saved.memoryLog, careStats.lastCareLine, memoryFallbackAt);
    careStats.favoriteMeals = Math.max(0, Math.floor(Number.isFinite(savedFavoriteMeals) ? savedFavoriteMeals : careStats.favoriteMeals));
    careStats.routineBits = Math.floor(clamp(Number.isFinite(savedRoutineBits) ? savedRoutineBits : careStats.routineBits, 0, 7));
    careStats.routineCount = Math.max(0, Math.floor(Number.isFinite(savedRoutineCount) ? savedRoutineCount : careStats.routineCount));
    careStats.lastRoutineAt = Math.max(0, Number.isFinite(savedLastRoutineAt) ? savedLastRoutineAt : careStats.lastRoutineAt);
    careStats.traitMask = Math.floor(clamp(Number.isFinite(savedTraitMask) ? savedTraitMask : careStats.traitMask, 0, 7));
    careStats.fetchCount = Math.max(0, Math.floor(Number.isFinite(savedFetchCount) ? savedFetchCount : careStats.fetchCount));
    careStats.lastPlayAt = Math.max(0, Number.isFinite(savedLastPlayAt) ? savedLastPlayAt : careStats.lastPlayAt);
    careStats.stage = migrateStage(saved.stage, saved);
    careStats.stageChangedAt = Math.max(0, Number.isFinite(savedStageChangedAt) ? savedStageChangedAt : Date.now());
    careStats.hatchWarmth = clamp(Number.isFinite(savedHatchWarmth) ? savedHatchWarmth : (careStats.stage === 'egg' ? 0 : 1), 0, 1);
    careStats.battleWins = Math.max(0, Math.floor(Number.isFinite(savedBattleWins) ? savedBattleWins : careStats.battleWins));
	    careStats.lastBattleAt = Math.max(0, Number.isFinite(savedLastBattleAt) ? savedLastBattleAt : careStats.lastBattleAt);
	    careStats.grime = clamp((Number.isFinite(savedGrime) ? savedGrime : careStats.grime) + (away > 3 * 3600 ? away * 0.000012 : 0), 0, 1);
	    careStats.pebbles = Math.max(0, Math.floor(Number.isFinite(savedPebbles) ? savedPebbles : 0));
	    careStats.lastWalkPebbleDay = Math.floor(Number.isFinite(savedLastWalkPebbleDay) ? savedLastWalkPebbleDay : -1);
	    careStats.furnitureOwned = migrateFurnitureOwned(saved.furnitureOwned);
	    careStats.furniturePlaced = migrateFurniturePlaced(saved.furniturePlaced);
	    careStats.stats = migrateStats(saved.stats, careStats.fetchCount);
	    bondMilestone = Math.floor(clamp(Number.isFinite(savedBondMilestone) ? savedBondMilestone : bondStage(needs.bond), 0, BOND_MILESTONES.length));
    if (away > 60) {
      pet.caption = careStats.grime > 0.55 ? '먼지 좀 붙음' : '기다렸어…';
      pet.captionT = 0;
    }
  } catch (_) {}
}
loadCareState();
setInterval(saveCareState, 5000);
window.addEventListener('pagehide', saveCareState);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveCareState(); });

function affectNeed(name, delta) {
  needs[name] = clamp(needs[name] + delta, 0, 1);
  if (name === 'bond') updateBondMilestone();
}
function adultConditionCount() {
  let count = 0;
  if (careStats.mealsFed >= 6) count += 1;
  if (careStats.napsTaken >= 3) count += 1;
  if (careStats.petStrokes >= 150) count += 1;
  return count;
}
function migrateStage(savedStage, saved) {
  if (validStage(savedStage)) return savedStage;
  const hasHistory = Number(saved.mealsFed) > 0 || Number(saved.napsTaken) > 0 || Number(saved.petStrokes) > 0 || Number(saved.fetchCount) > 0;
  if (!hasHistory) return 'egg';
  return adultConditionCount() >= 2 ? 'adult' : 'baby';
}
function migrateMemoryLog(savedLog, currentLine, fallbackAt) {
  const fallbackTime = Number.isFinite(fallbackAt) ? Math.max(0, fallbackAt) : 0;
  if (!Array.isArray(savedLog)) return currentLine ? [{ text: currentLine, at: fallbackTime }] : [];
  return savedLog
    .map(entry => {
      if (typeof entry === 'string') return { text: entry, at: fallbackTime };
      if (!entry || typeof entry !== 'object' || typeof entry.text !== 'string') return null;
      const at = Number(entry.at);
      return { text: entry.text, at: Math.max(0, Number.isFinite(at) ? at : 0) };
    })
    .filter(entry => entry && entry.text.trim())
    .slice(-30);
}
function migrateFurnitureOwned(savedOwned) {
  if (!Array.isArray(savedOwned)) return [];
  return savedOwned.filter(id => furnitureItemById(id)).filter((id, index, owned) => owned.indexOf(id) === index);
}
function migrateFurniturePlaced(savedPlaced) {
  const placed = {};
  for (const item of FURNITURE_ITEMS) {
    const saved = savedPlaced && typeof savedPlaced === 'object' ? savedPlaced[item.id] : null;
    placed[item.id] = normalizeFurnitureRatio(item.id, saved);
  }
  return placed;
}
function normalizeFurnitureRatio(id, value) {
  const fallback = defaultFurnitureRatio(id);
  if (!value || typeof value !== 'object') return fallback;
  const xr = Number(value.xr);
  const yr = Number(value.yr);
  return {
    xr: clamp(Number.isFinite(xr) ? xr : fallback.xr, 0, 1),
    yr: clamp(Number.isFinite(yr) ? yr : fallback.yr, 0, 1),
  };
}
function migrateStats(savedStats, fetchCount) {
  const stats = { tough: 0, quick: clamp((fetchCount / 8) * 5, 0, 5), power: 0 };
  if (!savedStats || typeof savedStats !== 'object') return stats;
  for (const key of STAT_KEYS) {
    const value = Number(savedStats[key]);
    stats[key] = clamp(Number.isFinite(value) ? value : stats[key], 0, 5);
  }
  return stats;
}
function isEggStage() { return currentStage() === 'egg'; }
function isBabyStage() { return currentStage() === 'baby'; }
function canPlayBallNow() { return currentStage() === 'adult'; }
function currentPlace() { return place; }
function isTraveling() { return Boolean(travel); }
function travelState() { return travel ? { ...travel } : null; }
function awayFromHome() { return place !== 'home'; }
function dayStamp(time) {
  const date = new Date(time);
  return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000);
}
function addStat(name, amount) {
  if (!STAT_KEYS.includes(name)) return;
  careStats.stats[name] = clamp(careStats.stats[name] + amount, 0, 5);
}
function addBattleStats(amount) {
  addStat('tough', amount);
  addStat('power', amount);
}
function hasFurniture(id) {
  return careStats.furnitureOwned.includes(id);
}
function ensureFurniturePlacement(id) {
  if (!furnitureItemById(id)) return;
  careStats.furniturePlaced[id] = normalizeFurnitureRatio(id, careStats.furniturePlaced[id]);
}
function setFurniturePlacement(id, x, y) {
  if (!hasFurniture(id)) return false;
  const point = constrainedFurniturePoint(id, x, y);
  careStats.furniturePlaced[id] = furnitureRatioFromPoint(id, point.x, point.y);
  return true;
}
function finishFurniturePlacement(id, x, y) {
  if (!setFurniturePlacement(id, x, y)) return false;
  const anchor = furnitureAnchor(id);
  furnitureMotion.heldId = '';
  furnitureMotion.settleId = id;
  furnitureMotion.settleT = furnitureMotion.settleDur;
  pet.squashVel = clamp(pet.squashVel - 0.6, -8, 8);
  for (let i = 0; i < 5; i++) spawn('dust', anchor.x + rand(-18, 18), anchor.y + rand(-5, 7));
  saveCareState();
  return true;
}
function furnitureUsePoint(id) {
  const anchor = furnitureAnchor(id);
  if (id === 'window') return { x: clamp(anchor.x - 42, 90, W - 90), y: H * 0.48 };
  if (id === 'wheel') {
    const wheelR = furniturePrimarySize('wheel', anchor.y);
    return {
      x: anchor.x,
      y: clamp(anchor.y - wheelR * 0.55 + stagedRadius() * 0.92, H * 0.4, H * 0.83),
    };
  }
  return anchor;
}
function buyFurniture(id) {
  const item = furnitureItemById(id);
  if (!item || hasFurniture(id) || careStats.pebbles < item.price) return false;
  careStats.pebbles -= item.price;
  careStats.furnitureOwned.push(id);
  ensureFurniturePlacement(id);
  pet.caption = `${item.name} 여기 둠`;
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.5);
  saveCareState();
  return true;
}
function resetWheelState() {
  furnitureState.wheelRunT = 0;
  furnitureState.wheelRewarded = false;
  furnitureState.wheelCheered = false;
}
function setFurnitureBehaviorTarget(name) {
  furnitureState.moveTargetId = '';
  if (place !== 'home' || travel || battle) return;
  if (name === 'sleep' && hasFurniture('cushion')) {
    furnitureState.moveTargetId = 'cushion';
    const target = furnitureUsePoint('cushion');
    pet.target.x = target.x;
    pet.target.y = target.y;
    pet.caption = randomLine(CUSHION_SLEEP_CAPTIONS);
    return;
  }
  if (name === 'sniff' && hasFurniture('plant') && Math.random() < 0.65) {
    furnitureState.moveTargetId = 'plant';
    const target = furnitureUsePoint('plant');
    pet.target.x = target.x;
    pet.target.y = target.y;
    return;
  }
  if (name === 'stare' && hasFurniture('window') && Math.random() < 0.45) {
    furnitureState.moveTargetId = 'window';
    const target = furnitureUsePoint('window');
    pet.target.x = target.x;
    pet.target.y = target.y;
    pet.dir = furnitureAnchor('window').x > pet.x ? 1 : -1;
  }
  if (name === 'wheel' && hasFurniture('wheel')) {
    resetWheelState();
    furnitureState.moveTargetId = 'wheel';
    const target = furnitureUsePoint('wheel');
    pet.target.x = target.x;
    pet.target.y = target.y;
  }
}
function furnitureMoveTarget() {
  if (!furnitureState.moveTargetId || place !== 'home' || travel || battle || input.mode === 'drag' || input.mode === 'furniture-drag') return null;
  if (pet.behavior === 'sleep' && furnitureState.moveTargetId === 'cushion') return furnitureUsePoint('cushion');
  if (pet.behavior === 'stare' && furnitureState.moveTargetId === 'window') return furnitureUsePoint('window');
  if (pet.behavior === 'wheel' && furnitureState.moveTargetId === 'wheel') return furnitureUsePoint('wheel');
  if (pet.behavior === 'sniff' && furnitureState.moveTargetId === 'plant') return furnitureUsePoint('plant');
  return null;
}
function isUsingCushion() {
  return pet.behavior === 'sleep' && hasFurniture('cushion') && dist(pet.x, pet.y, furnitureUsePoint('cushion').x, furnitureUsePoint('cushion').y) < 42;
}
function recordWheelSession(fell) {
  if (furnitureState.wheelRewarded || furnitureState.wheelRunT < 2) return;
  furnitureState.wheelRewarded = true;
  addStat('quick', furnitureState.wheelCheered ? 0.1 : 0.08);
  affectNeed('energy', furnitureState.wheelCheered ? -0.06 : -0.05);
  pet.caption = fell ? randomLine(WHEEL_FALL_CAPTIONS) : randomLine(WHEEL_RUN_CAPTIONS);
  pet.captionT = 0;
  if (!fell) pet.happy = Math.max(pet.happy, 0.55);
}
function cheerWheelAt(x, y) {
  if (place !== 'home' || pet.behavior !== 'wheel' || !hasFurniture('wheel')) return false;
  const anchor = furnitureAnchor('wheel');
  const s = depthScaleAt(anchor.y);
  if (dist(x, y, anchor.x, anchor.y - 28 * s) > 54 * s) return false;
  furnitureState.wheelCheered = true;
  pet.happy = Math.max(pet.happy, 0.8);
  affectNeed('bond', 0.006);
  for (let i = 0; i < 3; i++) spawn('heart', anchor.x + rand(-18, 18), anchor.y - 52 * s + rand(-8, 8));
  pet.caption = '보고 있음';
  pet.captionT = 0;
  return true;
}
function updateFurnitureUse(dt) {
  if (pet.behavior !== 'wheel') {
    recordWheelSession(false);
    furnitureState.wheelRunT = 0;
    return;
  }
  if (place !== 'home' || !hasFurniture('wheel') || needs.energy < 0.18) {
    pet.behavior = 'stare';
    pet.behaviorT = 1.5;
    pet.caption = '다리 쉬는 중';
    pet.captionT = 0;
    return;
  }
  const target = furnitureUsePoint('wheel');
  if (dist(pet.x, pet.y, target.x, target.y) > 26) return;
  furnitureState.wheelRunT += dt;
  furnitureState.wheelSpin += dt * (7.2 + furnitureState.wheelRunT * 0.55);
  pet.walkPhase += dt * 28;
  pet.squashVel = clamp(pet.squashVel + Math.sin(pet.wobblePhase * 8) * 0.08, -10, 10);
  affectNeed('energy', -dt * 0.006);
  if (!furnitureState.wheelRewarded && furnitureState.wheelRunT > 2.6 && Math.random() < dt * 0.08) {
    recordWheelSession(true);
    pet.tripT = 0.95;
    pet.squashVel = clamp(pet.squashVel - 5.5, -12, 12);
    pet.behavior = 'stare';
    pet.behaviorT = 2;
    for (let i = 0; i < 6; i++) spawn('dust', pet.x + rand(-22, 22), pet.y + rand(-6, 8));
  } else if (pet.behaviorT < 0.25) {
    recordWheelSession(false);
  }
}
function grantPebbles(count, captions) {
  careStats.pebbles = Math.max(0, careStats.pebbles + count);
  pet.caption = randomLine(captions);
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.62);
  for (let i = 0; i < Math.min(6, count + 2); i++) spawn('spark', pet.x + rand(-22, 22), pet.y - pet.r * depthScale() * rand(0.7, 1.45));
  saveCareState();
  return count;
}
function clearPlaceObjects() {
  food = null;
  ball = null;
}
function beginWalkVisit() {
  walkVisit.active = true;
  walkVisit.discoveries = 0;
  walkVisit.maxDiscoveries = Math.random() < 0.55 ? 1 : 2;
  walkVisit.nextDiscoveryAt = rand(3.5, 7.5);
  walkVisit.targetSpot = Math.random() < 0.5 ? 0 : 1;
  walkVisit.sniffing = false;
  walkVisit.sniffT = 0;
  butterfly.active = false;
  butterfly.noseT = 0;
  butterfly.chaseT = 0;
  butterfly.cooldown = rand(4.5, 8.5);
}
function endWalkVisit() {
  walkVisit.active = false;
  walkVisit.sniffing = false;
  butterfly.active = false;
  butterfly.noseT = 0;
  butterfly.chaseT = 0;
}
function travelArrivalPoint(to) {
  if (to === 'battle') return { x: W * 0.46, y: H * 0.66 };
  if (to === 'walk') return { x: W * 0.52, y: H * 0.65 };
  return { x: W * 0.5, y: H * 0.62 };
}
function startTravel(to, options = {}) {
  if (travel) {
    pet.caption = '이미 가는 중';
    pet.captionT = 0;
    return false;
  }
  if (isEggStage()) {
    nudgeEgg('아직 세상 구경 전');
    return false;
  }
  if (input.mode === 'drag') {
    pet.caption = '손에서 못 감';
    pet.captionT = 0;
    return false;
  }
  if (battle && to !== 'home') {
    pet.caption = '지금 싸우는 중';
    pet.captionT = 0;
    return false;
  }
  const exitSide = pet.x < W / 2 ? -1 : 1;
  const targetY = clamp(pet.y + rand(-24, 24), H * 0.5, H * 0.78);
  if (to !== 'walk') endWalkVisit();
	  travel = {
	    to,
	    from: place,
	    phase: 'leaving',
    exitSide,
    y: targetY,
    t: 0,
    startBattle: Boolean(options.startBattle),
  };
  clearPlaceObjects();
  pet.behavior = 'travel';
  pet.behaviorT = 60;
  pet.target.x = exitSide < 0 ? -70 : W + 70;
  pet.target.y = targetY;
  pet.caption = to === 'battle' ? randomLine(TRAVEL_BATTLE_LINES) : to === 'walk' ? randomLine(TRAVEL_WALK_LINES) : '집에 감';
  pet.captionT = 0;
  return true;
}
function travelTarget() {
  if (!travel) return null;
  if (travel.phase === 'leaving') {
    return { x: travel.exitSide < 0 ? -70 : W + 70, y: travel.y };
  }
  return travelArrivalPoint(travel.to);
}
function completeTravelStep() {
  if (!travel) return;
  if (travel.phase === 'leaving') {
    place = travel.to;
    travel.phase = 'arriving';
    travel.t = 0;
    const entrySide = -travel.exitSide;
    pet.x = entrySide < 0 ? -70 : W + 70;
    const arrival = travelArrivalPoint(travel.to);
    pet.y = arrival.y;
    pet.vx = 0;
    pet.vy = 0;
    pet.target.x = arrival.x;
    pet.target.y = arrival.y;
    pet.caption = travel.to === 'battle' ? '여기 싸움터' : travel.to === 'walk' ? '여기 바깥' : '집 보임';
    pet.captionT = 0;
    return;
  }
	  const destination = travel.to;
	  const origin = travel.from;
	  const shouldStartBattle = travel.startBattle;
	  travel = null;
  if (destination === 'walk') {
    beginWalkVisit();
    rememberCare('밖 냄새 맡은 날');
    affectNeed('energy', -0.025);
    affectNeed('bond', 0.012);
    careStats.grime = clamp(careStats.grime + 0.018, 0, 1);
    pet.caption = randomLine(WALK_ARRIVE_LINES);
    pet.captionT = 0;
    pet.happy = Math.max(pet.happy, 0.58);
    for (let i = 0; i < 3; i++) spawn('dust', pet.x + rand(-24, 24), pet.y + rand(-8, 8));
    pet.behavior = 'sniff';
    pet.behaviorT = rand(BEHAVIORS.sniff.dur[0], BEHAVIORS.sniff.dur[1]);
  } else if (destination === 'battle' && shouldStartBattle) {
    startBattleHere();
	  } else {
	    if (destination === 'home' && origin === 'walk') addStat('tough', 0.04);
	    pet.caption = randomLine(RETURN_HOME_LINES);
    pet.captionT = 0;
    pet.behavior = 'stare';
    pet.behaviorT = rand(BEHAVIORS.stare.dur[0], BEHAVIORS.stare.dur[1]);
  }
}
function updateTravel(dt) {
  if (!travel) return;
  travel.t += dt;
  if (travel.t > 5) completeTravelStep();
}
function fetchSkillLevel() {
  return clamp(careStats.stats.quick / 5, 0, 1);
}
function fetchChaseSpeed(baseSpeed) {
  return baseSpeed * (1 + fetchSkillLevel() * 0.32);
}
function fetchTripMultiplier() {
  return 1 - fetchSkillLevel() * 0.55;
}
function battleFocusChance() {
  return clamp(0.35 + needs.bond * 0.42 + careStats.stats.quick * 0.035 + (hasCareTrait('mellow') ? 0.04 : 0), 0.2, 0.92);
}
function battlePower() {
  const foodBoost = hasCareTrait('foodie') && needs.hunger > 0.5 ? 0.08 : 0;
  return 0.86 + fetchSkillLevel() * 0.2 + careStats.stats.power * 0.025 + needs.energy * 0.18 + needs.bond * 0.18 + foodBoost;
}
function grantWalkDiscoveryShinyPebble() {
  const today = dayStamp(Date.now());
  const firstToday = careStats.lastWalkPebbleDay !== today;
  const count = firstToday ? 2 + ((today + genes.seed) % 2) : 1;
  careStats.lastWalkPebbleDay = today;
  return grantPebbles(count, SHINY_PEBBLE_CAPTIONS);
}
function walkSniffSpot() {
  const spots = placeWorld.walk.sniffSpots;
  return spots[walkVisit.targetSpot % spots.length];
}
function completeWalkDiscovery() {
  walkVisit.discoveries += 1;
  walkVisit.sniffing = false;
  walkVisit.sniffT = 0;
  walkVisit.targetSpot += 1;
  walkVisit.nextDiscoveryAt = rand(8, 15);
	  rememberCare(randomLine(WALK_DISCOVERY_LINES));
	  pet.caption = randomLine(WALK_DISCOVERY_CAPTIONS);
	  pet.captionT = 0;
	  pet.happy = Math.max(pet.happy, 0.55);
	  pet.behaviorT = Math.max(pet.behaviorT, 1.4);
	  for (let i = 0; i < 3; i++) spawn('dust', pet.x + rand(-14, 14), pet.y + rand(-4, 8));
	  grantWalkDiscoveryShinyPebble();
}
function updateWalkDiscovery(dt) {
  if (!walkVisit.active || walkVisit.discoveries >= walkVisit.maxDiscoveries) return;
  if (input.mode === 'drag' || battle || travel || food || ball || pet.behavior === 'sleep' || pet.behavior === 'butterfly') return;
  walkVisit.nextDiscoveryAt -= dt;
  if (!walkVisit.sniffing && walkVisit.nextDiscoveryAt <= 0) {
    const spot = walkSniffSpot();
    walkVisit.sniffing = true;
    walkVisit.sniffT = 0;
    pet.target.x = spot.x * W;
    pet.target.y = spot.y * H;
    setBehavior('sniff');
    pet.caption = '킁킁';
    pet.captionT = 0;
  }
  if (!walkVisit.sniffing) return;
  walkVisit.sniffT += dt;
  const spot = walkSniffSpot();
  const sx = spot.x * W;
  const sy = spot.y * H;
  pet.target.x = sx;
  pet.target.y = sy;
  if (dist(pet.x, pet.y, sx, sy) < 34 || walkVisit.sniffT > 5.2) completeWalkDiscovery();
}
function updateButterflyPosition() {
  const spec = placeWorld.walk.butterfly;
  const phase = spec.phase + butterfly.t * 1.55;
  const loopX = Math.sin(phase) * spec.rx * W;
  const loopY = Math.sin(phase * 2) * spec.ry * H;
  butterfly.x = spec.x * W + loopX;
  butterfly.y = spec.y * H + loopY;
  if (pet.behavior !== 'butterfly') return;
  const dx = butterfly.x - pet.x;
  const dy = butterfly.y - pet.y;
  const d = Math.hypot(dx, dy) || 1;
  const evade = 24 + butterfly.chaseT * 18;
  butterfly.x = clamp(butterfly.x + dx / d * evade, 36, W - 36);
  butterfly.y = clamp(butterfly.y + dy / d * evade - butterfly.chaseT * 5, H * 0.34, H * 0.72);
}
function startButterflyChase() {
  butterfly.chaseT = 0;
  setBehavior('butterfly');
  pet.caption = randomLine(BUTTERFLY_START_LINES);
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.62);
}
function missButterfly(onNose) {
  if (!butterfly.active) return;
  butterfly.chaseT = 0;
  if (onNose) {
    butterfly.noseT = 1.35;
    pet.caption = randomLine(BUTTERFLY_NOSE_LINES);
    pet.squashVel = clamp(pet.squashVel - 1.2, -8, 8);
  } else {
    butterfly.active = false;
    butterfly.cooldown = rand(10, 18);
    pet.caption = randomLine(BUTTERFLY_MISS_LINES);
  }
  pet.captionT = 0;
  pet.behavior = 'stare';
  pet.behaviorT = Math.max(pet.behaviorT, 1.6);
}
function updateButterfly(dt) {
  if (!walkVisit.active) return;
  if (butterfly.noseT > 0) {
    butterfly.noseT = Math.max(0, butterfly.noseT - dt);
    butterfly.x = pet.x + pet.dir * stagedRadius() * 0.42;
    butterfly.y = pet.y + pet.jy - stagedRadius() * 0.8;
    if (butterfly.noseT <= 0) {
      butterfly.active = false;
      butterfly.cooldown = rand(12, 20);
    }
    return;
  }
  if (!butterfly.active) {
    butterfly.cooldown -= dt;
    if (butterfly.cooldown <= 0 && !food && !ball && !battle && !travel && input.mode !== 'drag') {
      butterfly.active = true;
      butterfly.t = 0;
      butterfly.chaseT = 0;
      updateButterflyPosition();
    }
    return;
  }
  butterfly.t += dt;
  updateButterflyPosition();
  const d = dist(pet.x, pet.y, butterfly.x, butterfly.y);
  if (pet.behavior === 'butterfly') {
    butterfly.chaseT += dt;
    if (d < 32 || butterfly.chaseT > 4.2) missButterfly(Math.random() < 0.22);
    return;
  }
  if (input.mode !== 'drag' && pet.behavior !== 'sleep' && d < 150 && pet.captionT > 0.7) startButterflyChase();
}
function updateWalkPlace(dt) {
  if (place !== 'walk' || travel || isEggStage()) {
    if (walkVisit.active && place !== 'walk') endWalkVisit();
    return;
  }
  updateButterfly(dt);
  updateWalkDiscovery(dt);
}
function requestAiLine(event, fallback) {
  if (typeof fetch !== 'function') return;
  if (Date.now() < nextAiLineAt) return;
  nextAiLineAt = Date.now() + AI_LINE_COOLDOWN;
  fetch('/api/pet-line', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      event,
      mood: careMood(),
      stage: currentStage(),
      needs: { hunger: needs.hunger, energy: needs.energy, bond: needs.bond },
      traits: careTraitNames(),
      memory: careStats.lastCareLine,
    }),
  })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (!data || typeof data.line !== 'string') return;
      const line = data.line.trim();
      if (!line || pet.captionT < 0.8) return;
      pet.caption = line;
      pet.captionT = 0;
      if (fallback) rememberCare(line);
    })
    .catch(() => {});
}
function nudgeEgg(line) {
  pet.eggShakeT = Math.max(pet.eggShakeT, 0.7);
  pet.squashVel = clamp(pet.squashVel - 1.2, -8, 8);
  pet.caption = line || randomLine(EGG_LINES);
  pet.captionT = 0;
}
function warmEgg(amount) {
  if (!isEggStage() || isStagePreview()) return;
  careStats.hatchWarmth = clamp(careStats.hatchWarmth + amount * 0.0012, 0, 1);
  pet.eggShakeT = Math.max(pet.eggShakeT, 0.36);
  if (careStats.hatchWarmth > 0.32 && pet.captionT > 1.2) {
    pet.caption = randomLine(HATCH_WARM_LINES);
    pet.captionT = 0;
  }
}
function transitionStage(stage) {
  if (!validStage(stage) || isStagePreview()) return false;
  const from = careStats.stage;
  if (from === stage) return false;
  careStats.stage = stage;
  careStats.stageChangedAt = Date.now();
  careStats.hatchWarmth = stage === 'egg' ? 0 : 1;
  pet.stageTween = from !== 'egg' && stage !== 'egg' ? { from, to: stage, t: 0, dur: 1.5 } : null;
  return true;
}
function tryHatchEgg() {
  if (!isEggStage() || isStagePreview()) return false;
  if (careStats.hatchWarmth < 1 || stageAgeSeconds() < eggHatchSeconds()) return false;
  if (!transitionStage('baby')) return false;
  rememberCare('알에서 나온 날');
  pet.caption = '…누구세요';
  pet.captionT = 0;
  pet.hatchFxT = 1.2;
  pet.happy = Math.max(pet.happy, 0.72);
  pet.jy = 0;
  pet.jvy = 0;
  for (let i = 0; i < 6; i++) spawn('dust', pet.x + rand(-20, 20), pet.y + rand(-10, 8));
  for (let i = 0; i < 3; i++) spawn('heart', pet.x + rand(-22, 22), pet.y - pet.r * depthScale() * rand(0.9, 1.5));
  return true;
}
function canGrowAdult() {
  return isBabyStage() && !isStagePreview() && stageAgeSeconds() >= adultGrowthSeconds() && adultConditionCount() >= 2;
}
function tryGrowAdultOnSleep() {
  if (!canGrowAdult() || !transitionStage('adult')) return false;
  rememberCare('어른이 된 날');
  pet.caption = '나 좀 큰 듯';
  pet.captionT = 0;
  pet.happy = 1;
  for (let i = 0; i < 5; i++) spawn('heart', pet.x + rand(-24, 24), pet.y - pet.r * depthScale() * rand(1.0, 1.7));
  for (let i = 0; i < 5; i++) spawn('dust', pet.x + rand(-26, 26), pet.y + rand(-6, 8));
  return true;
}
function recordRoughPlay(amount) {
  roughPlayState.roughness = clamp(roughPlayState.roughness + amount, 0, 1);
  if (roughPlayState.roughness <= ROUGHNESS_PENALTY_THRESHOLD) return false;

  const closeEnough = needs.bond >= ROUGHNESS_CLOSE_BOND;
  affectNeed('bond', closeEnough ? ROUGHNESS_CLOSE_BOND_PENALTY : ROUGHNESS_BOND_PENALTY);
  roughPlayState.penaltyCount += 1;
  if (roughPlayState.penaltyCount >= 3 && !roughPlayState.flightMemoryRecorded) {
    roughPlayState.flightMemoryRecorded = true;
    rememberCare('오늘 너무 많이 날아다님');
  }
  pet.caption = closeEnough && Math.random() < 0.5 ? randomLine(ROUGH_FUN_LINES) : randomLine(ROUGH_HURT_LINES);
  pet.captionT = 0;
  return true;
}
function pickBallTarget() {
  let target = { x: W / 2, y: H * 0.64 };
  for (let i = 0; i < 18; i++) {
    target = { x: rand(90, W - 90), y: rand(H * 0.45, H * 0.82) };
    if (dist(target.x, target.y, pet.x, pet.y) >= 120) break;
  }
  return target;
}
function launchBall() {
  const start = ownerPlayPoint(0.9);
  const target = pickBallTarget();
  const flightT = rand(0.82, 1.04);
  ball = {
    x: start.x,
    y: start.y,
    vx: (target.x - start.x) / flightT,
    vy: (target.y - start.y) / flightT,
    jy: 0,
    jvy: -450 * flightT,
    bounces: 0,
    maxBounces: Math.random() < 0.5 ? 2 : 3,
    rebound: 0.55,
    age: 0,
    phase: 'flying',
    fetchState: 'waiting',
    fetchStarted: false,
    fetchSpeed: 220,
    fadeT: 0,
  };
}
function requestPlayBall() {
  if (awayFromHome() || travel) {
    pet.caption = awayFromHome() ? '집에 공 있음' : '가는 중이라 안 됨';
    pet.captionT = 0;
    return;
  }
  if (battle) {
    pet.caption = '지금 바쁨';
    pet.captionT = 0;
    return;
  }
  if (!canPlayBallNow()) {
    if (isEggStage()) nudgeEgg('아직 세상 구경 전');
    else {
      pet.caption = '아직 공 몰라';
      pet.captionT = 0;
      pet.squashVel = clamp(pet.squashVel - 1.4, -8, 8);
    }
    return;
  }
  if (ball) {
    pet.caption = '공 여기 있어';
    pet.captionT = 0;
    return;
  }
  launchBall();
  pet.caption = randomLine(FETCH_START_LINES);
  pet.captionT = 0;
}
function startFetchBall() {
  if (!canPlayBallNow()) return false;
  if (!ball || food || ball.abandoned || ball.fetchState === 'return') return false;
  if (needs.energy < 0.25) {
    ball.declined = true;
    pet.caption = randomLine(FETCH_REFUSE_LINES);
    pet.captionT = 0;
    return false;
  }
  ball.fetchStarted = true;
  ball.fetchState = ball.phase === 'carried' ? 'return' : 'chase';
  ball.fetchSpeed = hasCareTrait('mellow') && Math.random() < 0.2 ? 62 : fetchChaseSpeed(220);
  setBehavior('fetch');
  if (ball.fetchSpeed === 62) pet.caption = '천천히 가지러 감';
  pet.captionT = 0;
  return true;
}
function tryResumeFetch() {
  if (!ball || food || ball.declined || ball.abandoned) return false;
  if (ball.phase !== 'settled' && ball.phase !== 'rolling' && ball.phase !== 'carried') return false;
  if (needs.energy < 0.25) return false;
  return startFetchBall();
}
function catchBall() {
  if (!ball) return;
  ball.phase = 'carried';
  ball.fetchState = 'return';
  ball.vx = 0;
  ball.vy = 0;
  ball.jy = 0;
  ball.jvy = 0;
  pet.caption = randomLine(FETCH_CAUGHT_LINES);
  pet.captionT = 0;
}
function abandonFetchBall() {
  if (!ball) return;
  ball.phase = 'settled';
  ball.fetchState = 'waiting';
  ball.abandoned = true;
  ball.vx = 0;
  ball.vy = 0;
  ball.jy = 0;
  ball.jvy = 0;
  pet.caption = '그만 뛸래…';
  pet.captionT = 0;
  pet.behavior = 'stare';
  pet.behaviorT = Math.max(pet.behaviorT, 1.6);
}
function dropFetchedBall() {
  if (!ball) return;
  ball.phase = 'fading';
  ball.fetchState = 'done';
  ball.fadeT = 1.5;
  ball.pendingComplete = true;
  ball.vx = 0;
  ball.vy = 0;
  ball.jy = 0;
  ball.jvy = 0;
}
function clearBallIfTimedOut() {
  if (!ball || ball.phase === 'carried' || ball.phase === 'fading') return false;
  if (ball.age < 25) return false;
  if (!ball.fetchStarted) {
    pet.caption = '공 까먹음';
    pet.captionT = 0;
  }
  ball = null;
  return true;
}
function recordFetchComplete() {
  const firstFetch = careStats.fetchCount === 0;
  careStats.fetchCount += 1;
	  careStats.lastPlayAt = Date.now();
	  addStat('quick', 0.05);
  affectNeed('bond', 0.02);
  affectNeed('energy', -0.03);
  if (firstFetch) rememberCare('공 물어오기 배움');
  else if (!sessionFetchRecorded) rememberCare('공 가져다줌');
  sessionFetchRecorded = true;
  const learnedFetch = careStats.fetchCount >= 3 && Math.random() < clamp(careStats.fetchCount * 0.04, 0.18, 0.42);
  pet.caption = learnedFetch ? randomLine(FETCH_SKILL_LINES) : randomLine(FETCH_DONE_LINES);
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.8);
  for (let i = 0; i < 3; i++) spawn('heart', pet.x + rand(-22, 22), pet.y - pet.r * depthScale() * rand(1.0, 1.65));
  requestAiLine('fetch_done', false);
}
function requestBattle() {
  if (battle) {
    cheerBattle();
    return;
  }
  if (travel) {
    pet.caption = '가는 중이라 안 됨';
    pet.captionT = 0;
    return;
  }
  if (isEggStage()) {
    nudgeEgg('아직 세상 구경 전');
    return;
  }
  if (!canPlayBallNow()) {
    pet.caption = '아직 싸움 몰라';
    pet.captionT = 0;
    return;
  }
  if (food) {
    pet.caption = '밥 먼저 봄';
    pet.captionT = 0;
    setBehavior('eat');
    return;
  }
  if (needs.energy < 0.28) {
    pet.caption = '오늘은 누울래';
    pet.captionT = 0;
    affectNeed('bond', 0.004);
    return;
  }
  if (place !== 'battle') {
    startTravel('battle', { startBattle: true });
    return;
  }
  startBattleHere();
}
function startBattleHere() {
  const foeX = pet.x < W / 2 ? W * 0.72 : W * 0.28;
  battle = {
    x: clamp(foeX, 90, W - 90),
    y: clamp(pet.y + rand(-50, 45), H * 0.48, H * 0.78),
    hp: 1,
    petHp: clamp(0.62 + needs.energy * 0.36 + needs.bond * 0.18, 0.45, 1),
    t: 0,
    hitT: 0,
    foeHitT: 0,
    cheerT: 0,
    nextAct: 0.4,
    phase: 'active',
  };
  if (ball) ball = null;
  pet.behavior = 'battle';
  pet.behaviorT = 60;
  pet.caption = randomLine(BATTLE_START_LINES);
  pet.captionT = 0;
  rememberCare('처음 싸움 구경한 날');
  requestAiLine('battle_start', false);
}
function requestWalk() {
  if (isEggStage()) {
    nudgeEgg('아직 세상 구경 전');
    return;
  }
  if (travel) {
    pet.caption = '이미 가는 중';
    pet.captionT = 0;
    return;
  }
  if (battle) {
    pet.caption = '끝나고 갈래';
    pet.captionT = 0;
    return;
  }
  if (place !== 'home') {
    startTravel('home');
    return;
  }
  if (food) {
    pet.caption = '밥 먼저 봄';
    pet.captionT = 0;
    setBehavior('eat');
    return;
  }
  startTravel('walk');
}
function cheerBattle() {
  if (!battle || battle.phase !== 'active') return;
  if (battle.cheerT > 0.2) {
    pet.caption = '방금 들음';
    pet.captionT = 0;
    return;
  }
  battle.cheerT = 2.4;
  if (Math.random() < battleFocusChance()) {
    battle.hp = clamp(battle.hp - 0.08 - needs.bond * 0.06, 0, 1);
    pet.happy = Math.max(pet.happy, 0.7);
    pet.caption = randomLine(BATTLE_CHEER_LINES);
    spawn('heart', pet.x + rand(-18, 18), pet.y - pet.r * depthScale() * rand(1.0, 1.5));
    affectNeed('bond', 0.006);
  } else {
    pet.caption = randomLine(BATTLE_IGNORE_LINES);
    affectNeed('bond', 0.002);
  }
  pet.captionT = 0;
}
function finishBattle(won) {
  if (!battle) return;
  const battleY = battle.y;
  battle = null;
  pet.behavior = 'stare';
  pet.behaviorT = 2.4;
  careStats.lastBattleAt = Date.now();
  affectNeed('energy', won ? -0.08 : -0.14);
	  if (won) {
	    careStats.battleWins += 1;
	    addBattleStats(0.06);
	    affectNeed('bond', 0.028);
	    rememberCare(careStats.battleWins === 1 ? '처음 이겨본 날' : '싸움에서 돌아온 날');
	    pet.caption = randomLine(BATTLE_WIN_LINES);
	    pet.happy = Math.max(pet.happy, 0.85);
	    for (let i = 0; i < 5; i++) spawn('heart', pet.x + rand(-24, 24), pet.y - pet.r * depthScale() * rand(1.0, 1.7));
	    grantPebbles(4, SHINY_PEBBLE_CAPTIONS);
	  } else {
	    addBattleStats(0.03);
	    rememberCare('싸우고 푹 쉬는 날');
	    pet.caption = randomLine(BATTLE_LOSE_LINES);
	    pet.squashVel = clamp(pet.squashVel - 4, -10, 10);
	    for (let i = 0; i < 6; i++) spawn('dust', pet.x + rand(-26, 26), battleY + rand(-6, 8));
	    grantPebbles(1, ['지긴 했는데 이거 주움']);
	  }
  pet.captionT = 0;
  requestAiLine(won ? 'battle_win' : 'battle_tired', false);
}
function updateBattle(dt) {
  if (!battle) return;
  if (battle.phase !== 'active') return;
  battle.t += dt;
  battle.hitT = Math.max(0, battle.hitT - dt);
  battle.foeHitT = Math.max(0, battle.foeHitT - dt);
  battle.cheerT = Math.max(0, battle.cheerT - dt);
  const dx = battle.x - pet.x, dy = battle.y - pet.y, d = Math.hypot(dx, dy) || 1;
  pet.target.x = battle.x - Math.sign(dx || pet.dir) * 46;
  pet.target.y = battle.y + 8;
  if (d > 72) {
    pet.vx = lerp(pet.vx, dx / d * 105 * stageScale('speed'), 1 - Math.exp(-8 * dt));
    pet.vy = lerp(pet.vy, dy / d * 82 * stageScale('speed'), 1 - Math.exp(-8 * dt));
    return;
  }
  battle.nextAct -= dt;
  pet.vx = lerp(pet.vx, Math.sin(battle.t * 8) * 24, 1 - Math.exp(-9 * dt));
  pet.vy = lerp(pet.vy, Math.cos(battle.t * 5) * 12, 1 - Math.exp(-9 * dt));
  if (battle.nextAct > 0) return;
  battle.nextAct = rand(0.48, 0.82);
  const focused = Math.random() < battleFocusChance();
  if (focused) {
    battle.hp = clamp(battle.hp - 0.08 * battlePower(), 0, 1);
    battle.hitT = 0.22;
    pet.squashVel = clamp(pet.squashVel - 1.6, -9, 9);
    spawn('dust', battle.x + rand(-14, 14), battle.y + rand(-6, 6));
  } else {
    battle.petHp = clamp(battle.petHp - 0.045, 0, 1);
    battle.foeHitT = 0.22;
    pet.squashVel = clamp(pet.squashVel - 2.4, -10, 10);
    if (pet.captionT > 1.1) {
      pet.caption = '헛발질함';
      pet.captionT = 0;
    }
  }
  if (battle.hp <= 0) finishBattle(true);
  else if (battle.petHp <= 0 || battle.t > 18) finishBattle(false);
}
function careMood() {
  if (isEggStage()) return 'egg';
  if (needs.hunger < 0.24) return 'hungry';
  if (needs.energy < 0.18) return 'tired';
  if (needs.bond < 0.16 && careStats.petStrokes < 24) return 'shy';
  if (needs.bond > 0.65 && needs.hunger > 0.48 && needs.energy > 0.35) return 'content';
  return 'neutral';
}
function rememberCare(line) {
  careStats.lastCareLine = line;
  const now = Date.now();
  careStats.lastCareAt = now;
  careStats.memoryLog.push({ text: line, at: now });
  if (careStats.memoryLog.length > 30) careStats.memoryLog.splice(0, careStats.memoryLog.length - 30);
}
function hasCareTrait(name) {
  return Boolean(careStats.traitMask & CARE_TRAITS[name].bit);
}
function careTraitNames() {
  return Object.entries(CARE_TRAITS).filter(([, trait]) => careStats.traitMask & trait.bit).map(([name]) => name);
}
function careBehaviorCaptions(name, caps) {
  if (hasCareTrait('cuddly') && name === 'stare') return caps.concat(['가까이 있을래', '손 기다림']);
  if (hasCareTrait('cuddly') && name === 'wiggle') return caps.concat(['쓰다듬 대기중', '꼬물꼬물 다가감']);
  if (hasCareTrait('foodie') && name === 'sniff') return caps.concat(['밥 냄새 탐색', '혹시 간식?']);
  if (hasCareTrait('mellow') && name === 'plop') return caps.concat(['천천히 녹는 중', '느긋하게 철푸덕']);
  if (hasCareTrait('mellow') && name === 'sleep') return caps.concat(['좋은 낮잠 자리', '느긋한 꿈']);
  return caps;
}
function revealCareTrait(name) {
  const trait = CARE_TRAITS[name];
  if (careStats.traitMask & trait.bit) return false;
  careStats.traitMask |= trait.bit;
  rememberCare(trait.line);
  pet.caption = trait.caption;
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.72);
  for (let i = 0; i < 4; i++) spawn('heart', pet.x + rand(-24, 24), pet.y - pet.r * depthScale() * rand(1.0, 1.7));
  return true;
}
function updateCareTraits() {
  if (needs.bond >= 0.28 && careStats.petStrokes >= 72 && revealCareTrait('cuddly')) return true;
  if ((careStats.mealsFed >= 3 || careStats.favoriteMeals >= 2) && revealCareTrait('foodie')) return true;
  if (careStats.napsTaken >= 2 && revealCareTrait('mellow')) return true;
  return false;
}
function noteCareAction(kind) {
  const bit = CARE_ACTION_BITS[kind] || 0;
  if (!bit) return false;
  careStats.routineBits |= bit;
  if (careStats.routineBits !== 7) return false;
  careStats.routineBits = 0;
  careStats.routineCount += 1;
	  careStats.lastRoutineAt = Date.now();
	  affectNeed('bond', 0.045);
	  rememberCare(careStats.routineCount > 1 ? '오늘도 풀코스로 챙겨받음' : '밥, 잠, 쓰담 다 받은 날');
	  pet.caption = careStats.routineCount > 1 ? '또 챙겨줬다' : '나 챙겨줬네';
  pet.captionT = 0;
	  pet.happy = 1;
	  for (let i = 0; i < 6; i++) spawn('heart', pet.x + rand(-26, 26), pet.y - pet.r * depthScale() * rand(1.0, 1.8));
	  grantPebbles(1, ROUTINE_PEBBLE_CAPTIONS);
	  return true;
}
function isFavoriteFood(foodType) {
  return foodType.id === genes.favoriteFoodId;
}
function recordMeal(foodType) {
  careStats.mealsFed += 1;
  careStats.lastMealAt = Date.now();
  if (isFavoriteFood(foodType)) {
    careStats.favoriteMeals += 1;
    rememberCare(`${foodObjectLabel(foodType)} 제일 좋아함`);
    const routineCompleted = noteCareAction('meal');
    updateCareTraits();
    return routineCompleted;
  }
  rememberCare(`${foodObjectLabel(foodType)} 먹어봄`);
  const routineCompleted = noteCareAction('meal');
  updateCareTraits();
  return routineCompleted;
}
function rejectFoodWhenFull() {
  pet.caption = needs.hunger > 0.96 ? '배 빵빵해' : '조금 이따 먹을래';
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.35);
  pet.squashVel = clamp(pet.squashVel - 2.2, -10, 10);
  affectNeed('bond', 0.004);
}
function mealCaption(foodType) {
  if (needs.hunger < 0.25) return '밥이다!! 살았다';
  if (isFavoriteFood(foodType)) return '이 냄새 좋아';
  if (needs.hunger < 0.55) return '냠냠 해야지';
  if (careStats.mealsFed > 0) return '또 밥 냄새';
  return '처음 밥이다';
}
function requestRest() {
  if (awayFromHome() || travel) {
    pet.caption = awayFromHome() ? '집 가서 누울래' : '가는 중이라 안 됨';
    pet.captionT = 0;
    return;
  }
  if (battle) {
    pet.caption = '끝나고 누울래';
    pet.captionT = 0;
    return;
  }
  if (isEggStage()) {
    nudgeEgg('잠은 안에서 자는 중');
    return;
  }
  if (food && needs.hunger < 0.7) {
    pet.caption = '밥 먹고 잘래';
    pet.captionT = 0;
    if (input.mode !== 'drag') setBehavior('eat');
    return;
  }
  if (needs.energy > 0.88) {
    pet.caption = '아직 안 졸려';
    pet.captionT = 0;
    pet.happy = Math.max(pet.happy, 0.3);
    affectNeed('bond', 0.003);
    return;
  }
  careStats.napsTaken += 1;
  careStats.lastNapAt = Date.now();
  rememberCare(needs.energy < 0.28 ? '낮잠으로 기운 충전 중' : '잠깐 눈 붙이는 중');
  const routineCompleted = noteCareAction('rest');
  const traitRevealed = updateCareTraits();
  setBehavior('sleep');
  pet.behaviorT = Math.max(pet.behaviorT, clamp((1 - needs.energy) * 18, 7, 15));
  if (!routineCompleted && !traitRevealed) pet.caption = needs.energy < 0.28 ? '충전할게…' : '눈 좀 붙일게…';
  pet.captionT = 0;
  pet.zTimer = 0.2;
  pet.squashVel = clamp(pet.squashVel - 1.5, -8, 8);
  tryGrowAdultOnSleep();
}
function recordPetting(amount) {
  if (isEggStage()) {
    warmEgg(amount);
    return;
  }
  const now = Date.now();
  careStats.grime = clamp(careStats.grime - amount * 0.00022, 0, 1);
  careStats.petStrokes += amount;
  if (now - careStats.lastPetAt > 1400) rememberCare(needs.bond > 0.45 ? '쓰다듬받고 골골거림' : '손길을 기억함');
  if (amount > 2.4) noteCareAction('pet');
  updateCareTraits();
  careStats.lastPetAt = now;
}
function updateCare(dt, { airborne, speed }) {
  updateTravel(dt);
  updateBattle(dt);
  if (pet.stageTween) {
    pet.stageTween.t += dt;
    if (pet.stageTween.t >= pet.stageTween.dur) pet.stageTween = null;
  }
  if (pet.hatchFxT > 0) pet.hatchFxT = Math.max(0, pet.hatchFxT - dt);
  if (pet.eggShakeT > 0) pet.eggShakeT = Math.max(0, pet.eggShakeT - dt);
	  if (isEggStage()) {
    if (tryHatchEgg()) return;
    if (!isStagePreview()) careStats.hatchWarmth = clamp(careStats.hatchWarmth - dt * 0.004, 0, 1);
    return;
	  }
	  updateWalkPlace(dt);
	  updateFurnitureUse(dt);
	  roughPlayState.roughness = Math.max(0, roughPlayState.roughness - dt * ROUGHNESS_DECAY_PER_SECOND);
	  affectNeed('hunger', -dt * (0.00042 + speed * 0.000003) * stageScale('hunger'));
	  affectNeed('energy', pet.behavior === 'sleep' ? dt * 0.045 * (isUsingCushion() ? 1.3 : 1) : -dt * (0.0014 + speed * 0.000012) * stageScale('energy'));
  if (!airborne && input.mode !== 'drag' && !food && pet.behavior !== 'sleep' && needs.energy < 0.1) {
    setBehavior('sleep');
    pet.caption = '스르륵…';
    pet.captionT = 0;
    tryGrowAdultOnSleep();
  }
  if (needs.hunger < 0.24 && pet.captionT > 4) {
    pet.caption = '밥 생각 중…';
    pet.captionT = 0;
  } else if (needs.energy < 0.16 && pet.captionT > 4) {
    pet.caption = '졸려…';
    pet.captionT = 0;
  } else if (needs.bond > 0.65 && pet.captionT > 6 && Math.random() < dt * 0.35) {
    pet.caption = randomLine(BOND_LINES);
    pet.captionT = 0;
  }
}
function behaviorWeight(name, base) {
  let w = base.w;
  if (name === 'sleep') w *= needs.energy < 0.3 ? 5 : needs.energy < 0.6 ? 2 : 1;
  if (name === 'plop') w *= needs.energy < 0.4 ? 2.2 : 1;
  if (name === 'zoomies' || name === 'wiggle') w *= needs.energy < 0.35 ? 0.15 : 1;
	  if (name === 'zoomies') w *= stageScale('zoomies');
	  if (name === 'sniff') w *= needs.hunger < 0.5 ? 2.2 : 1;
	  if (name === 'stare') w *= 1 + needs.bond * 1.8;
	  if (name === 'wheel') w *= place === 'home' && hasFurniture('wheel') && needs.energy > 0.42 && !food && !ball ? 1 : 0;
	  if (name === 'wiggle') w *= 1 + needs.bond * 1.2;
  if (hasCareTrait('cuddly') && (name === 'stare' || name === 'wiggle')) w *= 1.45;
  if (hasCareTrait('foodie') && name === 'sniff') w *= 1.55;
  if (hasCareTrait('mellow') && (name === 'plop' || name === 'sleep')) w *= 1.35;
  return w;
}
