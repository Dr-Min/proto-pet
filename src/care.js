// ---------- 욕구 ----------
const needs = { hunger: 0.85, energy: 0.9, bond: 0.08 }; // bond는 쓰다듬기로 쌓이는 친밀도
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
  pet.happy = Math.max(pet.happy, 0.75);
  for (let i = 0; i < 5; i++) spawn('heart', pet.x + rand(-26, 26), pet.y - pet.r * depthScale() * rand(1.0, 1.8));
}

function saveCareState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      hunger: needs.hunger,
      energy: needs.energy,
      bond: needs.bond,
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
    needs.hunger = clamp((Number.isFinite(savedHunger) ? savedHunger : needs.hunger) - away * 0.00012, 0, 1);
    needs.energy = clamp((Number.isFinite(savedEnergy) ? savedEnergy : needs.energy) + away * 0.0002, 0, 1);
    needs.bond = clamp(Number.isFinite(savedBond) ? savedBond : needs.bond, 0, 1);
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
