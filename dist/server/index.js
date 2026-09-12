const API_URL = 'https://ai.api.cloud.yandex.net/v1/chat/completions';
const MAX_TEXT_LENGTH = 2000;
const CATEGORIES = ['Учётная запись', 'Сеть и подключения', 'Оборудование', 'Образовательная платформа', 'Программное обеспечение', 'Другое'];
const PRIORITIES = ['Низкий', 'Обычный', 'Высокий'];

const systemPrompt = `Ты — ИИ-помощник первой линии технической поддержки университета.
Разбери обращение и верни только один JSON-объект без Markdown и пояснений.

Правила:
- summary: краткая суть проблемы на русском, одно предложение, до 160 символов;
- category: строго одно из значений: ${CATEGORIES.join(', ')};
- priority: "Высокий" только при явном срочном сроке, блокировке критической работы, риске безопасности или массовом сбое; "Низкий" для некритичных консультаций; иначе "Обычный";
- missing: конкретно перечисли сведения, которых не хватает. Несколько пунктов пронумеруй. Если всё есть, напиши "Дополнительные сведения не требуются.";
- nextAction: перечисли конкретные действия оператора. Несколько действий пронумеруй;
- draft: вежливый готовый ответ пользователю. Не обещай уже выполненные действия и не выдумывай факты;
- confidence: целое число от 0 до 100.

Схема объекта: {"summary":"...","category":"...","priority":"...","missing":"...","nextAction":"...","draft":"...","confidence":0}`;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
});

const cleanText = (value, fallback, maxLength) => {
  const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  return (text || fallback).slice(0, maxLength);
};

const formatActions = (value, fallback, maxLength) => {
  const items = (Array.isArray(value) ? value : [value])
    .flatMap((item) => typeof item === 'string' ? item.split(/\r?\n+|;\s+|\s+(?=\d+[.)]\s+)/) : [])
    .map((item) => item.replace(/^\s*(?:[-•]|\d+[.)])\s*/, '').trim().replace(/\s+/g, ' '))
    .filter(Boolean);
  if (!items.length) return fallback.slice(0, maxLength);
  return (items.length === 1 ? items[0] : items.map((item, index) => `${index + 1}. ${item}`).join('\n')).slice(0, maxLength);
};

const normalizeResult = (raw, description, source) => ({
  description,
  summary: cleanText(raw.summary, 'Обращение требует ручного разбора.', 180),
  category: CATEGORIES.includes(raw.category) ? raw.category : 'Другое',
  priority: PRIORITIES.includes(raw.priority) ? raw.priority : 'Обычный',
  missing: formatActions(raw.missing, 'Дополнительные сведения не требуются.', 600),
  nextAction: formatActions(raw.nextAction, 'Передать обращение оператору первой линии.', 600),
  draft: cleanText(raw.draft, 'Здравствуйте! Мы получили ваше обращение и приступили к его обработке.', 1200),
  source,
  confidence: Math.max(0, Math.min(100, Math.round(Number(raw.confidence) || 0)))
});

