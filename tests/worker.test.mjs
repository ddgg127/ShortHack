import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';

const assets = { fetch: () => new Response('asset') };

test('health reports missing runtime configuration', async () => {
  const response = await worker.fetch(new Request('https://example.test/api/health'), { ASSETS: assets });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, configured: false });
});

test('analysis returns a normalized structured result', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify({
      summary: 'Не удаётся войти в личный кабинет.',
      category: 'Учётная запись',
      priority: 'Высокий',
      missing: ['Корпоративная почта.', 'Номер телефона.'],
      nextAction: 'Проверить учётную запись.; Передать заявку оператору.',
      draft: 'Здравствуйте! Пришлите корпоративную почту.',
      confidence: 93
    }) } }]
  }), { status: 200, headers: { 'content-type': 'application/json' } });

  try {
    const request = new Request('https://example.test/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Не могу войти, доступ нужен сегодня.', source: 'Почта' })
    });
    const response = await worker.fetch(request, {
      ASSETS: assets,
      YANDEX_API_KEY: 'test-key',
      YANDEX_MODEL_URI: 'gpt://folder/model/latest'
    });
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.category, 'Учётная запись');
    assert.equal(result.confidence, 93);
    assert.equal(result.description, 'Не могу войти, доступ нужен сегодня.');
    assert.equal(result.missing, '1. Корпоративная почта.\n2. Номер телефона.');
    assert.equal(result.nextAction, '1. Проверить учётную запись.\n2. Передать заявку оператору.');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('analysis rejects an oversized request before calling the model', async () => {
  const request = new Request('https://example.test/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'a'.repeat(2001) })
  });
  const response = await worker.fetch(request, {
    ASSETS: assets,
    YANDEX_API_KEY: 'test-key',
    YANDEX_MODEL_URI: 'gpt://folder/model/latest'
  });
  assert.equal(response.status, 400);
});
