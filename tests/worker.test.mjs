import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';

const assets = { fetch: () => new Response('asset') };

test('health reports missing runtime configuration', async () => {
  const response = await worker.fetch(new Request('https://example.test/api/health'), { ASSETS: assets });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, configured: false, databaseConfigured: false });
});

const createDb = (initial = []) => {
  const rows = [...initial];
  const statement = (sql) => ({
    values: [],
    bind(...values) { this.values = values; return this; },
    async all() { return { results: rows.slice(0, this.values[0] || 100) }; },
    async run() {
      const [ticketId, description, summary, category, priority, missing, nextAction, draft, source, confidence, resolvedAt] = this.values;
      const item = { id: rows.length + 1, ticketId, description, summary, category, priority, missing, nextAction, draft, source, confidence, resolvedAt };
      const index = rows.findIndex((row) => row.ticketId === ticketId);
      if (index >= 0) rows[index] = { ...rows[index], ...item }; else rows.push(item);
      return { success: true };
    },
    sql
  });
  return {
    rows,
    prepare: statement,
    async batch(statements) { for (const item of statements) await item.run(); return statements.map(() => ({ success: true })); }
  };
};

test('solved requests can be synchronized and listed', async () => {
  const DB = createDb();
  const item = { ticketId: 'browser-22', description: 'Не приходит письмо сброса пароля', summary: 'Не приходит письмо восстановления.', category: 'Учётная запись', priority: 'Высокий', missing: 'Почта', nextAction: 'Проверить учётную запись', draft: 'Письмо отправлено повторно.', source: 'Почта', confidence: 95, resolvedAt: '2026-09-12T08:00:00.000Z' };
  const sync = await worker.fetch(new Request('https://example.test/api/solutions/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [item] }) }), { ASSETS: assets, DB });
  assert.equal(sync.status, 200);
  assert.equal((await sync.json()).count, 1);
  const list = await worker.fetch(new Request('https://example.test/api/solutions'), { ASSETS: assets, DB });
  assert.equal(list.status, 200);
  assert.equal((await list.json()).items[0].draft, 'Письмо отправлено повторно.');
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

test('analysis adds a similar solved answer to model context', async () => {
  const originalFetch = globalThis.fetch;
  let modelRequest;
  globalThis.fetch = async (_url, options) => {
    modelRequest = JSON.parse(options.body);
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ summary: 'Не приходит письмо восстановления.', category: 'Учётная запись', priority: 'Обычный', missing: 'Почта', nextAction: 'Проверить учётную запись', draft: 'Проверим доставку письма.', confidence: 90 }) } }] }), { status: 200 });
  };
  const DB = createDb([{ ticketId: 'known', description: 'Не приходит письмо для восстановления пароля', summary: 'Не приходит письмо восстановления пароля.', category: 'Учётная запись', priority: 'Обычный', missing: 'Почта', nextAction: 'Проверить', draft: 'Проверьте папку Спам.', source: 'Почта', confidence: 90, resolvedAt: '2026-09-10T08:00:00.000Z' }]);
  try {
    const response = await worker.fetch(new Request('https://example.test/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'Не приходит письмо восстановления пароля', source: 'Почта' }) }), { ASSETS: assets, DB, YANDEX_API_KEY: 'key', YANDEX_MODEL_URI: 'model' });
    assert.equal(response.status, 200);
    assert.match(modelRequest.messages[1].content, /Проверьте папку Спам/);
    assert.equal((await response.json()).knowledgeMatches.length, 1);
  } finally { globalThis.fetch = originalFetch; }
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
