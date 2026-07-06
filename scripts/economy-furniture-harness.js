'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceFiles = ['src/render.js', 'src/app.js', 'src/care.js', 'src/input.js', 'src/sim.js', 'src/boot.js'];

function makeContext(search = '?seed=12345') {
  const elements = new Map();
  const ctx = new Proxy({}, { get: () => () => {} });
  function element(id) {
    if (!elements.has(id)) elements.set(id, makeElement(id, ctx));
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
        return makeElement(tag, ctx);
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function near(actual, expected) {
  return Math.abs(actual - expected) < 0.000001;
}

function testMigrationDefaultsAndFetchCarryover() {
  const context = makeContext();
  run(context, `localStorage.setItem('protopet-care-v1', JSON.stringify({ stage: 'adult', hunger: 0.8, energy: 0.8, bond: 0.2, fetchCount: 8, ts: Date.now() })); loadCareState();`);
  const state = run(context, '({ pebbles: careStats.pebbles, owned: careStats.furnitureOwned.slice(), quick: careStats.stats.quick })');
  assert(state.pebbles === 0, 'old saves migrate pebbles to zero');
  assert(state.owned.length === 0, 'old saves migrate furniture to empty list');
  assert(state.quick === 5, 'old fetchCount carries over into quick movement');
}

function testWalkDiscoveryPebblesAreDaily() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; grantWalkDiscoveryShinyPebble();');
  let state = run(context, '({ pebbles: careStats.pebbles, caption: pet.caption })');
  assert(state.pebbles === 2 || state.pebbles === 3, 'first daily walk discovery grants two or three pebbles');
  assert(['반짝이는 거 주움', '반짝 하나 물고 옴'].includes(state.caption), 'walk discovery uses pebble caption');
  run(context, 'grantWalkDiscoveryShinyPebble();');
  state = run(context, '({ pebbles: careStats.pebbles })');
  assert(state.pebbles === 3 || state.pebbles === 4, 'repeat same-day discovery grants one pebble');
}

function testBattlePebblesAndStats() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; battle = { y: pet.y }; finishBattle(true);');
  let state = run(context, '({ pebbles: careStats.pebbles, tough: careStats.stats.tough, power: careStats.stats.power })');
  assert(state.pebbles === 4, 'battle win grants four pebbles');
  assert(near(state.tough, 0.06) && near(state.power, 0.06), 'battle win trains tough and power');
  run(context, 'battle = { y: pet.y }; finishBattle(false);');
  state = run(context, '({ pebbles: careStats.pebbles, tough: careStats.stats.tough, power: careStats.stats.power, caption: pet.caption })');
  assert(state.pebbles === 5, 'battle loss grants one pebble');
  assert(near(state.tough, 0.09) && near(state.power, 0.09), 'battle loss gives smaller body practice');
  assert(state.caption === '지긴 했는데 이거 주움', 'battle loss uses required pebble caption');
}

function testRoutinePebbleAndBuyingFurniture() {
  const context = makeContext();
  run(context, 'noteCareAction("meal"); noteCareAction("rest"); noteCareAction("pet");');
  let state = run(context, '({ pebbles: careStats.pebbles, caption: pet.caption })');
  assert(state.pebbles === 1, 'full care round grants one pebble');
  assert(['어디서 반짝 물어옴', '반짝 놓고 감'].includes(state.caption), 'routine reward uses pebble caption');
  run(context, 'careStats.pebbles = 5;');
  assert(run(context, 'buyFurniture("plant")') === false, 'cannot buy furniture without enough pebbles');
  run(context, 'careStats.pebbles = 20;');
  assert(run(context, 'buyFurniture("plant")') === true, 'can buy furniture with enough pebbles');
  state = run(context, '({ pebbles: careStats.pebbles, owned: careStats.furnitureOwned.slice() })');
  assert(state.pebbles === 14, 'buying deducts the furniture price');
  assert(state.owned.includes('plant'), 'bought furniture is saved as owned');
}

function testWheelSessionTrainsQuickAndCheerBonuses() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; careStats.furnitureOwned = ["wheel"]; needs.energy = 0.9; setBehavior("wheel"); const a = furnitureUsePoint("wheel"); pet.x = a.x; pet.y = a.y; cheerWheelAt(a.x, a.y - 24);');
  for (let i = 0; i < 180; i++) run(context, 'update(1 / 60)');
  run(context, 'pet.behavior = "stare"; updateCare(1 / 60, { airborne: false, speed: 0 });');
  const state = run(context, '({ quick: careStats.stats.quick, energy: needs.energy, cheered: furnitureState.wheelCheered })');
  assert(state.cheered === true, 'wheel tap cheer is recorded during a wheel session');
  assert(near(state.quick, 0.1), 'cheered wheel session gives quick bonus');
  assert(state.energy < 0.9, 'wheel session costs energy');
}

function testCushionImprovesSleepRecovery() {
  const plain = makeContext();
  run(plain, 'careStats.stage = "adult"; needs.energy = 0.3; pet.behavior = "sleep"; updateCare(1, { airborne: false, speed: 0 });');
  const plainEnergy = run(plain, 'needs.energy');
  const cushioned = makeContext();
  run(cushioned, 'careStats.stage = "adult"; careStats.furnitureOwned = ["cushion"]; needs.energy = 0.3; setBehavior("sleep"); const a = furnitureUsePoint("cushion"); pet.x = a.x; pet.y = a.y; updateCare(1, { airborne: false, speed: 0 });');
  const cushionEnergy = run(cushioned, 'needs.energy');
  assert(cushionEnergy > plainEnergy, 'sleeping on the cushion recovers more energy');
}

function testFurnitureDrawAndPanelsDoNotThrow() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; careStats.pebbles = 40; careStats.furnitureOwned = ["wheel", "window", "cushion", "plant"]; careStats.stats = { tough: 2, quick: 3, power: 4 }; draw(1); openShop(); openNotebook();');
  const state = run(context, '({ shopOpen: !shopPanel.hidden, notebookOpen: !notebookPanel.hidden, shopRows: shopList.children.length, bodyRows: notebookBodyStats.children.length })');
  assert(state.shopOpen === true, 'shop panel opens without rendering errors');
  assert(state.notebookOpen === true, 'notebook panel opens without rendering errors');
  assert(state.shopRows === 4, 'shop renders four furniture rows');
  assert(state.bodyRows === 3, 'notebook renders three body rows');
}

testMigrationDefaultsAndFetchCarryover();
testWalkDiscoveryPebblesAreDaily();
testBattlePebblesAndStats();
testRoutinePebbleAndBuyingFurniture();
testWheelSessionTrainsQuickAndCheerBonuses();
testCushionImprovesSleepRecovery();
testFurnitureDrawAndPanelsDoNotThrow();
console.log('economy furniture harness passed');
