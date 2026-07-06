'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceFiles = ['src/app.js', 'src/care.js', 'src/input.js', 'src/sim.js', 'src/boot.js'];

function makeContext(search = '?seed=12345') {
  const elements = new Map();
  const ctx = new Proxy({}, { get: () => () => {} });
  function element(id) {
    if (!elements.has(id)) {
      const listeners = {};
      elements.set(id, {
        id,
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        dataset: {},
        style: {},
        hidden: false,
        listeners,
        textContent: '',
        appendChild() {},
        setAttribute() {},
        addEventListener(type, handler) {
          listeners[type] = handler;
        },
        getContext() {
          return ctx;
        },
        setPointerCapture() {},
        releasePointerCapture() {},
      });
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
      getElementById: element,
      createElement(tag) {
        return { tagName: tag.toUpperCase(), textContent: '', appendChild() {} };
      },
      addEventListener() {},
      hidden: false,
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
  tickUntil(context, 'currentPlace() === "battle" && battle !== null && !isTraveling()', 'battle arrival');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testBattleRequiresAdult() {
  const context = makeContext();
  run(context, 'careStats.stage = "baby"; requestBattle();');
  const state = run(context, '({ battle, caption: pet.caption })');
  assert(state.battle === null, 'baby cannot start battle');
  assert(state.caption === '아직 싸움 몰라', 'baby battle lock uses pet voice');
}

function testBattleCanWin() {
  const context = makeContext();
  setRandom(context, Array(120).fill(0.1));
  run(context, 'careStats.stage = "adult"; needs.energy = 0.9; needs.bond = 0.9; careStats.fetchCount = 8; requestBattle();');
  tickBattleArrival(context);
  tickUntil(context, 'battle === null && careStats.battleWins === 1', 'battle win');
  const state = run(context, '({ wins: careStats.battleWins, memory: careStats.lastCareLine, energy: needs.energy, bond: needs.bond, place: currentPlace() })');
  assert(state.wins === 1, 'battle win increments battleWins');
  assert(state.memory === '처음 이겨본 날', 'first battle win memory is recorded');
  assert(state.energy < 0.9, 'battle costs energy');
  assert(state.bond > 0.9, 'battle win rewards bond');
  assert(state.place === 'battle', 'battle happens at the battle place');
}

function testCheerCanBeIgnoredWhenBondLow() {
  const context = makeContext();
  setRandom(context, [0.99]);
  run(context, 'careStats.stage = "adult"; needs.energy = 0.9; needs.bond = 0; requestBattle();');
  tickBattleArrival(context);
  setRandom(context, [0.99]);
  run(context, 'cheerBattle();');
  const state = run(context, '({ caption: pet.caption, hp: battle && battle.hp })');
  assert(state.caption === '못 들은 척함' || state.caption === '내 맘대로 함', 'low-bond cheer can be ignored');
  assert(state.hp === 1, 'ignored cheer does not damage opponent');
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
testBattleCanWin();
testCheerCanBeIgnoredWhenBondLow();
testWalkTravelsOutAndReturnsHome();
testBottomBarSwitchesToReturnAwayFromHome();
testLongAbsenceAddsGrime();
console.log('battle harness passed');
