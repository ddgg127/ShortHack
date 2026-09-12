const requestText = document.querySelector('#requestText');
const charCount = document.querySelector('#charCount');
const analyzeButton = document.querySelector('#analyzeButton');
const exampleButton = document.querySelector('#exampleButton');
const emptyState = document.querySelector('#emptyState');
const resultContent = document.querySelector('#resultContent');
const sourceOptions = document.querySelectorAll('.source-option');
const toast = document.querySelector('#toast');
const menuButton = document.querySelector('#menuButton');
const sidebar = document.querySelector('.sidebar');
let currentSource = 'Почта';
let ticketCount = 3;

const example = 'Здравствуйте! После смены телефона не получается войти в личный кабинет. Код подтверждения приходит на старый номер, доступа к нему уже нет. Мне срочно нужна ведомость для деканата сегодня. Что делать?';

const demoAnalyze = (text) => {
  const lower = text.toLowerCase();
  const account = /войти|парол|аккаунт|кабинет|код подтверждения/.test(lower);
  const network = /wi.?fi|интернет|сеть|подключ/.test(lower);
  const urgent = /сроч|сегодня|немедленно|не могу работать/.test(lower);

  let category = 'Другое';
  let missing = 'Контактные данные и точное время возникновения проблемы.';
  let action = 'Создать заявку и передать оператору первой линии.';
  if (account) {
    category = 'Учётная запись';
    missing = 'Логин или корпоративная почта для проверки учётной записи.';
    action = 'Запросить логин и передать заявку команде управления доступом.';
  } else if (network) {
    category = 'Сеть и подключения';
    missing = 'Устройство, корпус и название сети, к которой подключается пользователь.';
    action = 'Создать заявку для сетевой команды и запросить параметры подключения.';
  }

  const trimmed = text.trim().replace(/\s+/g, ' ');
  const summary = trimmed.length > 145 ? `${trimmed.slice(0, 142)}…` : trimmed;
  return {
    summary,
    category,
    priority: urgent ? 'Высокий' : 'Обычный',
    missing,
    action,
    draft: account
      ? 'Здравствуйте! Поможем восстановить доступ. Пожалуйста, пришлите логин или корпоративную почту — мы проверим учётную запись и предложим безопасный способ сменить номер.'
      : 'Здравствуйте! Мы зафиксировали обращение. Пожалуйста, уточните недостающие данные — это поможет быстрее передать заявку нужной команде.'
  };
};

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
};

const updateCount = () => {
  charCount.textContent = `${requestText.value.length} / 2000`;
};

const renderAnalysis = (text) => {
  const result = demoAnalyze(text);
  document.querySelector('#summaryValue').textContent = result.summary;
  document.querySelector('#categoryValue').textContent = result.category;
  document.querySelector('#priorityValue').innerHTML = `<i></i> ${result.priority}`;
  document.querySelector('#priorityValue').style.color = result.priority === 'Высокий' ? 'var(--warning)' : 'var(--accent)';
  document.querySelector('#missingValue').textContent = result.missing;
  document.querySelector('#actionValue').textContent = result.action;
  document.querySelector('#draftValue').textContent = result.draft;
  emptyState.hidden = true;
  resultContent.hidden = false;
  return result;
};

const createLocalTicket = () => {
  const summary = document.querySelector('#summaryValue').textContent;
  if (!summary) throw new Error('Сначала проанализируйте обращение');
  ticketCount += 1;
  const id = String(24 + ticketCount - 3).padStart(3, '0');
  const row = document.createElement('article');
  row.className = 'request-row';
  const idCell = document.createElement('span');
  idCell.className = 'request-id';
  idCell.textContent = `#${id}`;
  const details = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = `${summary.slice(0, 68)}${summary.length > 68 ? '…' : ''}`;
  const meta = document.createElement('span');
  meta.textContent = `${document.querySelector('#categoryValue').textContent} · ${currentSource}`;
  details.append(title, meta);
  const status = document.createElement('span');
  status.className = 'status-pill new';
  status.textContent = 'Новая';
  const time = document.createElement('span');
  time.className = 'request-time';
  time.textContent = 'только что';
  row.append(idCell, details, status, time);
  document.querySelector('#requestList').prepend(row);
  document.querySelector('#navCount').textContent = ticketCount;
  return id;
};

