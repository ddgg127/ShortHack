const API_URL = 'https://ai.api.cloud.yandex.net/v1/chat/completions';
const MAX_TEXT_LENGTH = 2000;
const CATEGORIES = [
  'Учётная запись',
  'Сеть и подключения',
  'Оборудование',
  'Образовательная платформа',
  'Программное обеспечение',
  'Другое'
];
const PRIORITIES = ['Низкий', 'Обычный', 'Высокий'];

const systemPrompt = `Ты — ИИ-помощник первой линии технической поддержки университета.
Разбери обращение и верни только один JSON-объект без Markdown и пояснений.

Правила:
- summary: краткая суть проблемы на русском, одно предложение, до 160 символов;
- category: строго одно из значений: ${CATEGORIES.join(', ')};
- priority: "Высокий" только при явном срочном сроке, блокировке критической работы, риске безопасности или массовом сбое; "Низкий" для некритичных консультаций; иначе "Обычный";
- missing: конкретно перечисли сведения, которых не хватает. Если пунктов несколько, каждый начни с новой строки и пронумеруй: "1. ...", "2. ...". Если всё есть, напиши "Дополнительные сведения не требуются.";
- nextAction: перечисли конкретные действия оператора после получения обращения. Если действий несколько, каждое начни с новой строки и пронумеруй: "1. ...", "2. ...". Единственное действие оставь без номера;
- draft: вежливый готовый ответ пользователю. Не обещай уже выполненные действия и не выдумывай факты;
- confidence: целое число от 0 до 100, отражающее уверенность в классификации.

Схема объекта: {"summary":"...","category":"...","priority":"...","missing":"...","nextAction":"...","draft":"...","confidence":0}`;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  }
});

const cleanText = (value, fallback, maxLength) => {
  const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  return (text || fallback).slice(0, maxLength);
};

const formatActions = (value, fallback, maxLength) => {
  const sourceItems = Array.isArray(value) ? value : [value];
  const items = sourceItems
    .flatMap(item => typeof item === 'string'
      ? item.split(/\r?\n+|;\s+|\s+(?=\d+[.)]\s+)/)
      : [])
    .map(item => item.replace(/^\s*(?:[-•]|\d+[.)])\s*/, '').trim().replace(/\s+/g, ' '))
    .filter(Boolean);

  if (items.length === 0) return fallback.slice(0, maxLength);
  if (items.length === 1) return items[0].slice(0, maxLength);
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n').slice(0, maxLength);
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

const parseModelJson = (content) => {
  const value = typeof content === 'string' ? content : '';
  const withoutFence = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(withoutFence);
};

const callYandex = async (env, payload, authorizationScheme = 'Bearer') => fetch(API_URL, {
  method: 'POST',
  headers: {
    authorization: `${authorizationScheme} ${env.YANDEX_API_KEY}`,
    'content-type': 'application/json'
  },
  body: JSON.stringify(payload)
});

const analyze = async (request, env) => {
  if (!env.YANDEX_API_KEY || !env.YANDEX_MODEL_URI) {
    return json({ error: 'ИИ ещё не настроен: администратору нужно указать модель Yandex AI.' }, 503);
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'Некорректный формат запроса.' }, 400);
  }

  const description = typeof input?.text === 'string' ? input.text.trim() : '';
  const source = input?.source === 'Телефон' ? 'Телефон' : 'Почта';
  if (!description || description.length > MAX_TEXT_LENGTH) {
    return json({ error: `Текст должен содержать от 1 до ${MAX_TEXT_LENGTH} символов.` }, 400);
  }

  const payload = {
    model: env.YANDEX_MODEL_URI,
    temperature: 0.1,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Источник: ${source}\nОбращение:\n${description}` }
    ]
  };

  try {
    let upstream = await callYandex(env, payload, 'Bearer');
    if (upstream.status === 401 || upstream.status === 403) {
      upstream = await callYandex(env, payload, 'Api-Key');
    }

    if (!upstream.ok) {
      const requestId = upstream.headers.get('x-request-id');
      const suffix = requestId ? ` Код запроса: ${requestId}.` : '';
      if (upstream.status === 401 || upstream.status === 403) {
        return json({ error: `Yandex AI отклонил доступ. Проверьте права API-ключа и каталог.${suffix}` }, 502);
      }
      if (upstream.status === 429) {
        return json({ error: 'Лимит запросов к Yandex AI временно исчерпан. Повторите позже.' }, 429);
      }
      return json({ error: `Yandex AI временно недоступен (HTTP ${upstream.status}).${suffix}` }, 502);
    }

    const response = await upstream.json();
    const content = response?.choices?.[0]?.message?.content;
    return json(normalizeResult(parseModelJson(content), description, source));
  } catch (error) {
    console.error('Yandex AI analysis failed', error instanceof Error ? error.message : error);
    return json({ error: 'Не удалось получить структурированный ответ от Yandex AI. Повторите попытку.' }, 502);
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return json({ ok: true, configured: Boolean(env.YANDEX_API_KEY && env.YANDEX_MODEL_URI) });
    }
    if (url.pathname === '/api/analyze') {
      if (request.method !== 'POST') return json({ error: 'Метод не поддерживается.' }, 405);
      return analyze(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