const parseModelJson = (content) => JSON.parse((typeof content === 'string' ? content : '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());
const callYandex = (env, payload, scheme = 'Bearer') => fetch(API_URL, {
  method: 'POST',
  headers: { authorization: `${scheme} ${env.YANDEX_API_KEY}`, 'content-type': 'application/json' },
  body: JSON.stringify(payload)
});

const solutionSelect = 'SELECT id, ticket_id AS ticketId, description, summary, category, priority, missing, next_action AS nextAction, draft, source, confidence, resolved_at AS resolvedAt FROM solved_requests ORDER BY resolved_at DESC LIMIT ?';
const solutionUpsert = 'INSERT INTO solved_requests (ticket_id, description, summary, category, priority, missing, next_action, draft, source, confidence, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(ticket_id) DO UPDATE SET description = excluded.description, summary = excluded.summary, category = excluded.category, priority = excluded.priority, missing = excluded.missing, next_action = excluded.next_action, draft = excluded.draft, source = excluded.source, confidence = excluded.confidence, resolved_at = excluded.resolved_at';

const getSolutions = async (env, limit = 100) => {
  if (!env.DB) throw new Error('База решений не подключена.');
  const result = await env.DB.prepare(solutionSelect).bind(Math.max(1, Math.min(200, limit))).all();
  return result.results || [];
};

const normalizeSolution = (item) => {
  if (!item || typeof item !== 'object') throw new Error('Некорректная заявка.');
  const ticketId = cleanText(item.ticketId, '', 100);
  const description = cleanText(item.description, '', MAX_TEXT_LENGTH);
  if (!ticketId || !description) throw new Error('У заявки отсутствует идентификатор или текст.');
  return {
    ticketId,
    description,
    summary: cleanText(item.summary, 'Решённое обращение', 180),
    category: CATEGORIES.includes(item.category) ? item.category : 'Другое',
    priority: PRIORITIES.includes(item.priority) ? item.priority : 'Обычный',
    missing: cleanText(item.missing, 'Дополнительные сведения не требуются.', 600),
    nextAction: cleanText(item.nextAction, 'Решение выполнено оператором.', 600),
    draft: cleanText(item.draft, 'Ответ не сохранён.', 1200),
    source: item.source === 'Телефон' ? 'Телефон' : 'Почта',
    confidence: Math.max(0, Math.min(100, Math.round(Number(item.confidence) || 0))),
    resolvedAt: Number.isFinite(Date.parse(item.resolvedAt)) ? new Date(item.resolvedAt).toISOString() : new Date().toISOString()
  };
};

const bindSolution = (env, item) => env.DB.prepare(solutionUpsert).bind(
  item.ticketId, item.description, item.summary, item.category, item.priority, item.missing,
  item.nextAction, item.draft, item.source, item.confidence, item.resolvedAt
);

const stopWords = new Set(['это', 'как', 'что', 'для', 'или', 'при', 'мне', 'нужно', 'после', 'через', 'уже', 'нет', 'всё', 'его', 'она', 'они', 'также', 'пожалуйста']);
const tokens = (text) => new Set(String(text || '').toLowerCase().match(/[а-яёa-z0-9]{3,}/g)?.filter((word) => !stopWords.has(word)) || []);
const similarity = (query, candidate) => {
  const a = tokens(query);
  const b = tokens(candidate);
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  a.forEach((word) => { if (b.has(word)) overlap += 1; });
  return overlap / Math.sqrt(a.size * b.size);
};

const findSimilarSolutions = async (env, description) => {
  if (!env.DB) return [];
  try {
    return (await getSolutions(env, 100))
      .map((item) => ({ item, score: similarity(description, `${item.description} ${item.summary} ${item.category}`) }))
      .filter(({ score }) => score >= 0.12)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ item }) => item);
  } catch (error) {
    console.error('Solution lookup failed', error instanceof Error ? error.message : error);
    return [];
  }
};

