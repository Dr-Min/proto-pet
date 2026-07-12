'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceFiles = ['src/render.js', 'src/battle-core.js', 'src/opponent-roster.js', 'src/app.js', 'src/care.js', 'src/input.js', 'src/sim.js', 'src/boot.js'];

function makeContext(search = '?seed=12345') {
  const elements = new Map();
  const ctx = new Proxy({}, { get: () => () => {} });
  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, makeElement(id, ctx));
    }
    return elements.get(id);
  }
  const math = Object.create(Math);
  math.random = () => 0.5;
  const context = vm.createContext({
    console,
    Math: math,
    Date,
    URLSearchParams,
    performance: { now: () => 0 },
    location: { search },
    localStorage: {
      data: new Map(),
      getItem(key) {
        return this.data.has(key) ? this.data.get(key) : null;
      },
      setItem(key, value) {
        this.data.set(key, String(value));
      },
    },
    window: {
      innerWidth: 800,
      innerHeight: 720,
      devicePixelRatio: 1,
      addEventListener() {},
    },
    document: {
      body: { dataset: {} },
      documentElement: {},
      getElementById: element,
      createElement(tag) {
        return makeElement(tag, ctx);
      },
      addEventListener() {},
      hidden: false,
    },
    getComputedStyle() {
      return { getPropertyValue() { return ''; } };
    },
    requestAnimationFrame() {},
    setInterval() {},
    setTimeout(handler) {
      handler();
    },
    __elements: elements,
  });
  for (const file of sourceFiles) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  return context;
}

