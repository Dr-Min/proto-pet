'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceFiles = ['src/render.js', 'src/app.js', 'src/care.js', 'src/input.js', 'src/sim.js', 'src/boot.js'];

function makeContext(search = '?seed=12345') {
  const elements = new Map();
  const ctx = new Proxy({}, { get: () => () => {} });
  let now = 0;
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
    performance: { now: () => now },
    __setNow(value) {
      now = value;
    },
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
function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function testMigrationDefaultsAndFetchCarryover() {
  const context = makeContext();
  run(context, `localStorage.setItem('protopet-care-v1', JSON.stringify({ stage: 'adult', hunger: 0.8, energy: 0.8, bond: 0.2, fetchCount: 8, ts: Date.now() })); loadCareState();`);
  const state = run(context, '({ pebbles: careStats.pebbles, owned: careStats.furnitureOwned.slice(), quick: careStats.stats.quick, placed: careStats.furniturePlaced })');
  assert(state.pebbles === 0, 'old saves migrate pebbles to zero');
  assert(state.owned.length === 0, 'old saves migrate furniture to empty list');
  assert(state.quick === 5, 'old fetchCount carries over into quick movement');
  assert(state.placed.wheel.xr === 0.26 && state.placed.window.yr === 0.26, 'old saves initialize furniture placement anchors');
}

function testFurniturePlacementMigrationPersistenceAndResize() {
  const context = makeContext();
  run(context, `localStorage.setItem('protopet-care-v1', JSON.stringify({ stage: 'adult', hunger: 0.8, energy: 0.8, bond: 0.2, furnitureOwned: ['wheel', 'window'], furniturePlaced: { wheel: { xr: 0.7, yr: 0.72 }, window: { xr: 0.2, yr: 0.24 } }, ts: Date.now() })); loadCareState();`);
  let state = run(context, '({ wheel: furnitureAnchor("wheel"), window: furnitureAnchor("window"), placed: careStats.furniturePlaced })');
  assert(near(state.placed.wheel.xr, 0.7) && near(state.placed.window.yr, 0.24), 'saved furniture ratios migrate without losing coordinates');
  assert(near(state.wheel.x, 560) && near(state.window.x, 160), 'saved ratios map to the initial viewport');
  run(context, 'W = 400; H = 900;');
  state = run(context, '({ wheel: furnitureAnchor("wheel"), window: furnitureAnchor("window") })');
  assert(near(state.wheel.x, 280), 'furniture x position survives resize through ratio coordinates');
  assert(state.window.y >= 900 * 0.16 && state.window.y <= 900 * 0.34, 'window is clamped to the wall band after resize');
  run(context, 'finishFurniturePlacement("wheel", W * 0.48, H * 0.8);');
  const saved = run(context, 'JSON.parse(localStorage.getItem("protopet-care-v1"))');
  assert(saved.furniturePlaced && saved.furniturePlaced.wheel && Number.isFinite(saved.furniturePlaced.wheel.xr), 'dropping furniture persists ratio coordinates');
}

function testFurniturePlacementClampsAndSeparates() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; careStats.furnitureOwned = ["wheel", "cushion", "plant", "window"]; careStats.furniturePlaced = migrateFurniturePlaced(null); setFurniturePlacement("wheel", W * 0.5, H * 0.7); setFurniturePlacement("cushion", W * 0.5, H * 0.7); setFurniturePlacement("plant", W * 0.5, H * 0.7); setFurniturePlacement("window", W * 0.5, H * 0.8);');
  const state = run(context, '({ wheel: furnitureAnchor("wheel"), cushion: furnitureAnchor("cushion"), plant: furnitureAnchor("plant"), window: furnitureAnchor("window"), gap: furnitureMinGap(H * 0.7) })');
  assert(state.window.y >= 720 * 0.16 && state.window.y <= 720 * 0.34, 'window placement clamps into the wall band');
  assert(state.wheel.y >= 720 * 0.42 && state.wheel.y <= 720 * 0.83, 'floor furniture clamps into the floor band');
  assert(distance(state.wheel.x, state.wheel.y, state.cushion.x, state.cushion.y) >= state.gap * 0.92, 'overlapping floor furniture is pushed apart');
  assert(distance(state.cushion.x, state.cushion.y, state.plant.x, state.plant.y) >= state.gap * 0.82, 'multiple floor furniture placements keep usable spacing');
}

function testFurnitureBehaviorTargetsPlacedPosition() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; careStats.furnitureOwned = ["wheel", "plant", "window"]; careStats.furniturePlaced = migrateFurniturePlaced(null); setFurniturePlacement("wheel", W * 0.68, H * 0.73); setFurniturePlacement("plant", W * 0.22, H * 0.76); setFurniturePlacement("window", W * 0.82, H * 0.2); needs.energy = 0.9; setBehavior("wheel");');
  let state = run(context, '({ target: furnitureMoveTarget(), use: furnitureUsePoint("wheel"), anchor: furnitureAnchor("wheel") })');
  assert(Math.abs(state.target.x - state.use.x) < 0.001 && Math.abs(state.target.y - state.use.y) < 0.001, 'wheel behavior moves to the placed wheel point');
  assert(state.use.y < state.anchor.y, 'wheel use point places the pet visibly inside the wheel');
  run(context, 'setBehavior("sniff");');
  state = run(context, '({ target: furnitureMoveTarget(), plant: furnitureUsePoint("plant") })');
  assert(state.target && Math.abs(state.target.x - state.plant.x) < 0.001, 'plant behavior target follows custom placement');
}