const analyze = async (request, env) => {
  if (!env.YANDEX_API_KEY || !env.YANDEX_MODEL_URI) return json({ error: 'ИИ ещё не настроен: администратору нужно указать модель Yandex AI.' }, 503);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'Некорректный формат запроса.' }, 400); }
  const description = typeof input?.text === 'string' ? input.text.trim() : '';
  const source = input?.source === 'Телефон' ? 'Телефон' : 'Почта';
  if (!description || description.length > MAX_TEXT_LENGTH) return json({ error: `Текст должен содержать от 1 до ${MAX_TEXT_LENGTH} символов.` }, 400);
  if (env.API_RATE_LIMITER) {
    const { success } = await env.API_RATE_LIMITER.limit({ key: request.headers.get('cf-connecting-ip') || 'unknown-client' });
    if (!success) return json({ error: 'Слишком много запросов. Подождите минуту и попробуйте снова.' }, 429);
  }

  const matches = await findSimilarSolutions(env, description);
  const knowledge = matches.length
    ? `\n\nПохожие ранее решённые обращения (используй только как справку, если они действительно релевантны; не утверждай, что действия уже выполнены):\n${matches.map((item, index) => `${index + 1}. Проблема: ${item.summary}\nРешение/ответ: ${item.draft}`).join('\n').slice(0, 3000)}`
    : '';
  const payload = {
    model: env.YANDEX_MODEL_URI,
    temperature: 0.1,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Источник: ${source}\nОбращение:\n${description}${knowledge}` }
    ]
  };

  try {
    let upstream = await callYandex(env, payload, 'Bearer');
    if (upstream.status === 401 || upstream.status === 403) upstream = await callYandex(env, payload, 'Api-Key');
    if (!upstream.ok) {
      const requestId = upstream.headers.get('x-request-id');
      const suffix = requestId ? ` Код запроса: ${requestId}.` : '';
      if (upstream.status === 401 || upstream.status === 403) return json({ error: `Yandex AI отклонил доступ. Проверьте права API-ключа и каталог.${suffix}` }, 502);
      if (upstream.status === 429) return json({ error: 'Лимит запросов к Yandex AI временно исчерпан. Повторите позже.' }, 429);
      return json({ error: `Yandex AI временно недоступен (HTTP ${upstream.status}).${suffix}` }, 502);
    }
    const response = await upstream.json();
    return json({
      ...normalizeResult(parseModelJson(response?.choices?.[0]?.message?.content), description, source),
      knowledgeMatches: matches.map((item) => ({ ticketId: item.ticketId, summary: item.summary }))
    });
  } catch (error) {
    console.error('Yandex AI analysis failed', error instanceof Error ? error.message : error);
    return json({ error: 'Не удалось получить структурированный ответ от Yandex AI. Повторите попытку.' }, 502);
  }
};

const handleSolutions = async (request, env, pathname) => {
  if (!env.DB) return json({ error: 'База решений пока недоступна.' }, 503);
  try {
    if (request.method === 'GET' && pathname === '/api/solutions') return json({ items: await getSolutions(env) });
    if (request.method === 'POST' && pathname === '/api/solutions') {
      const item = normalizeSolution(await request.json());
      await bindSolution(env, item).run();
      return json({ ok: true, item }, 201);
    }
    if (request.method === 'POST' && pathname === '/api/solutions/sync') {
      const body = await request.json();
      if (!Array.isArray(body?.items) || body.items.length > 100) return json({ error: 'Передайте массив не более чем из 100 заявок.' }, 400);
      const items = body.items.map(normalizeSolution);
      if (items.length) await env.DB.batch(items.map((item) => bindSolution(env, item)));
      return json({ ok: true, count: items.length });
    }
    return json({ error: 'Метод не поддерживается.' }, 405);
  } catch (error) {
    console.error('Solutions request failed', error instanceof Error ? error.message : error);
    const badInput = error instanceof SyntaxError || String(error?.message || '').startsWith('Некоррект') || String(error?.message || '').startsWith('У заявки');
    return json({ error: error instanceof Error ? error.message : 'Ошибка базы решений.' }, badInput ? 400 : 500);
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return json({ ok: true, configured: Boolean(env.YANDEX_API_KEY && env.YANDEX_MODEL_URI), databaseConfigured: Boolean(env.DB) });
    }
    if (url.pathname === '/api/analyze') {
      if (request.method !== 'POST') return json({ error: 'Метод не поддерживается.' }, 405);
      return analyze(request, env);
    }
    if (url.pathname === '/api/solutions' || url.pathname === '/api/solutions/sync') return handleSolutions(request, env, url.pathname);
    return env.ASSETS.fetch(request);
  }
};