function makeElement(id, ctx) {
  const listeners = {};
  return {
    id,
    className: '',
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    dataset: {},
    style: {},
    hidden: false,
    disabled: false,
    listeners,
    textContent: '',
    children: [],
    appendChild(child) {
      this.children.push(child);
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    getContext() {
      return ctx;
    },
    setPointerCapture() {},
    releasePointerCapture() {},
  };
}

function run(context, code) {
  return vm.runInContext(code, context);
}

function setRandom(context, values) {
  run(context, `__randomQueue = ${JSON.stringify(values)}; Math.random = () => __randomQueue.length ? __randomQueue.shift() : 0.5;`);
}

function tickUntil(context, predicate, label) {
  for (let i = 0; i < 2400; i++) {
    run(context, 'update(1 / 60)');
    if (run(context, predicate)) return;
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function tickBattleArrival(context) {
  tickUntil(context, 'currentPlace() === "battle" && battle !== null && battle.phase === "active" && !isTraveling()', 'battle arrival');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testBattleRequiresAdult() {
  const context = makeContext();
  run(context, 'careStats.stage = "baby"; requestBattle();');
  const state = run(context, '({ battle, caption: pet.caption })');
  assert(state.battle === null, 'baby cannot start battle');
  assert(state.caption === '싸움은 아직 어려워', 'baby battle lock uses pet voice');
}

function testBattleCanWin() {
  const context = makeContext();
  setRandom(context, Array(120).fill(0.1));
  run(context, 'careStats.stage = "adult"; needs.energy = 0.9; needs.bond = 0.9; careStats.stats = { tough: 1, quick: 1, power: 1 }; requestBattle();');
  tickBattleArrival(context);
  tickUntil(context, 'battle === null && careStats.battleWins === 1', 'battle win');
  let state = run(context, '({ wins: careStats.battleWins, memory: careStats.lastCareLine, energy: needs.energy, bond: needs.bond, place: currentPlace(), defeated: careStats.league.defeated.slice(), next: currentLeagueOpponent().id })');
  assert(state.wins === 1, 'battle win increments battleWins');
  assert(state.memory === '처음 이겨본 날', 'first battle win memory is recorded');
  assert(state.energy < 0.9, 'battle costs energy');
  assert(state.bond > 0.9, 'battle win rewards bond');
  assert(state.place === 'battle', 'battle result resolves at the battle place');
  assert(state.defeated.includes('foe-001'), 'first stage opponent is marked defeated');
  assert(state.next === 'foe-002', 'next undefeated opponent is unlocked deterministically');
  tickUntil(context, 'currentPlace() === "home" && !isTraveling()', 'battle return home');
  state = run(context, '({ place: currentPlace(), battle, memory: careStats.lastCareLine })');
  assert(state.place === 'home' && state.battle === null, 'pet returns home after battle result');
  assert(state.memory === '처음 이겨본 날', 'battle memory survives the return home');
}

function testCheerCanBeIgnoredWhenBondLow() {
  const context = makeContext();
  setRandom(context, [0.99]);
  run(context, 'careStats.stage = "adult"; needs.energy = 0.9; needs.bond = 0; requestBattle();');
  tickBattleArrival(context);
  setRandom(context, [0.99]);
  run(context, 'cheerBattle();');
  const state = run(context, '({ caption: pet.caption, hp: battle && battle.hp })');
  assert(['지금 집중 중', '내 맘대로 할래', '조금 바빠', '못 들은 척', '귀 닫는 중', '진지한 척 유지'].includes(state.caption), 'low-bond cheer can be ignored');
  assert(state.hp === 1, 'ignored cheer does not damage opponent');
}

function testBattleContextExposesMeaningfulCheer() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; needs.energy = 0.9; needs.bond = 0.9; bondMilestone = bondStage(needs.bond); startBattleHere("foe-001"); battle.plan = { ...battle.plan, won: false, scoreDelta: -0.08 }; updateGauges();');
  let state = run(context, '({ label: __elements.get("returnBtn").textContent, action: __elements.get("returnBtn").dataset.action })');
  assert(state.label === '관전중' && state.action === 'return', 'battle entry does not advertise an unavailable cheer');
  run(context, 'battle.phase = "active"; updateGauges();');
  state = run(context, '({ label: __elements.get("returnBtn").textContent, action: __elements.get("returnBtn").dataset.action, won: battle.plan.won })');
  assert(state.label === '응원', 'active battle context exposes cheer instead of return');
  assert(state.action === 'cheer', 'active battle receives the battle action theme');
  assert(state.won === false, 'the close battle starts as a loss');
  run(context, '__elements.get("returnBtn").listeners.click();');
  state = run(context, '({ won: battle.plan.won, damage: battle.cheerDamage || 0, heardLine: BATTLE_CHEER_LINES.includes(pet.caption) })');
  assert(state.won === true, 'a heard cheer can turn a close loss');
  assert(state.damage > 0, 'a heard cheer remains visible in later battle rounds');
  assert(state.heardLine, 'heard cheer uses the pet response');
}

function testRepeatedCheerCannotShowAKnockoutThenLose() {
  const context = makeContext();
  const repeated = run(context, `(() => {
    const plan = { won: false, scoreDelta: -0.25, rounds: [
      { at: 0.5, actor: 'foe', petHp: 0.5, foeHp: 0.2 },
      { at: 1, actor: 'foe', petHp: 0, foeHp: 0.12, decisive: true },
    ] };
    const first = applyBattleCheerCore(plan, { bond: 1, focus: 1 });
    return applyBattleCheerCore(first.plan, { bond: 1, focus: 1 });
  })()`);
  assert(repeated.plan.won === true, 'repeated heard cheers accumulate enough influence to turn a close fight');

  run(context, `careStats.stage = "adult"; startBattleHere("foe-001");
    battle.phase = "active";
    battle.plan = { won: false, scoreDelta: -0.4, duration: 2, rounds: [{ at: 0, actor: "pet", damage: 0.1, petHp: 0.6, foeHp: 0.1 }] };
    battle.roundIndex = 0; battle.t = 1; battle.cheerDamage = 0.18; playBattlePlanRounds();`);
  const state = run(context, '({ hp: battle.hp, won: battle.plan.won })');
  assert(state.won === false && state.hp > 0, 'a losing plan never displays a zero-HP opponent that keeps fighting');

  run(context, `battle.plan = { ...battle.plan, won: false, scoreDelta: -1, focusChance: 1 };
    battle.phase = "active"; battle.hp = 0.05; battle.cheerT = 0; battle.cheerDamage = 0; needs.bond = 1; cheerBattle();`);
  const immediate = run(context, '({ hp: battle.hp, won: battle.plan.won })');
  assert(immediate.won === false && immediate.hp > 0, 'the immediate cheer response uses the same non-knockout HP rule');
}

function testFirstBattleMemoryIsRecordedOnce() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; needs.energy = 0.9; startBattleHere("foe-001"); battle = null; startBattleHere("foe-001");');
  const count = run(context, 'careStats.memoryLog.filter(entry => entry.text === "처음 싸움 구경한 날").length');
  assert(count === 1, 'the first-battle memory is not duplicated');
}

function testBattleCoreIsDeterministic() {
  const context = makeContext();
  const a = run(context, `resolveBattleCore({
    seed: 77,
    pet: { seed: 1, personality: '침착', stats: { tough: 2, quick: 2, power: 2 }, condition: { hunger: 0.8, energy: 0.9, bond: 0.6 }, traits: [] },
    foe: { seed: 2, personality: '저돌', powerCoeff: 1.4, stats: {}, condition: { hunger: 0.7, energy: 0.8, bond: 0.2 }, traits: [] }
  })`);
  const b = run(context, `resolveBattleCore({
    seed: 77,
    pet: { seed: 1, personality: '침착', stats: { tough: 2, quick: 2, power: 2 }, condition: { hunger: 0.8, energy: 0.9, bond: 0.6 }, traits: [] },
    foe: { seed: 2, personality: '저돌', powerCoeff: 1.4, stats: {}, condition: { hunger: 0.7, energy: 0.8, bond: 0.2 }, traits: [] }
  })`);
  assert(JSON.stringify(a) === JSON.stringify(b), 'battle core returns the same progression for the same input');
  assert(Array.isArray(a.rounds) && a.rounds.length > 3, 'battle core returns playable round progression');
}

function testLeagueMigrationFromOldWins() {
  const context = makeContext();
  run(context, `localStorage.setItem('protopet-care-v1', JSON.stringify({ stage: 'adult', hunger: 0.8, energy: 0.8, bond: 0.2, battleWins: 2, ts: Date.now() })); loadCareState();`);
  const state = run(context, '({ wins: careStats.battleWins, defeated: careStats.league.defeated.slice(), current: careStats.league.current, next: currentLeagueOpponent().id })');
  assert(state.wins === 2, 'old battleWins remains unchanged');
  assert(state.defeated.join('|') === 'foe-001|foe-002', 'old wins migrate into first stage defeated opponents');
  assert(state.current === 'stage-001', 'migration keeps current stage at the next unfinished node');
  assert(state.next === 'foe-003', 'migration unlocks the next first-stage opponent');
}

function testBattlePanelShowsNextOpponentAndRematches() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; careStats.league.defeated = ["foe-001"]; markLeagueCurrentFromProgress(); openBattlePanel();');
  const state = run(context, '({ open: !__elements.get("battlePanel").hidden, league: __elements.get("battleLeagueName").textContent, regionRows: Array.from(__elements.get("battleRegionList").children).filter(child => String(child.className).includes("battle-region-node")).length, links: Array.from(__elements.get("battleRegionList").children).filter(child => String(child.className).includes("battle-region-link")).length, cardChildren: __elements.get("battleOpponentCard").children.length, challenge: __elements.get("battleChallengeBtn").dataset.opponentId, rematchRows: __elements.get("battleRematchList").children.length })');
  assert(state.open === true, 'battle panel opens');
  assert(state.league === '스테이지 맵', 'battle panel introduces the stage map');
  assert(state.regionRows === 100, 'battle panel renders every configured stage node');
  assert(state.links === 99, 'battle panel connects stage nodes');
  assert(state.cardChildren === 2, 'battle panel renders opponent preview and text');
  assert(state.challenge === 'foe-002', 'challenge targets next undefeated opponent');
  assert(state.rematchRows === 1, 'defeated opponents render as rematches');
}

function testLeagueClearAndRivalMemory() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; careStats.league.defeated = ["foe-001", "foe-002"]; careStats.pebbles = 0; battle = { y: pet.y, opponentId: "foe-003", rematch: false }; finishBattle(true);');
  const state = run(context, '({ defeated: careStats.league.defeated.slice(), current: careStats.league.current, pebbles: careStats.pebbles, memories: careStats.memoryLog.map(entry => entry.text) })');
  assert(state.defeated.includes('foe-003'), 'rival win marks the stage rival defeated');
  assert(state.current === 'stage-002', 'clearing a stage unlocks the next stage node');
  assert(state.pebbles === 10, 'league clear grants normal win reward plus league reward');
  assert(state.memories.includes('두부 반장이 인정해준 날'), 'rival recognition memory is recorded');
  assert(state.memories.includes('공터 1길을 지난 날'), 'stage clear memory is recorded');
}

