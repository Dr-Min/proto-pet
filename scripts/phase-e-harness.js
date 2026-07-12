'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceFiles = ['src/render.js', 'src/battle-core.js', 'src/opponent-roster.js', 'src/app.js', 'src/care.js', 'src/input.js', 'src/sim.js', 'src/boot.js'];

function makeDate(initialNow) {
  let currentNow = initialNow;
  class MockDate extends Date {
    constructor(...args) {
      if (args.length) super(...args);
      else super(currentNow);
    }

    static now() {
      return currentNow;
    }
  }
  return {
    DateClass: MockDate,
    setNow(value) {
      currentNow = value;
    },
  };
}

function makeContext({ now = Date.UTC(2026, 6, 7, 12), search = '?seed=12345' } = {}) {
  const elements = new Map();
  const ctx = new Proxy({}, { get: () => () => {} });
  const clock = makeDate(now);
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
    Date: clock.DateClass,
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
      __petNow: now,
      addEventListener() {},
    },
    document: {
      body: { dataset: {} },
      documentElement: {},
      getElementById: element,
      createElement(tag) {
        return {
          tagName: tag.toUpperCase(),
          className: '',
          textContent: '',
          hidden: false,
          appendChild() {},
          setAttribute() {},
        };
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
    __setNow(value) {
      clock.setNow(value);
      context.window.__petNow = value;
    },
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

function near(actual, expected) {
  return Math.abs(actual - expected) < 1e-9;
}

function savedCare({ now, adoptedAt, lastDailyLoginDay, bond = 0.2, extra = {} }) {
  return JSON.stringify({
    stage: 'adult',
    hunger: 0.8,
    energy: 0.8,
    bond,
    adoptedAt,
    lastDailyLoginDay,
    ts: now - 2 * 60 * 1000,
    ...extra,
  });
}

function testHourOverrideSelectsPeriodAndWeights() {
  const morning = makeContext({ search: '?seed=12345&hour=8' });
  run(morning, 'careStats.stage = "adult"; needs.bond = 0;');
  assert(run(morning, 'dayPeriod()') === 'morning', 'hour override selects morning');
  const morningWeights = run(morning, '({ zoomies: behaviorWeight("zoomies", BEHAVIORS.zoomies), wander: behaviorWeight("wander", BEHAVIORS.wander) })');
  assert(near(morningWeights.zoomies, 1.4), 'morning raises zoomies weight');
  assert(near(morningWeights.wander, 4.2), 'morning raises wander weight');

  const evening = makeContext({ search: '?seed=12345&hour=18' });
  run(evening, 'careStats.stage = "adult"; needs.bond = 0;');
  const eveningWeights = run(evening, '({ sniff: behaviorWeight("sniff", BEHAVIORS.sniff), wiggle: behaviorWeight("wiggle", BEHAVIORS.wiggle) })');
  assert(near(eveningWeights.sniff, 2.6), 'evening raises sniff weight');
  assert(near(eveningWeights.wiggle, 2.08), 'evening raises wiggle weight');

  const night = makeContext({ search: '?seed=12345&hour=23' });
  run(night, 'careStats.stage = "adult"; needs.bond = 0;');
  const nightWeights = run(night, '({ sleep: behaviorWeight("sleep", BEHAVIORS.sleep), zoomies: behaviorWeight("zoomies", BEHAVIORS.zoomies) })');
  assert(near(nightWeights.sleep, 1.8), 'night raises sleep weight');
  assert(near(nightWeights.zoomies, 0.3), 'night lowers zoomies weight');
}

function testClockHourIsUsedWithoutOverride() {
  const localEvening = new Date(2026, 6, 7, 18, 0, 0).getTime();
  const context = makeContext({ now: localEvening, search: '?seed=12345' });
  assert(run(context, 'currentHour()') === 18, 'normal visits use the device clock hour');
  assert(run(context, 'dayPeriod()') === 'evening', 'normal visits select the matching day period');
}

function testProductionUiHasNoGrowthBypass() {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const boot = fs.readFileSync(path.join(root, 'src/boot.js'), 'utf8');
  assert(!html.includes('debugAdultBtn'), 'production markup does not expose a growth bypass');
  assert(!boot.includes('growAdultForDebug'), 'production bindings do not persist debug growth');
}

function testEggCannotOpenOutingMenu() {
  const context = makeContext({ search: '?seed=12345&hour=12' });
  run(context, 'updateGauges()');
  assert(run(context, 'memoryLine.textContent') === '알을 살살 문질러 봐', 'fresh egg tells the player how to reach the first reward');
  const sign = run(context, 'outingSignAnchor()');
  assert(run(context, `outingSignHitTest(${sign.x}, ${sign.y})`) === false, 'egg-stage outing sign is not interactive');
  run(context, 'openOutingSheet()');
  assert(run(context, 'outingSheet.hidden') === true, 'egg-stage assistive outing control cannot open the menu');
}

function testDailyGreetingAndAnniversary() {
  const now = Date.UTC(2026, 6, 7, 8);
  const adoptedAt = now - 6 * 86400000;
  const context = makeContext({ now, search: '?seed=12345&hour=8' });
  run(context, `localStorage.setItem('protopet-care-v1', ${JSON.stringify(savedCare({ now, adoptedAt, lastDailyLoginDay: -1 }))}); loadCareState();`);
  const state = run(context, '({ caption: pet.caption, memory: careStats.lastCareLine, together: togetherDays(), mask: careStats.anniversaryMask, saved: JSON.parse(localStorage.getItem("protopet-care-v1")) })');
  assert(state.together === 7, 'togetherDays counts the adoption day as day one');
  assert(state.caption === '같이 산 지 7일', 'anniversary caption wins on first daily login');
  assert(state.memory === '함께 7일째 되는 날', 'anniversary memory is recorded');
  assert(state.mask === 1, 'anniversary is marked deterministically');
  assert(state.saved.lastDailyLoginDay === run(context, 'dayStamp(nowTime())'), 'daily login day is saved');
}

function testNightReturnSleepsAndWakeCaption() {
  const now = Date.UTC(2026, 6, 7, 23);
  const context = makeContext({ now, search: '?seed=12345&hour=23' });
  run(context, `localStorage.setItem('protopet-care-v1', ${JSON.stringify(savedCare({ now, adoptedAt: now, lastDailyLoginDay: -1, bond: 0.8 }))}); loadCareState();`);
  let state = run(context, '({ behavior: pet.behavior, caption: pet.caption })');
  assert(state.behavior === 'sleep', 'night return starts asleep');
  assert(state.caption === '안 자?', 'night first login uses the planned greeting');
  run(context, 'surprisePet();');
  state = run(context, '({ caption: pet.caption })');
  assert(state.caption === '…밤임', 'waking a sleeping night pet uses the planned caption');
}

function testWelcomeBackRunsToBottomCenter() {
  const now = Date.UTC(2026, 6, 7, 12);
  const context = makeContext({ now, search: '?seed=12345&hour=12' });
  run(context, `localStorage.setItem('protopet-care-v1', ${JSON.stringify(savedCare({ now, adoptedAt: now, lastDailyLoginDay: run(context, 'dayStamp(nowTime())'), bond: 0.5 }))}); loadCareState();`);
  let state = run(context, '({ homecoming: homecoming.active, caption: pet.caption, behavior: pet.behavior })');
  assert(state.homecoming === true, 'bonded return starts welcome-back run');
  assert(state.caption === '왔다!!', 'welcome-back uses planned caption');
  for (let i = 0; i < 300 && run(context, 'homecoming.active'); i++) run(context, 'update(1 / 60)');
  state = run(context, '({ x: pet.x, y: pet.y, behavior: pet.behavior, active: homecoming.active })');
  assert(Math.abs(state.x - 400) < 36 && Math.abs(state.y - 561.6) < 36, 'pet runs to the bottom center');
  assert(state.behavior === 'wiggle' && state.active === false, 'pet wiggles after arriving');
}

function testBellyRubRewardAndMilestone() {
  const context = makeContext({ search: '?seed=12345&hour=12' });
  run(context, 'careStats.stage = "adult"; needs.bond = 0.7; setBehavior("belly"); recordPetting(8);');
  const state = run(context, '({ caption: pet.caption, bond: needs.bond, hearts: particles.filter(p => p.type === "heart").length })');
  assert(state.caption === '믿으니까 보여줘', 'belly rub uses planned caption');
  assert(state.bond > 0.7, 'belly rub grants a small bond gain');
  assert(state.hearts >= 5, 'belly rub emits five hearts');

  run(context, 'needs.bond = 0.949; bondMilestone = bondStage(needs.bond); affectNeed("bond", 0.002);');
  const milestone = run(context, '({ caption: pet.caption, memory: careStats.lastCareLine })');
  assert(milestone.caption === '평생 껌딱지', '0.95 bond milestone is added');
  assert(milestone.memory === '평생 껌딱지', '0.95 milestone is remembered');
}

testHourOverrideSelectsPeriodAndWeights();
testClockHourIsUsedWithoutOverride();
testProductionUiHasNoGrowthBypass();
testEggCannotOpenOutingMenu();
testDailyGreetingAndAnniversary();
testNightReturnSleepsAndWakeCaption();
testWelcomeBackRunsToBottomCenter();
testBellyRubRewardAndMilestone();
console.log('phase E harness passed');