requestText.addEventListener('input', updateCount);

exampleButton.addEventListener('click', () => {
  requestText.value = example;
  updateCount();
  requestText.focus();
});

sourceOptions.forEach((option) => {
  option.addEventListener('click', () => {
    sourceOptions.forEach((item) => item.classList.remove('active'));
    option.classList.add('active');
    currentSource = option.dataset.source;
  });
});

analyzeButton.addEventListener('click', () => {
  const text = requestText.value.trim();
  if (!text) {
    requestText.focus();
    showToast('Сначала добавьте текст обращения');
    return;
  }

  analyzeButton.disabled = true;
  analyzeButton.querySelector('span').textContent = 'Разбираем обращение…';
  window.setTimeout(() => {
    renderAnalysis(text);
    analyzeButton.disabled = false;
    analyzeButton.querySelector('span').textContent = 'Проанализировать ещё раз';
  }, 700);
});

document.querySelector('#editDraft').addEventListener('click', (event) => {
  const draft = document.querySelector('#draftValue');
  const editing = draft.contentEditable === 'true';
  draft.contentEditable = String(!editing);
  event.currentTarget.textContent = editing ? 'Редактировать' : 'Готово';
  if (!editing) draft.focus();
});

document.querySelector('#copyButton').addEventListener('click', async () => {
  const text = [
    document.querySelector('#summaryValue').textContent,
    document.querySelector('#categoryValue').textContent,
    document.querySelector('#priorityValue').textContent,
    document.querySelector('#actionValue').textContent
  ].join('\n');
  try {
    await navigator.clipboard.writeText(text);
    showToast('Результат скопирован');
  } catch {
    showToast('Не удалось скопировать автоматически');
  }
});

document.querySelector('#createButton').addEventListener('click', () => {
  const id = createLocalTicket();
  showToast(`Заявка #${id} создана локально`);
});

menuButton.addEventListener('click', () => sidebar.classList.toggle('open'));
document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => sidebar.classList.remove('open')));

const registerWebMcpTools = () => {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const toolLifecycle = new AbortController();

  const register = (tool) => {
    Promise.resolve(context.registerTool(tool, { signal: toolLifecycle.signal })).catch(() => {});
  };

  register({
    name: 'analyze_support_request',
    title: 'Разобрать обращение',
    description: 'Анализирует переданный текст локально в демо-режиме и показывает структурированный результат в интерфейсе.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', minLength: 1, maxLength: 2000 },
        source: { type: 'string', enum: ['Почта', 'Телефон'] }
      },
      required: ['text'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute(input) {
      if (!input || typeof input.text !== 'string' || !input.text.trim() || input.text.length > 2000) {
        throw new Error('Текст обращения должен содержать от 1 до 2000 символов');
      }
      requestText.value = input.text.trim();
      currentSource = input.source || 'Почта';
      sourceOptions.forEach((option) => option.classList.toggle('active', option.dataset.source === currentSource));
      updateCount();
      const result = renderAnalysis(requestText.value);
      return { category: result.category, priority: result.priority, nextAction: result.action };
    }
  });

  register({
    name: 'create_local_support_ticket',
    title: 'Создать локальную заявку',
    description: 'Создаёт демонстрационную заявку из результата анализа и добавляет её в видимый список на странице.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      const id = createLocalTicket();
      showToast(`Заявка #${id} создана локально`);
      return { id: `#${id}`, status: 'Новая', storage: 'local-demo' };
    }
  });
};

registerWebMcpTools();
