'use strict';

const FALLBACK_LINES = ['생각 정리 안 됨', '방금 일 기억함', '나름 괜찮음'];
const UPSTREAM_TIMEOUT_MS = 8000;
const RATE_WINDOW_MS = 60000;
const RATE_LIMIT = 6;
const MAX_BODY_BYTES = 16384;
const rateBuckets = new Map();
let dailyUsage = { day: '', count: 0 };

function fallbackLine() {
  return FALLBACK_LINES[Math.floor(Math.random() * FALLBACK_LINES.length)];
}

function cleanLine(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[.!?。！？~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 28);
}

function safePetLine(value) {
  const line = cleanLine(value);
  if (!line || !/[가-힣]/.test(line)) return '';
  if (/\p{Extended_Pictographic}/u.test(line)) return '';
  if (/(안녕하세요|감사합니다|습니다|세요|레벨|퀘스트|게임|시스템|스탯|경험치|업적)/.test(line)) return '';
  const words = line.split(' ').filter(Boolean);
  return words.length >= 2 && words.length <= 6 ? line : '';
}

function requestHeader(request, name) {
  const headers = request && request.headers;
  if (!headers) return '';
  if (typeof headers.get === 'function') return headers.get(name) || '';
  return headers[name] || headers[name.toLowerCase()] || '';
}

function clientKey(request) {
  const forwarded = requestHeader(request, 'x-forwarded-for');
  const address = forwarded.split(',')[0].trim() || request?.socket?.remoteAddress || 'unknown';
  return String(address).slice(0, 80);
}

function bodyByteLength(body) {
  try {
    return Buffer.byteLength(JSON.stringify(body ?? {}), 'utf8');
  } catch (_) {
    return Number.POSITIVE_INFINITY;
  }
}

function rateLimitState(key, now = Date.now()) {
  const current = rateBuckets.get(key);
  const bucket = current && now - current.startedAt < RATE_WINDOW_MS
    ? current
    : { startedAt: now, count: 0 };
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (rateBuckets.size > 512) {
    for (const [storedKey, stored] of rateBuckets) {
      if (now - stored.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(storedKey);
    }
    while (rateBuckets.size > 512) rateBuckets.delete(rateBuckets.keys().next().value);
  }
  return {
    allowed: bucket.count <= RATE_LIMIT,
    retryAfter: Math.max(1, Math.ceil((bucket.startedAt + RATE_WINDOW_MS - now) / 1000)),
  };
}

function dailyLimitReached(now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10);
  if (dailyUsage.day !== day) dailyUsage = { day, count: 0 };
  const configured = Number(process.env.PET_LINE_DAILY_LIMIT);
  const limit = Number.isInteger(configured) && configured > 0 ? configured : 1000;
  if (dailyUsage.count >= limit) return true;
  dailyUsage.count += 1;
  return false;
}

function cleanContextText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function unitValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : null;
}

function requestContext(body) {
  const source = body && typeof body === 'object' ? body : {};
  const needs = source.needs && typeof source.needs === 'object' ? source.needs : {};
  const traits = Array.isArray(source.traits)
    ? source.traits.slice(0, 6).map(trait => cleanContextText(trait, 24)).filter(Boolean)
    : [];
  return JSON.stringify({
    event: cleanContextText(source.event, 48),
    mood: cleanContextText(source.mood, 32),
    stage: cleanContextText(source.stage, 16),
    needs: {
      hunger: unitValue(needs.hunger),
      energy: unitValue(needs.energy),
      bond: unitValue(needs.bond),
    },
    traits,
    memory: cleanContextText(source.memory, 240),
  });
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ line: fallbackLine(), fallback: true });
    return;
  }

  const contentType = requestHeader(request, 'content-type').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    response.status(415).json({ line: fallbackLine(), fallback: true });
    return;
  }
  const contentLength = Number(requestHeader(request, 'content-length'));
  if ((Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) || bodyByteLength(request.body) > MAX_BODY_BYTES) {
    response.status(413).json({ line: fallbackLine(), fallback: true });
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    response.status(200).json({ line: fallbackLine(), fallback: true });
    return;
  }

  const limit = rateLimitState(clientKey(request));
  if (!limit.allowed || dailyLimitReached()) {
    response.setHeader('Retry-After', String(limit.retryAfter));
    response.status(429).json({ line: fallbackLine(), fallback: true });
    return;
  }

  try {
    const context = requestContext(request.body);
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 24,
        system: [
          'Proto Pet Korean one-line voice.',
          'No honorifics. No game/system words. No emoji.',
          '2 to 6 Korean eojeol. No period. Use !! or … only if needed.',
          'First-person self-observation, short and slightly pathetic.',
        ].join(' '),
        messages: [{ role: 'user', content: context }],
      }),
    });
    if (!upstream.ok) throw new Error(`Anthropic ${upstream.status}`);
    const data = await upstream.json();
    const text = safePetLine(data?.content?.[0]?.text);
    response.status(200).json({ line: text || fallbackLine(), fallback: !text });
  } catch (_) {
    response.status(200).json({ line: fallbackLine(), fallback: true });
  }
};
