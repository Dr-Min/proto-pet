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
};
let food = null;                             // {x, y} 밥그릇
const SAVE_KEY = 'protopet-care-v1';
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
function rememberCare(line) {
  careStats.lastCareLine = line;
  careStats.lastCareAt = Date.now();
}
function recordMeal() {
  careStats.mealsFed += 1;
  careStats.lastMealAt = Date.now();
  rememberCare(careStats.mealsFed % 3 === 0 ? '밥 먹고 기분 최고' : '밥그릇을 깨끗이 비움');
}
function rejectFoodWhenFull() {
  pet.caption = needs.hunger > 0.96 ? '배 빵빵해' : '조금 이따 먹을래';
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.35);
  pet.squashVel = clamp(pet.squashVel - 2.2, -10, 10);
  affectNeed('bond', 0.004);
}
function mealCaption() {
  if (needs.hunger < 0.25) return '밥이다!! 살았다';
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
  setBehavior('sleep');
  pet.behaviorT = Math.max(pet.behaviorT, clamp((1 - needs.energy) * 18, 7, 15));
  pet.caption = needs.energy < 0.28 ? '충전할게…' : '눈 좀 붙일게…';
  pet.captionT = 0;
  pet.zTimer = 0.2;
  pet.squashVel = clamp(pet.squashVel - 1.5, -8, 8);
}
function recordPetting(amount) {
  const now = Date.now();
  careStats.petStrokes += amount;
  if (now - careStats.lastPetAt > 1400) rememberCare(needs.bond > 0.45 ? '쓰다듬받고 골골거림' : '손길을 기억함');
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
  return w;
}