function testWalkTravelsOutAndReturnsHome() {
  const context = makeContext();
  run(context, 'careStats.stage = "baby"; needs.energy = 0.9; requestWalk();');
  tickUntil(context, 'currentPlace() === "walk" && !isTraveling()', 'walk arrival');
  let state = run(context, '({ place: currentPlace(), memory: careStats.lastCareLine, energy: needs.energy, bond: needs.bond })');
  assert(state.place === 'walk', 'walk action changes to walk place');
  assert(state.memory === '밖 냄새 맡은 날', 'walk records outdoor memory');
  assert(state.energy < 0.9, 'walk costs a little energy');
  assert(state.bond > 0.08, 'walk adds a little bond');
  run(context, 'requestWalk();');
  tickUntil(context, 'currentPlace() === "home" && !isTraveling()', 'return home');
  state = run(context, '({ place: currentPlace(), caption: pet.caption })');
  assert(state.place === 'home', 'walk button returns home outside');
}

function testWalkFindsThingsAndReturnsHome() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; needs.energy = 0.9; requestWalk();');
  tickUntil(context, 'currentPlace() === "walk" && !isTraveling()', 'walk arrival');
  tickUntil(context, 'walkVisit.discoveries >= 2 && currentPlace() === "home" && !isTraveling()', 'walk discoveries and return');
  const state = run(context, '({ place: currentPlace(), discoveries: walkVisit.discoveries, pebbles: careStats.pebbles, memory: careStats.lastCareLine, tough: careStats.stats.tough })');
  assert(state.place === 'home', 'walk returns home after outdoor discoveries');
  assert(state.discoveries >= 2, 'walk completes multiple outdoor discoveries');
  assert(state.pebbles >= 3, 'walk discoveries bring back shiny pebbles');
  assert(state.tough > 0, 'returning from walk trains toughness');
  assert(state.memory !== '밖 냄새 맡은 날', 'walk discovery writes a more specific memory');
}

