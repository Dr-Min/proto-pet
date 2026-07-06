'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceFiles = ['src/app.js', 'src/care.js', 'src/input.js', 'src/sim.js', 'src/boot.js'];

function makeContext() {
  const elements = new Map();
  const ctx = new Proxy({}, { get: () => () => {} });
  function element(id) {
    if (!elements.has(id)) {
      const listeners = {};
      elements.set(id, {
        id,
        style: {},
        listeners,
        textContent: '',
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
    location: { search: '?seed=12345' },
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

function setRandom(context, values) {
  run(context, `__randomQueue = ${JSON.stringify(values)}; Math.random = () => __randomQueue.length ? __randomQueue.shift() : 0.5;`);
}

function tickUntil(context, predicate, label) {
  for (let i = 0; i < 3600; i++) {
    run(context, 'update(1 / 60)');
    if (run(context, predicate)) return;
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testFetchComplete() {
  const context = makeContext();
  setRandom(context, [0.2, 0.2, 0.5, 0.5]);
  run(context, 'careStats.stage = "adult"; needs.energy = 0.9; needs.bond = 0.2; __elements.get("playBtn").listeners.click();');
  tickUntil(context, 'careStats.fetchCount === 1', 'fetch completion');
  const state = run(context, '({ fetchCount: careStats.fetchCount, memory: careStats.lastCareLine, bond: needs.bond, energy: needs.energy, happy: pet.happy, ballGone: ball === null || ball.phase === "fading" })');
  assert(state.fetchCount === 1, 'fetchCount increments after completion');
  assert(state.memory === '공 물어오기 배움', 'first fetch memory is recorded');
  assert(state.bond > 0.2, 'bond reward is applied');
  assert(state.energy < 0.9, 'energy cost is applied');
  assert(state.happy >= 0.8, 'happy wag boost is applied');
  assert(state.ballGone, 'ball is dropped for fade after return');
}

function testFetchRefusal() {
  const context = makeContext();
  setRandom(context, [0.2, 0.2, 0.5, 0.5]);
  run(context, 'careStats.stage = "adult"; needs.energy = 0.2; requestPlayBall();');
  tickUntil(context, 'ball && ball.declined === true', 'low-energy refusal');
  const state = run(context, '({ caption: pet.caption, ballStillThere: ball !== null, fetchCount: careStats.fetchCount })');
  assert(['지금은 패스…', '공은 내일'].includes(state.caption), 'low energy refusal caption is used');
  assert(state.ballStillThere, 'refused ball remains until timeout');
  assert(state.fetchCount === 0, 'refusal does not increment fetchCount');
}

function testFetchAbandon() {
  const context = makeContext();
  setRandom(context, [0.2, 0.2, 0.5, 0.5]);
  run(context, 'careStats.stage = "adult"; needs.energy = 0.32; requestPlayBall();');
  tickUntil(context, 'ball && ball.fetchState === "return"', 'return phase');
  run(context, 'needs.energy = 0.29; update(1 / 60);');
  const state = run(context, '({ caption: pet.caption, abandoned: ball && ball.abandoned, phase: ball && ball.phase, fetchCount: careStats.fetchCount })');
  assert(state.caption === '그만 뛸래…', 'fatigue abandon caption is used');
  assert(state.abandoned === true, 'ball is marked abandoned for timeout');
  assert(state.phase === 'settled', 'abandoned ball is left in place');
  assert(state.fetchCount === 0, 'abandon does not increment fetchCount');
}

function testFetchPracticeChangesMovement() {
  const context = makeContext();
  run(context, 'careStats.stage = "adult"; careStats.fetchCount = 0;');
  const fresh = run(context, '({ speed: fetchChaseSpeed(220), trip: fetchTripMultiplier() })');
  run(context, 'careStats.fetchCount = 8;');
  const practiced = run(context, '({ speed: fetchChaseSpeed(220), trip: fetchTripMultiplier() })');
  assert(practiced.speed > fresh.speed, 'fetch practice increases chase speed');
  assert(practiced.trip < fresh.trip, 'fetch practice lowers fetch-trip chance');
}

function testFetchPracticeCaptionCanAppear() {
  const context = makeContext();
  setRandom(context, [0.1, 0.5, 0.5, 0.5]);
  run(context, 'careStats.stage = "adult"; careStats.fetchCount = 4; needs.energy = 0.9; recordFetchComplete();');
  const state = run(context, '({ caption: pet.caption, fetchCount: careStats.fetchCount })');
  assert(state.fetchCount === 5, 'fetch complete still increments count before practice caption');
  assert(state.caption === '이제 좀 익숙함', 'practice caption can appear after repeated fetch');
}

testFetchComplete();
testFetchRefusal();
testFetchAbandon();
testFetchPracticeChangesMovement();
testFetchPracticeCaptionCanAppear();
console.log('fetch harness passed');
