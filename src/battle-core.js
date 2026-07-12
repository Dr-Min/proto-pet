'use strict';

const BATTLE_CORE_PERSONALITIES = {
  겁쟁이: { focus: 0.05, pressure: -0.08, counter: 0.18, tempo: 1.08 },
  저돌: { focus: -0.04, pressure: 0.2, counter: -0.06, tempo: 1.24 },
  침착: { focus: 0.14, pressure: 0.04, counter: 0.04, tempo: 0.92 },
};

function battleCoreClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function battleCoreRng(seed) {
  let a = seed | 0;
  return () => {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function battleCorePersonality(name) {
  return BATTLE_CORE_PERSONALITIES[name] || BATTLE_CORE_PERSONALITIES.침착;
}

function battleCoreStats(stats) {
  const source = stats && typeof stats === 'object' ? stats : {};
  return {
    tough: battleCoreClamp(Number(source.tough) || 0, 0, 5),
    quick: battleCoreClamp(Number(source.quick) || 0, 0, 5),
    power: battleCoreClamp(Number(source.power) || 0, 0, 5),
  };
}

function battleCoreCondition(condition) {
  const source = condition && typeof condition === 'object' ? condition : {};
  return {
    hunger: battleCoreClamp(Number(source.hunger) || 0, 0, 1),
    energy: battleCoreClamp(Number(source.energy) || 0, 0, 1),
    bond: battleCoreClamp(Number(source.bond) || 0, 0, 1),
  };
}

function battleCoreScore(side) {
  const stats = battleCoreStats(side && side.stats);
  const condition = battleCoreCondition(side && side.condition);
  const personality = battleCorePersonality(side && side.personality);
  const powerCoeff = Number(side && side.powerCoeff);
  const coeff = Number.isFinite(powerCoeff) ? powerCoeff : 0;
  const seed = Number(side && side.seed) || 0;
  const jitter = battleCoreRng(seed)() * 0.16 - 0.08;
  const traitBoost = Array.isArray(side && side.traits) && side.traits.includes('foodie') && condition.hunger > 0.5 ? 0.08 : 0;
  return 0.72
    + coeff
    + stats.tough * 0.18
    + stats.quick * 0.15
    + stats.power * 0.22
    + condition.energy * 0.35
    + condition.bond * 0.55
    + condition.hunger * 0.12
    + personality.focus
    + traitBoost
    + jitter;
}

function battleCoreFocusChance(side) {
  const stats = battleCoreStats(side && side.stats);
  const condition = battleCoreCondition(side && side.condition);
  const personality = battleCorePersonality(side && side.personality);
  const mellow = Array.isArray(side && side.traits) && side.traits.includes('mellow') ? 0.04 : 0;
  return battleCoreClamp(0.32 + condition.bond * 0.4 + stats.quick * 0.034 + personality.focus + mellow, 0.18, 0.94);
}

function battleCorePower(side) {
  const stats = battleCoreStats(side && side.stats);
  const condition = battleCoreCondition(side && side.condition);
  const personality = battleCorePersonality(side && side.personality);
  const foodBoost = Array.isArray(side && side.traits) && side.traits.includes('foodie') && condition.hunger > 0.5 ? 0.08 : 0;
  return 0.82 + stats.quick * 0.04 + stats.power * 0.055 + condition.energy * 0.18 + condition.bond * 0.18 + personality.pressure * 0.18 + foodBoost;
}

function applyBattleCheerCore(plan, input) {
  const sourcePlan = plan && typeof plan === 'object' ? plan : {};
  const signal = input && typeof input === 'object' ? input : {};
  const bond = battleCoreClamp(Number(signal.bond) || 0, 0, 1);
  const focus = battleCoreClamp(Number(signal.focus) || 0, 0, 1);
  const damage = battleCoreClamp(0.05 + focus * 0.05 + bond * 0.04, 0.05, 0.14);
  const swing = battleCoreClamp(0.03 + bond * 0.1 + focus * 0.04, 0.03, 0.16);
  const scoreDelta = Number(sourcePlan.scoreDelta);
  const cheerSwing = battleCoreClamp((Number(sourcePlan.cheerSwing) || 0) + swing, 0, 0.48);
  const influencedPlan = { ...sourcePlan, cheerSwing };
  const turnsBattle = sourcePlan.won !== true && Number.isFinite(scoreDelta) && scoreDelta + cheerSwing >= 0;
  if (!turnsBattle || !Array.isArray(sourcePlan.rounds)) return { damage, swing, plan: influencedPlan, turned: false };

  const rounds = sourcePlan.rounds.map(round => ({ ...round }));
  const decisiveIndex = rounds.findIndex(round => round.decisive);
  if (decisiveIndex < 0) return { damage, swing, plan: influencedPlan, turned: false };
  const previous = rounds[Math.max(0, decisiveIndex - 1)] || { petHp: 1, foeHp: 1 };
  rounds[decisiveIndex] = {
    ...rounds[decisiveIndex],
    actor: 'pet',
    damage: battleCoreClamp(Number(previous.foeHp) || 0, 0, 1),
    petHp: battleCoreClamp(Math.max(Number(previous.petHp) || 0, 0.05), 0, 1),
    foeHp: 0,
    decisive: true,
  };
  return { damage, swing, plan: { ...influencedPlan, won: true, rounds }, turned: true };
}

function resolveBattleCore(input) {
  const battleInput = input && typeof input === 'object' ? input : {};
  const pet = battleInput.pet || {};
  const foe = battleInput.foe || {};
  const petScore = battleCoreScore(pet);
  const foeScore = battleCoreScore(foe);
  const seed = (Number(battleInput.seed) || 0) ^ (Number(pet.seed) || 0) ^ ((Number(foe.seed) || 0) << 1);
  const rng = battleCoreRng(seed);
  const petProfile = battleCorePersonality(pet.personality);
  const foeProfile = battleCorePersonality(foe.personality);
  const scoreDelta = petScore - foeScore;
  const won = scoreDelta >= 0;
  const totalRounds = 8 + Math.floor(rng() * 5) + Math.min(3, Math.floor(Math.abs(scoreDelta) * 1.2));
  const rounds = [];
  let petHp = 1;
  let foeHp = 1;
  for (let i = 0; i < totalRounds; i++) {
    const pressure = petScore / Math.max(0.1, petScore + foeScore);
    const rhythm = Math.sin((i + 1) * (petProfile.tempo + foeProfile.tempo) + seed * 0.0001) * 0.08;
    const roll = rng();
    const petActs = roll + rhythm < pressure + petProfile.pressure * 0.16 - foeProfile.counter * 0.08;
    const at = 0.72 + i * (0.58 + rng() * 0.22);
    if (petActs) {
      const damage = battleCoreClamp(0.09 + battleCorePower(pet) * 0.035 + Math.max(0, scoreDelta) * 0.012 + rng() * 0.035, 0.07, 0.18);
      foeHp = battleCoreClamp(foeHp - damage, 0, 1);
      rounds.push({ at, actor: 'pet', damage, petHp, foeHp });
    } else {
      const damage = battleCoreClamp(0.075 + battleCorePower(foe) * 0.03 + Math.max(0, -scoreDelta) * 0.014 + rng() * 0.035, 0.055, 0.17);
      petHp = battleCoreClamp(petHp - damage, 0, 1);
      rounds.push({ at, actor: 'foe', damage, petHp, foeHp });
    }
  }
  const finalAt = rounds.length ? rounds[rounds.length - 1].at + 0.65 : 1.2;
  rounds.push(won
    ? { at: finalAt, actor: 'pet', damage: foeHp, petHp, foeHp: 0, decisive: true }
    : { at: finalAt, actor: 'foe', damage: petHp, petHp: 0, foeHp, decisive: true });
  return {
    won,
    petScore,
    foeScore,
    scoreDelta,
    rounds,
    duration: finalAt + 0.4,
    focusChance: battleCoreFocusChance(pet),
    power: battleCorePower(pet),
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    battleCoreFocusChance,
    battleCorePower,
    battleCoreScore,
    applyBattleCheerCore,
    resolveBattleCore,
  };
}