function testBottomBarSwitchesToReturnAwayFromHome() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; updateGauges(); __elements.get("moreBtn").listeners.click();');
  let state = run(context, '({ sheetOpen: !__elements.get("moreSheet").hidden, away: document.body.dataset.away })');
  assert(state.sheetOpen === true, 'more button opens the bottom sheet at home');
  assert(state.away === 'false', 'home context keeps care actions visible');
  run(context, 'requestWalk();');
  tickUntil(context, 'currentPlace() === "walk" && !isTraveling()', 'walk arrival');
  run(context, 'updateGauges();');
  state = run(context, '({ away: document.body.dataset.away, returnText: __elements.get("returnBtn").textContent, sheetOpen: !__elements.get("moreSheet").hidden })');
  assert(state.away === 'true', 'away context replaces the care action bar');
  assert(state.returnText === '귀가', 'away context shows a return-home action');
  assert(state.sheetOpen === false, 'leaving home closes the bottom sheet');
}

function testLongAbsenceAddsGrime() {
  const context = makeContext();
  run(context, `localStorage.setItem('protopet-care-v1', JSON.stringify({ stage: 'adult', hunger: 0.8, energy: 0.8, bond: 0.2, grime: 0, ts: Date.now() - 4 * 3600 * 1000 })); loadCareState();`);
  const state = run(context, '({ grime: careStats.grime, caption: pet.caption })');
  assert(state.grime > 0, 'long absence adds grime');
}

testBattleRequiresAdult();
testBattleCoreIsDeterministic();
testLeagueMigrationFromOldWins();
testBattlePanelShowsNextOpponentAndRematches();
testBattleCanWin();
testCheerCanBeIgnoredWhenBondLow();
testBattleContextExposesMeaningfulCheer();
testRepeatedCheerCannotShowAKnockoutThenLose();
testFirstBattleMemoryIsRecordedOnce();
testLeagueClearAndRivalMemory();
testWalkTravelsOutAndReturnsHome();
testWalkFindsThingsAndReturnsHome();
testBottomBarSwitchesToReturnAwayFromHome();
testLongAbsenceAddsGrime();
console.log('battle harness passed');
