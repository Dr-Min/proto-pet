'use strict';

const assert = require('node:assert/strict');
const {
  BATTLE_BEHAVIOR_PATTERNS,
  BATTLE_BUILD_PATTERNS,
  BATTLE_FORMATION_PATTERNS,
  BATTLE_STAT_HOOKS,
} = require('../src/battle-patterns.js');
const {
  OPPONENT_FORMATIONS,
  OPPONENT_ROSTER,
  OPPONENT_STAT_MEANING,
  OPPONENT_TIERS,
} = require('../src/opponent-roster.js');

assert.equal(OPPONENT_ROSTER.length, 300);
assert.deepEqual(OPPONENT_STAT_MEANING, {
  tough: 'hp',
  quick: 'evasion-critical',
  power: 'damage',
});

const ids = new Set();
const names = new Set();
const tierCounts = new Map();
for (const opponent of OPPONENT_ROSTER) {
  assert.equal(typeof opponent.id, 'string');
  assert.equal(typeof opponent.name, 'string');
  assert.ok(!ids.has(opponent.id), `duplicate id: ${opponent.id}`);
  assert.ok(!names.has(opponent.name), `duplicate name: ${opponent.name}`);
  ids.add(opponent.id);
  names.add(opponent.name);

  assert.ok(OPPONENT_TIERS.some(tier => tier.id === opponent.tier), `unknown tier: ${opponent.tier}`);
  assert.ok(BATTLE_BEHAVIOR_PATTERNS[opponent.behavior], `unknown behavior: ${opponent.behavior}`);
  assert.ok(BATTLE_FORMATION_PATTERNS[opponent.formation], `unknown formation: ${opponent.formation}`);
  assert.ok(BATTLE_BUILD_PATTERNS[opponent.build], `unknown build: ${opponent.build}`);
  assert.equal(opponent.unitCount, OPPONENT_FORMATIONS[opponent.formation].unitCount);
  assert.equal(opponent.statMeaning.tough, BATTLE_STAT_HOOKS.tough.role);
  assert.equal(opponent.statMeaning.quick, BATTLE_STAT_HOOKS.quick.role);
  assert.equal(opponent.statMeaning.power, BATTLE_STAT_HOOKS.power.role);

  for (const key of ['tough', 'quick', 'power']) {
    assert.equal(typeof opponent.stats[key], 'number');
    assert.ok(opponent.stats[key] >= 0 && opponent.stats[key] <= 5, `${opponent.id} ${key} out of range`);
  }

  assert.equal(typeof opponent.intro, 'string');
  assert.equal(typeof opponent.winLine, 'string');
  assert.equal(typeof opponent.loseLine, 'string');
  assert.ok(!opponent.name.includes('나무숟가락 검'));
  assert.ok(!opponent.name.includes('냄비뚜껑 방패'));

  tierCounts.set(opponent.tier, (tierCounts.get(opponent.tier) || 0) + 1);
}

for (const tier of OPPONENT_TIERS) {
  assert.equal(tierCounts.get(tier.id), 30, `${tier.id} should have 30 opponents`);
}

console.log('opponent-roster: 300 opponents and battle patterns ok');
