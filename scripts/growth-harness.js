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
        classList: { toggle() {} },
        style: {},
        listeners,
        textContent: '',
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testEggActionsStayInEgg() {
  const context = makeContext();
  run(context, '__elements.get("feedBtn").listeners.click(); requestPlayBall();');
  const state = run(context, '({ stage: currentStage(), food: food, ball: ball, caption: pet.caption })');
  assert(state.stage === 'egg', 'new saves begin as an egg');
  assert(state.food === null, 'feed does not create a bowl while egg is locked');
  assert(state.ball === null, 'play does not create a ball before adult stage');
  assert(['아직 밥 몰라', '아직 세상 구경 전'].includes(state.caption), 'locked egg actions answer in pet voice');
}

function testWarmEggHatchesAfterAgeGate() {
  const context = makeContext();
  run(context, 'careStats.stage = "egg"; careStats.stageChangedAt = Date.now() - 21 * 1000; careStats.hatchWarmth = 1; update(1 / 60);');
  const state = run(context, '({ stage: currentStage(), memory: careStats.lastCareLine, caption: pet.caption })');
  assert(state.stage === 'baby', 'warm aged egg hatches into baby');
  assert(state.memory === '알에서 나온 날', 'hatch memory is recorded');
  assert(state.caption === '…누구세요', 'hatch caption follows PLAN voice');
}

function testBabyGrowsOnNextSleepWhenReady() {
  const context = makeContext();
  run(context, 'careStats.stage = "baby"; careStats.stageChangedAt = Date.now() - 25 * 3600 * 1000; careStats.mealsFed = 6; careStats.napsTaken = 3; needs.energy = 0.3; requestRest();');
  const state = run(context, '({ stage: currentStage(), memory: careStats.lastCareLine, caption: pet.caption })');
  assert(state.stage === 'adult', 'ready baby grows on sleep');
  assert(state.memory === '어른이 된 날', 'adult growth memory is recorded');
  assert(state.caption === '나 좀 큰 듯', 'adult growth caption follows PLAN voice');
}

function testBabyPlayIsLocked() {
  const context = makeContext();
  run(context, 'careStats.stage = "baby"; requestPlayBall();');
  const state = run(context, '({ ball: ball, caption: pet.caption })');
  assert(state.ball === null, 'baby cannot start fetch');
  assert(state.caption === '아직 공 몰라', 'baby play lock uses the planned caption');
}

testEggActionsStayInEgg();
testWarmEggHatchesAfterAgeGate();
testBabyGrowsOnNextSleepWhenReady();
testBabyPlayIsLocked();
console.log('growth harness passed');
