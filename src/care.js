// ---------- 욕구 ----------
const needs = { hunger: 0.85, energy: 0.9, bond: 0.08 }; // bond는 쓰다듬기로 쌓이는 친밀도
const careStats = {
  mealsFed: 0,
  lastMealAt: 0,
  napsTaken: 0,
  lastNapAt: 0,
  petStrokes: 0,
  lastPetAt: 0,
  lastCareLine: '오늘은 아직 조용해',
  lastCareAt: 0,
  favoriteMeals: 0,
  routineBits: 0,
  routineCount: 0,
  lastRoutineAt: 0,
  traitMask: 0,
};
let food = null;                             // {x, y} 밥그릇
const SAVE_KEY = 'protopet-care-v1';
const CARE_ACTION_BITS = { meal: 1, rest: 2, pet: 4 };
const CARE_TRAITS = {
  cuddly: { bit: 1, line: '애교가 늘었어', caption: '손 찾는 중' },
  foodie: { bit: 2, line: '먹보 기질이 보임', caption: '밥 냄새 기억함' },
  mellow: { bit: 4, line: '느긋해졌어', caption: '천천히 할래' },
};
const BOND_MILESTONES = [
  { at: 0.25, line: '조금 친해졌어' },
  { at: 0.55, line: '이제 나 알아보지?' },
  { at: 0.85, line: '완전 믿고 있어' },
];
let bondMilestone = 0;

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
    needs.hunger = clamp((Number.isFinite(savedHunger) ? savedHunger : needs.hunger) - away * 0.00012, 0, 1);
    needs.energy = clamp((Number.isFinite(savedEnergy) ? savedEnergy : needs.energy) + away * 0.0002, 0, 1);
    needs.bond = clamp(Number.isFinite(savedBond) ? savedBond : needs.bond, 0, 1);
    careStats.mealsFed = Math.max(0, Math.floor(Number.isFinite(savedMealsFed) ? savedMealsFed : careStats.mealsFed));
    careStats.lastMealAt = Math.max(0, Number.isFinite(savedLastMealAt) ? savedLastMealAt : careStats.lastMealAt);
    careStats.napsTaken = Math.max(0, Math.floor(Number.isFinite(savedNapsTaken) ? savedNapsTaken : careStats.napsTaken));
    careStats.lastNapAt = Math.max(0, Number.isFinite(savedLastNapAt) ? savedLastNapAt : careStats.lastNapAt);
    careStats.petStrokes = Math.max(0, Number.isFinite(savedPetStrokes) ? savedPetStrokes : careStats.petStrokes);
    careStats.lastPetAt = Math.max(0, Number.isFinite(savedLastPetAt) ? savedLastPetAt : careStats.lastPetAt);
    careStats.lastCareLine = typeof saved.lastCareLine === 'string' ? saved.lastCareLine : careStats.lastCareLine;
    careStats.lastCareAt = Math.max(0, Number.isFinite(savedLastCareAt) ? savedLastCareAt : careStats.lastCareAt);
    careStats.favoriteMeals = Math.max(0, Math.floor(Number.isFinite(savedFavoriteMeals) ? savedFavoriteMeals : careStats.favoriteMeals));
    careStats.routineBits = Math.floor(clamp(Number.isFinite(savedRoutineBits) ? savedRoutineBits : careStats.routineBits, 0, 7));
    careStats.routineCount = Math.max(0, Math.floor(Number.isFinite(savedRoutineCount) ? savedRoutineCount : careStats.routineCount));
    careStats.lastRoutineAt = Math.max(0, Number.isFinite(savedLastRoutineAt) ? savedLastRoutineAt : careStats.lastRoutineAt);
    careStats.traitMask = Math.floor(clamp(Number.isFinite(savedTraitMask) ? savedTraitMask : careStats.traitMask, 0, 7));
    bondMilestone = Math.floor(clamp(Number.isFinite(savedBondMilestone) ? savedBondMilestone : bondStage(needs.bond), 0, BOND_MILESTONES.length));
    if (away > 60) {
      pet.caption = '기다렸어…';
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
function careMood() {
  if (needs.hunger < 0.24) return 'hungry';
  if (needs.energy < 0.18) return 'tired';
  if (needs.bond < 0.16 && careStats.petStrokes < 24) return 'shy';
  if (needs.bond > 0.65 && needs.hunger > 0.48 && needs.energy > 0.35) return 'content';
  return 'neutral';
}
function rememberCare(line) {
  careStats.lastCareLine = line;
  careStats.lastCareAt = Date.now();
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
  rememberCare(careStats.routineCount > 1 ? '돌봄 한 바퀴를 또 기억함' : '돌봄 한 바퀴를 기억함');
  pet.caption = careStats.routineCount > 1 ? '또 챙겨줬다' : '나 챙겨줬네';
  pet.captionT = 0;
  pet.happy = 1;
  for (let i = 0; i < 6; i++) spawn('heart', pet.x + rand(-26, 26), pet.y - pet.r * depthScale() * rand(1.0, 1.8));
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
}
function recordPetting(amount) {
  const now = Date.now();
  careStats.petStrokes += amount;
  if (now - careStats.lastPetAt > 1400) rememberCare(needs.bond > 0.45 ? '쓰다듬받고 골골거림' : '손길을 기억함');
  if (amount > 2.4) noteCareAction('pet');
  updateCareTraits();
  careStats.lastPetAt = now;
}
function updateCare(dt, { airborne, speed }) {
  affectNeed('hunger', -dt * (0.00042 + speed * 0.000003));
  affectNeed('energy', pet.behavior === 'sleep' ? dt * 0.045 : -dt * (0.0014 + speed * 0.000012));
  if (!airborne && input.mode !== 'drag' && !food && pet.behavior !== 'sleep' && needs.energy < 0.1) {
    setBehavior('sleep');
    pet.caption = '스르륵…';
    pet.captionT = 0;
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
  if (name === 'sniff') w *= needs.hunger < 0.5 ? 2.2 : 1;
  if (name === 'stare') w *= 1 + needs.bond * 1.8;
  if (name === 'wiggle') w *= 1 + needs.bond * 1.2;
  if (hasCareTrait('cuddly') && (name === 'stare' || name === 'wiggle')) w *= 1.45;
  if (hasCareTrait('foodie') && name === 'sniff') w *= 1.55;
  if (hasCareTrait('mellow') && (name === 'plop' || name === 'sleep')) w *= 1.35;
  return w;
}
