'use strict';

const handler = require('../api/pet-line.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function responseRecorder() {
  return {
    statusCode: 0,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}

async function testMethodBoundary() {
  const response = responseRecorder();
  await handler({ method: 'GET' }, response);
  assert(response.statusCode === 405, 'non-POST requests return 405');
  assert(response.headers.allow === 'POST', 'method rejection advertises POST');
  assert(response.body && response.body.fallback === true, 'method rejection keeps a safe fallback line');
}

async function testUpstreamRequestIsBoundedAndTimedOut() {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  const previousFetch = global.fetch;
  process.env.ANTHROPIC_API_KEY = 'test-key';
  let upstreamOptions = null;
  global.fetch = async (_url, options) => {
    upstreamOptions = options;
    return { ok: true, json: async () => ({ content: [{ text: '나름 괜찮음' }] }) };
  };
  try {
    const response = responseRecorder();
    await handler({
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.12' },
      body: {
        event: 'battle_win',
        mood: 'content',
        stage: 'adult',
        needs: { hunger: 0.8, energy: 0.7, bond: 0.9 },
        traits: ['cuddly'],
        memory: '가'.repeat(4000),
      },
    }, response);
    const payload = JSON.parse(upstreamOptions.body);
    const context = payload.messages[0].content;
    assert(upstreamOptions.signal, 'upstream request has a timeout signal');
    assert(context.length < 1000, 'upstream context is bounded at the server boundary');
    assert(response.statusCode === 200 && response.body.line === '나름 괜찮음', 'bounded request still returns the generated line');
  } finally {
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
    global.fetch = previousFetch;
  }
}

async function testMissingKeyUsesFallbackWithoutCallingUpstream() {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  const previousFetch = global.fetch;
  delete process.env.ANTHROPIC_API_KEY;
  global.fetch = async () => { throw new Error('upstream should not be called'); };
  try {
    const response = responseRecorder();
    await handler({ method: 'POST', headers: { 'content-type': 'application/json' }, body: {} }, response);
    assert(response.statusCode === 200, 'missing key remains a usable local response');
    assert(response.body && response.body.fallback === true, 'missing key marks the line as fallback');
  } finally {
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
    global.fetch = previousFetch;
  }
}

async function testRejectsUnsupportedMediaType() {
  const response = responseRecorder();
  await handler({ method: 'POST', headers: { 'content-type': 'text/plain' }, body: {} }, response);
  assert(response.statusCode === 415, 'non-JSON POST requests are rejected before model work');
}

async function testRateLimitsRepeatedModelCalls() {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  const previousFetch = global.fetch;
  process.env.ANTHROPIC_API_KEY = 'test-key';
  global.fetch = async () => ({ ok: true, json: async () => ({ content: [{ text: '나름 괜찮음' }] }) });
  try {
    let lastResponse = null;
    for (let index = 0; index < 7; index += 1) {
      lastResponse = responseRecorder();
      await handler({
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.42' },
        body: { event: 'rate_limit_test' },
      }, lastResponse);
    }
    assert(lastResponse.statusCode === 429, 'repeated billable calls are rate limited');
    assert(Number(lastResponse.headers['retry-after']) > 0, 'rate limit response tells the client when to retry');
  } finally {
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
    global.fetch = previousFetch;
  }
}

async function testUnsafeGeneratedVoiceFallsBack() {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  const previousFetch = global.fetch;
  process.env.ANTHROPIC_API_KEY = 'test-key';
  global.fetch = async () => ({ ok: true, json: async () => ({ content: [{ text: '안녕하세요 레벨 업 😀.' }] }) });
  try {
    const response = responseRecorder();
    await handler({
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.77' },
      body: { event: 'voice_guard_test' },
    }, response);
    assert(response.statusCode === 200 && response.body.fallback === true, 'off-voice model output is replaced with a safe fallback');
  } finally {
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
    global.fetch = previousFetch;
  }
}

async function testActualBodySizeIsBoundedWithoutHeader() {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  const previousFetch = global.fetch;
  process.env.ANTHROPIC_API_KEY = 'test-key';
  let upstreamCalls = 0;
  global.fetch = async () => {
    upstreamCalls += 1;
    return { ok: true, json: async () => ({ content: [{ text: '나름 괜찮음' }] }) };
  };
  try {
    const response = responseRecorder();
    await handler({
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.88' },
      body: { memory: '가'.repeat(50000) },
    }, response);
    assert(response.statusCode === 413, 'parsed JSON body is bounded even without content-length');
    assert(upstreamCalls === 0, 'oversized parsed body never reaches the model provider');
  } finally {
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
    global.fetch = previousFetch;
  }
}

(async () => {
  await testMethodBoundary();
  await testRejectsUnsupportedMediaType();
  await testUpstreamRequestIsBoundedAndTimedOut();
  await testMissingKeyUsesFallbackWithoutCallingUpstream();
  await testRateLimitsRepeatedModelCalls();
  await testUnsafeGeneratedVoiceFallsBack();
  await testActualBodySizeIsBoundedWithoutHeader();
  console.log('api harness passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