function testFurnitureLongPressDragAndPetPriority() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; careStats.furnitureOwned = ["plant", "wheel"]; careStats.furniturePlaced = migrateFurniturePlaced(null); setFurniturePlacement("plant", W * 0.18, H * 0.7); setFurniturePlacement("wheel", pet.x, pet.y);');
  let state = run(context, '({ petX: pet.x, petY: pet.y, petTop: pet.y - stagedRadius(), plant: furnitureAnchor("plant"), before: { ...careStats.furniturePlaced.plant } })');
  run(context, '__setNow(0); __elements.get("c").listeners.pointerdown({ clientX: pet.x, clientY: pet.y - stagedRadius(), pointerId: 7, pointerType: "mouse", timeStamp: 0, preventDefault() {} });');
  state = run(context, '({ mode: input.mode, furnitureId: input.furnitureId })');
  assert(state.mode === 'pending' && state.furnitureId === '', 'pet hit testing has priority over furniture dragging');
  run(context, '__elements.get("c").listeners.pointerup({ clientX: pet.x, clientY: pet.y - stagedRadius(), pointerId: 7, pointerType: "mouse", timeStamp: 20, preventDefault() {} });');
  run(context, '__setNow(0); const p = furnitureAnchor("plant"); __elements.get("c").listeners.pointerdown({ clientX: p.x, clientY: p.y, pointerId: 8, pointerType: "mouse", timeStamp: 0, preventDefault() {} });');
  run(context, '__setNow(360); update(1 / 60);');
  state = run(context, '({ mode: input.mode, held: furnitureMotion.heldId, caption: pet.caption })');
  assert(state.mode === 'furniture-drag' && state.held === 'plant', 'long press lifts furniture into drag mode');
  assert(state.caption === '그거 옮기나', 'first furniture lift uses the required session caption');
  run(context, '__setNow(420); __elements.get("c").listeners.pointermove({ clientX: W * 0.62, clientY: H * 0.76, pointerId: 8, pointerType: "mouse", timeStamp: 420, preventDefault() {} }); for (let i = 0; i < 24; i++) update(1 / 60); __elements.get("c").listeners.pointerup({ clientX: W * 0.62, clientY: H * 0.76, pointerId: 8, pointerType: "mouse", timeStamp: 840, preventDefault() {} });');
  state = run(context, '({ placed: careStats.furniturePlaced.plant, saved: JSON.parse(localStorage.getItem("protopet-care-v1")).furniturePlaced.plant, held: furnitureMotion.heldId, settling: furnitureMotion.settleId, particles: particles.length })');
  assert(state.held === '' && state.settling === 'plant', 'dropping furniture clears held state and starts settle motion');
  assert(Math.abs(state.placed.xr - state.saved.xr) < 0.000001 && Math.abs(state.placed.yr - state.saved.yr) < 0.000001, 'dropped furniture placement is saved');
  assert(state.placed.xr > 0.4 && state.placed.yr > 0.6, 'dragged furniture moves to the intended floor area');
  assert(state.particles >= 5, 'dropping furniture emits dust particles');
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
  run(context, 'careStats.stage = "adult"; careStats.pebbles = 40; careStats.furnitureOwned = ["wheel", "window", "cushion", "plant"]; careStats.stats = { tough: 2, quick: 3, power: 4 }; careStats.memoryLog = [{ text: "오늘 일", at: Date.now() }, { text: "어제 일", at: Date.now() - 86400000 }, { text: "먼저 일", at: Date.now() - 2 * 86400000 }, { text: "예전 일", at: 0 }]; draw(1); openShop(); openNotebook(); openMemory();');
  const state = run(context, '({ shopOpen: !shopPanel.hidden, notebookOpen: !notebookPanel.hidden, memoryOpen: !memoryPanel.hidden, shopRows: shopList.children.length, bodyRows: notebookBodyStats.children.length, bodyHints: notebookBodyStats.children.map(row => row.children[3].textContent), memoryGroups: memoryGroups.children.map(section => section.children[0].textContent) })');
  assert(state.shopOpen === true, 'shop panel opens without rendering errors');
  assert(state.notebookOpen === true, 'notebook panel opens without rendering errors');
  assert(state.memoryOpen === true, 'memory panel opens without rendering errors');
  assert(state.shopRows === 4, 'shop renders four furniture rows');
  assert(state.bodyRows === 3, 'notebook renders three body rows');
  assert(state.bodyHints.includes('산책과 싸움 뒤에 느는 듯') && state.bodyHints.includes('공놀이랑 쳇바퀴로 느는 듯') && state.bodyHints.includes('싸움에서 버티면 느는 듯'), 'notebook body rows render growth-path hints');
  assert(state.memoryGroups.join('|') === '오늘|어제|2일 전|예전', 'memory panel groups entries by relative date');
}

testMigrationDefaultsAndFetchCarryover();
testFurniturePlacementMigrationPersistenceAndResize();
testFurniturePlacementClampsAndSeparates();
testFurnitureBehaviorTargetsPlacedPosition();
testFurnitureLongPressDragAndPetPriority();
testWalkDiscoveryPebblesAreDaily();
testBattlePebblesAndStats();
testRoutinePebbleAndBuyingFurniture();
testWheelSessionTrainsQuickAndCheerBonuses();
testCushionImprovesSleepRecovery();
testFurnitureDrawAndPanelsDoNotThrow();
console.log('economy furniture harness passed');
