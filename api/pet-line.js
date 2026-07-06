'use strict';

const FALLBACK_LINES = ['생각 정리 안 됨', '방금 일 기억함', '나름 괜찮음'];

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

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ line: fallbackLine(), fallback: true });
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    response.status(200).json({ line: fallbackLine(), fallback: true });
    return;
  }

  try {
    const body = typeof request.body === 'object' && request.body ? request.body : {};
    const context = JSON.stringify({
      event: body.event,
      mood: body.mood,
      stage: body.stage,
      needs: body.needs,
      traits: body.traits,
      memory: body.memory,
    });
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
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
    const text = cleanLine(data?.content?.[0]?.text);
    response.status(200).json({ line: text || fallbackLine(), fallback: !text });
  } catch (_) {
    response.status(200).json({ line: fallbackLine(), fallback: true });
  }
};
