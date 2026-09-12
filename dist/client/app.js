const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const STORAGE_KEY = 'line-demo-tickets-v2';
const LEGACY_STORAGE_KEY = 'pulse-demo-tickets-v2';
const THEME_STORAGE_KEY = 'line-theme';
const THEMES = {
  light: 'Светлая', dark: 'Тёмная', graphite: 'Серо-чёрная',
  sber: 'Сбер', polar: 'Полярная ночь', ember: 'Тёплый графит'
};

const seedTickets = [
  {
    id: 24,
    description: 'В личном кабинете преподавателя не загружается ведомость группы ББИ-25-1. После выбора дисциплины страница остаётся пустой.',
    summary: 'Не загружается ведомость выбранной учебной группы.',
    category: 'Образовательная платформа', priority: 'Высокий', status: 'В работе',
    missing: 'Название дисциплины, браузер и время последней попытки.',
    nextAction: 'Проверить доступность сервиса и передать данные команде образовательной платформы.',
    draft: 'Здравствуйте! Мы уже проверяем загрузку ведомости. Уточните, пожалуйста, название дисциплины, браузер и время последней попытки входа.',
    source: 'Почта', confidence: 96, date: '2026-09-12T08:48:00'
  },
  {
    id: 23,
    description: 'Ноутбук видит корпоративную сеть, но подключиться к Wi-Fi в главном корпусе не получается. Появляется сообщение об ошибке авторизации.',
    summary: 'Не удаётся подключиться к корпоративному Wi-Fi.',
    category: 'Сеть и подключения', priority: 'Обычный', status: 'Новая',
    missing: 'Модель устройства, операционная система и название точки доступа.',
    nextAction: 'Запросить параметры устройства и передать заявку сетевой команде.',
    draft: 'Здравствуйте! Подскажите модель устройства, версию операционной системы и название Wi-Fi сети. Это поможет проверить настройки подключения.',
    source: 'Телефон', confidence: 91, date: '2026-09-12T08:26:00'
  },
  {
    id: 22,
    description: 'Забыл пароль от личного кабинета, восстановление через почту не приходит. Нужен доступ к расписанию на сегодня.',
    summary: 'Не приходит письмо для восстановления пароля.',
    category: 'Учётная запись', priority: 'Высокий', status: 'Решена',
    missing: 'Корпоративная почта пользователя.',
    nextAction: 'Проверить учётную запись и запустить повторную отправку письма.',
    draft: 'Здравствуйте! Доступ восстановлен, повторное письмо отправлено. Проверьте папку «Спам», если сообщение не появится во входящих.',
    source: 'Почта', confidence: 98, date: '2026-09-12T07:55:00'
  },
  {
    id: 21,
    description: 'Принтер в кабинете 412 печатает пустые листы, замена картриджа не помогла. Нужно распечатать документы к совещанию.',
    summary: 'Принтер печатает пустые листы после замены картриджа.',
    category: 'Оборудование', priority: 'Обычный', status: 'В работе',
    missing: 'Модель принтера и инвентарный номер.',
    nextAction: 'Назначить выезд специалиста по оборудованию.',
    draft: 'Здравствуйте! Мы направим специалиста в кабинет 412. Пришлите, пожалуйста, модель и инвентарный номер принтера.',
    source: 'Телефон', confidence: 89, date: '2026-09-11T16:40:00'
  },
  {
    id: 20,
    description: 'Проектор в аудитории включается, но не показывает изображение с ноутбука через HDMI. Кабель подключён, источник выбран.',
    summary: 'Проектор не получает изображение по HDMI.',
    category: 'Оборудование', priority: 'Низкий', status: 'Новая',
    missing: 'Номер аудитории и модель проектора.',
    nextAction: 'Проверить кабель и вход проектора на месте.',
    draft: 'Здравствуйте! Уточните номер аудитории и модель проектора. Специалист проверит подключение и HDMI-вход.',
    source: 'Почта', confidence: 87, date: '2026-09-11T14:12:00'
  },
  {
    id: 19,
    description: 'В курсе по аналитике пропала кнопка отправки домашнего задания. Срок сдачи завтра, файл уже подготовлен.',
    summary: 'Нет кнопки отправки домашнего задания в курсе.',
    category: 'Образовательная платформа', priority: 'Высокий', status: 'Решена',
    missing: 'Ссылка на курс и номер задания.',
    nextAction: 'Проверить сроки и настройки публикации задания.',
    draft: 'Здравствуйте! Доступ к отправке восстановлен. Обновите страницу курса и попробуйте загрузить файл повторно.',
    source: 'Почта', confidence: 94, date: '2026-09-10T11:30:00'
  }
];

const cloneSeed = () => seedTickets.map((ticket) => ({ ...ticket }));
const loadTickets = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY));
    return Array.isArray(saved) && saved.length ? saved : cloneSeed();
  } catch {
    return cloneSeed();
  }
};

let tickets = loadTickets();
let currentSource = 'Почта';
let currentAnalysis = null;
let editingTicketId = null;
let lastFocusedElement = null;

const requestText = $('#requestText');
const charCount = $('#charCount');
const analyzeButton = $('#analyzeButton');
const emptyState = $('#emptyState');
const resultContent = $('#resultContent');
const sourceOptions = $$('.source-option');
const toast = $('#toast');
const modal = $('#editModal');
const example = 'Здравствуйте! После смены телефона не получается войти в личный кабинет. Код подтверждения приходит на старый номер, доступа к нему уже нет. Мне срочно нужна ведомость для деканата сегодня. Что делать?';

const persistTickets = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets)); } catch { /* демо доступно без хранилища */ }
};
const statusClass = (status) => ({ 'В работе': 'in-work', 'Решена': 'done', 'Новая': 'new' }[status] || 'new');
const priorityClass = (priority) => priority === 'Высокий' ? 'priority-high' : priority === 'Низкий' ? 'priority-low' : '';
const ticketNumber = (id) => `#${String(id).padStart(3, '0')}`;
const formatDate = (date) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
const makeElement = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const editIcon = () => '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 16-.8 4.8L8 20l11-11-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/></svg>';

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
};

const themeButton = $('#themeButton');
const themeMenu = $('#themeMenu');
const themeOptions = $$('[data-theme-option]');
const currentTheme = () => THEMES[document.documentElement.dataset.theme] ? document.documentElement.dataset.theme : 'graphite';
const closeThemeMenu = () => {
  themeMenu.hidden = true;
  themeButton.setAttribute('aria-expanded', 'false');
};
const syncThemeUi = () => {
  const selected = currentTheme();
  $('#themeButtonLabel').textContent = THEMES[selected];
  themeButton.setAttribute('aria-label', `Изменить тему. Сейчас: ${THEMES[selected]}`);
  themeOptions.forEach((option) => {
    const active = option.dataset.themeOption === selected;
    option.classList.toggle('active', active);
    option.setAttribute('aria-checked', String(active));
  });
};
const setTheme = (theme) => {
  if (!THEMES[theme]) return;
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* тема работает и без хранилища */ }
  syncThemeUi();
  closeThemeMenu();
  showToast(`Тема: ${THEMES[theme]}`);
};

themeButton.addEventListener('click', () => {
  const opening = themeMenu.hidden;
  themeMenu.hidden = !opening;
  themeButton.setAttribute('aria-expanded', String(opening));
  if (opening) themeOptions.find((option) => option.classList.contains('active'))?.focus();
});
themeOptions.forEach((option) => option.addEventListener('click', () => setTheme(option.dataset.themeOption)));
document.addEventListener('click', (event) => {
  if (!event.target.closest('.theme-control')) closeThemeMenu();
});

const requestAnalysis = async (text, source = currentSource) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, source })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Не удалось выполнить анализ.');
  return result;
};

const renderAnalysis = (analysis) => {
  currentAnalysis = analysis;
  $('#summaryValue').textContent = currentAnalysis.summary;
  $('#categoryValue').textContent = currentAnalysis.category;
  $('#priorityValue').innerHTML = `<i></i> ${currentAnalysis.priority}`;
  $('#priorityValue').style.color = currentAnalysis.priority === 'Высокий' ? 'var(--warning)' : 'var(--accent)';
  $('#missingValue').textContent = currentAnalysis.missing;
  $('#actionValue').textContent = currentAnalysis.nextAction;
  $('#draftValue').textContent = currentAnalysis.draft;
  $('.confidence strong').textContent = `${currentAnalysis.confidence}%`;
  emptyState.hidden = true;
  $('#errorState').hidden = true;
  resultContent.hidden = false;
  return currentAnalysis;
};

const renderRecent = () => {
  const container = $('#requestList');
  container.replaceChildren();
  [...tickets].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3).forEach((ticket) => {
    const row = makeElement('article', 'request-row');
    row.append(makeElement('span', 'request-id', ticketNumber(ticket.id)));
    const details = makeElement('div');
    details.append(makeElement('strong', '', ticket.summary), makeElement('span', '', `${ticket.category} · ${ticket.source}`));
    row.append(details, makeElement('span', `status-pill ${statusClass(ticket.status)}`, ticket.status), makeElement('span', 'request-time', formatDate(ticket.date)));
    const edit = makeElement('button', 'row-edit-button');
    edit.type = 'button';
    edit.dataset.editId = ticket.id;
    edit.innerHTML = `${editIcon()}<span>Редактировать</span>`;
    edit.setAttribute('aria-label', `Редактировать заявку ${ticketNumber(ticket.id)}`);
    row.append(edit);
    container.append(row);
  });
  $('#navCount').textContent = tickets.length;
};

const filteredTickets = () => {
  const query = $('#requestSearch').value.trim().toLowerCase();
  const category = $('#categoryFilter').value;
  const priority = $('#priorityFilter').value;
  const status = $('#statusFilter').value;
  const result = tickets.filter((ticket) => {
    const haystack = `${ticket.description} ${ticket.summary} ${ticket.draft}`.toLowerCase();
    return (!query || haystack.includes(query))
      && (category === 'all' || ticket.category === category)
      && (priority === 'all' || ticket.priority === priority)
      && (status === 'all' || ticket.status === status);
  });
  const priorityRank = { 'Высокий': 0, 'Обычный': 1, 'Низкий': 2 };
  const sort = $('#sortSelect').value;
  result.sort((a, b) => {
    if (sort === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sort === 'alpha') return a.summary.localeCompare(b.summary, 'ru');
    if (sort === 'category') return a.category.localeCompare(b.category, 'ru') || a.summary.localeCompare(b.summary, 'ru');
    if (sort === 'priority') return priorityRank[a.priority] - priorityRank[b.priority] || new Date(b.date) - new Date(a.date);
    if (sort === 'confidence') return b.confidence - a.confidence;
    return new Date(b.date) - new Date(a.date);
  });
  return result;
};

const addTicketDetail = (container, label, value) => {
  const item = makeElement('div', 'ticket-detail');
  item.append(makeElement('span', '', label), makeElement('p', '', value));
  container.append(item);
};

const renderTicketGrid = () => {
  const visible = filteredTickets();
  const grid = $('#ticketGrid');
  grid.replaceChildren();
  visible.forEach((ticket) => {
    const card = makeElement('article', 'ticket-card');
    const header = makeElement('header', 'ticket-card-header');
    header.append(makeElement('span', 'ticket-number', ticketNumber(ticket.id)));
    const title = makeElement('div', 'ticket-card-title');
    title.append(makeElement('strong', '', ticket.summary), makeElement('span', '', `${ticket.source} · ${formatDate(ticket.date)}`));
    header.append(title);
    const edit = makeElement('button', 'ticket-edit-button');
    edit.type = 'button';
    edit.dataset.editId = ticket.id;
    edit.innerHTML = `${editIcon()}<span>Редактировать</span>`;
    header.append(edit);
    card.append(header, makeElement('p', 'ticket-card-description', ticket.description));
    const meta = makeElement('div', 'ticket-meta');
    meta.append(
      makeElement('span', 'meta-chip', ticket.category),
      makeElement('span', `meta-chip ${priorityClass(ticket.priority)}`, `Приоритет: ${ticket.priority}`),
      makeElement('span', `status-pill ${statusClass(ticket.status)}`, ticket.status),
      makeElement('span', 'meta-chip', `Уверенность ${ticket.confidence}%`)
    );
    card.append(meta);
    const details = makeElement('div', 'ticket-details');
    addTicketDetail(details, 'Нужно уточнить', ticket.missing || 'Дополнительные сведения не требуются.');
    addTicketDetail(details, 'Следующий шаг', ticket.nextAction);
    addTicketDetail(details, 'Черновик ответа', ticket.draft || 'Черновик пока не подготовлен.');
    card.append(details);
    const footer = makeElement('footer', 'ticket-card-footer');
    footer.append(makeElement('span', 'ticket-date', `Создана ${formatDate(ticket.date)}`));
    card.append(footer);
    grid.append(card);
  });
  $('#visibleCount').textContent = `${visible.length} ${visible.length === 1 ? 'заявка' : visible.length < 5 ? 'заявки' : 'заявок'}`;
  $('#totalRequests').textContent = tickets.length;
  const filtersCount = [$('#requestSearch').value.trim(), $('#categoryFilter').value !== 'all', $('#priorityFilter').value !== 'all', $('#statusFilter').value !== 'all'].filter(Boolean).length;
  $('#activeFilterLabel').textContent = filtersCount ? `Активных условий: ${filtersCount}` : 'Без фильтров';
  $('#noResults').hidden = visible.length !== 0;
};

const populateCategoryFilter = () => {
  const select = $('#categoryFilter');
  const current = select.value;
  const categories = [...new Set(tickets.map((ticket) => ticket.category))].sort((a, b) => a.localeCompare(b, 'ru'));
  select.replaceChildren(new Option('Все категории', 'all'), ...categories.map((category) => new Option(category, category)));
  select.value = categories.includes(current) ? current : 'all';
};
const renderAll = () => { populateCategoryFilter(); renderRecent(); renderTicketGrid(); };

const showView = (view, updateHash = true) => {
  const safeView = view === 'requests' ? 'requests' : 'workspace';
  $$('[data-view]').forEach((section) => { section.hidden = section.dataset.view !== safeView; });
  $$('[data-view-link]').forEach((link) => link.classList.toggle('active', link.dataset.viewLink === safeView));
  $('#pageEyebrow').textContent = safeView === 'requests' ? 'Работа с обращениями' : 'Рабочее пространство';
  $('#pageTitle').textContent = safeView === 'requests' ? 'Заявки' : 'Разбор обращения';
  document.title = safeView === 'requests' ? 'Заявки — Линия' : 'Линия — помощник поддержки';
  if (safeView === 'requests') renderTicketGrid();
  if (updateHash) history.replaceState(null, '', safeView === 'requests' ? '#requests' : '#workspace');
  $('.sidebar').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const openEditor = (id) => {
  const ticket = tickets.find((item) => item.id === Number(id));
  if (!ticket) return;
  editingTicketId = ticket.id;
  lastFocusedElement = document.activeElement;
  $('#modalTicketId').textContent = ticketNumber(ticket.id);
  $('#editDescription').value = ticket.description;
  $('#editSummary').value = ticket.summary;
  $('#editCategory').value = ticket.category;
  $('#editPriority').value = ticket.priority;
  $('#editMissing').value = ticket.missing;
  $('#editNextAction').value = ticket.nextAction;
  $('#editDraftText').value = ticket.draft;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  $('#editDescription').focus();
};
const closeEditor = () => {
  modal.hidden = true;
  document.body.classList.remove('modal-open');
  editingTicketId = null;
  lastFocusedElement?.focus();
};

requestText.addEventListener('input', () => { charCount.textContent = `${requestText.value.length} / 2000`; });
$('#exampleButton').addEventListener('click', () => { requestText.value = example; requestText.dispatchEvent(new Event('input')); requestText.focus(); });
sourceOptions.forEach((option) => option.addEventListener('click', () => {
  sourceOptions.forEach((item) => item.classList.remove('active'));
  option.classList.add('active'); currentSource = option.dataset.source;
}));

analyzeButton.addEventListener('click', async () => {
  const text = requestText.value.trim();
  if (!text) { requestText.focus(); showToast('Сначала добавьте текст обращения'); return; }
  analyzeButton.disabled = true;
  $('span', analyzeButton).textContent = 'Разбираем обращение…';
  $('#errorState').hidden = true;
  try {
    renderAnalysis(await requestAnalysis(text));
    $('span', analyzeButton).textContent = 'Проанализировать ещё раз';
  } catch (error) {
    currentAnalysis = null;
    resultContent.hidden = true;
    emptyState.hidden = true;
    $('#errorMessage').textContent = error instanceof Error ? error.message : 'Не удалось выполнить анализ.';
    $('#errorState').hidden = false;
    showToast('Не удалось выполнить анализ');
    $('span', analyzeButton).textContent = 'Повторить анализ';
  } finally {
    analyzeButton.disabled = false;
  }
});

$('#editDraft').addEventListener('click', (event) => {
  const draft = $('#draftValue');
  const editing = draft.contentEditable === 'true';
  draft.contentEditable = String(!editing);
  event.currentTarget.textContent = editing ? 'Редактировать' : 'Готово';
  if (!editing) draft.focus();
});
$('#copyButton').addEventListener('click', async () => {
  const text = [$('#summaryValue').textContent, $('#categoryValue').textContent, $('#priorityValue').textContent, $('#actionValue').textContent].join('\n');
  try { await navigator.clipboard.writeText(text); showToast('Результат скопирован'); }
  catch { showToast('Не удалось скопировать автоматически'); }
});

const createLocalTicket = () => {
  if (!currentAnalysis) throw new Error('Сначала проанализируйте обращение');
  const id = Math.max(0, ...tickets.map((ticket) => ticket.id)) + 1;
  tickets.push({ ...currentAnalysis, id, draft: $('#draftValue').textContent.trim(), status: 'Новая', date: new Date().toISOString() });
  persistTickets(); renderAll(); return id;
};
$('#createButton').addEventListener('click', () => {
  const id = createLocalTicket();
  showToast(`Заявка ${ticketNumber(id)} создана локально`);
});

document.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit-id]');
  if (editButton) openEditor(editButton.dataset.editId);
});
$$('[data-view-link]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); showView(link.dataset.viewLink); }));
$('#viewAllButton').addEventListener('click', () => showView('requests'));
$('#newRequestButton').addEventListener('click', () => { showView('workspace'); window.setTimeout(() => requestText.focus(), 250); });
$('#menuButton').addEventListener('click', () => $('.sidebar').classList.toggle('open'));

['requestSearch', 'categoryFilter', 'priorityFilter', 'statusFilter', 'sortSelect'].forEach((id) => {
  $(`#${id}`).addEventListener(id === 'requestSearch' ? 'input' : 'change', renderTicketGrid);
});
$('#resetFilters').addEventListener('click', () => {
  $('#requestSearch').value = '';
  $('#categoryFilter').value = 'all';
  $('#priorityFilter').value = 'all';
  $('#statusFilter').value = 'all';
  $('#sortSelect').value = 'date-desc';
  renderTicketGrid();
});

$('#editForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const ticket = tickets.find((item) => item.id === editingTicketId);
  if (!ticket) return;
  Object.assign(ticket, {
    description: $('#editDescription').value.trim(), summary: $('#editSummary').value.trim(),
    category: $('#editCategory').value, priority: $('#editPriority').value,
    missing: $('#editMissing').value.trim(), nextAction: $('#editNextAction').value.trim(), draft: $('#editDraftText').value.trim()
  });
  persistTickets(); renderAll(); closeEditor(); showToast(`Заявка ${ticketNumber(ticket.id)} обновлена`);
});
$('#closeModal').addEventListener('click', closeEditor);
$('#cancelEdit').addEventListener('click', closeEditor);
modal.addEventListener('click', (event) => { if (event.target === modal) closeEditor(); });
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!themeMenu.hidden) { closeThemeMenu(); themeButton.focus(); }
  if (!modal.hidden) closeEditor();
});
window.addEventListener('hashchange', () => showView(location.hash === '#requests' ? 'requests' : 'workspace', false));

const registerWebMcpTools = () => {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const register = (tool) => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {});
  register({
    name: 'analyze_support_request', title: 'Разобрать обращение',
    description: 'Анализирует переданный текст с помощью Yandex AI и показывает структурированный результат.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', minLength: 1, maxLength: 2000 }, source: { type: 'string', enum: ['Почта', 'Телефон'] } }, required: ['text'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    async execute(input) {
      if (!input || typeof input.text !== 'string' || !input.text.trim() || input.text.length > 2000) throw new Error('Текст должен содержать от 1 до 2000 символов');
      requestText.value = input.text.trim(); currentSource = input.source || 'Почта';
      sourceOptions.forEach((option) => option.classList.toggle('active', option.dataset.source === currentSource));
      requestText.dispatchEvent(new Event('input'));
      const result = renderAnalysis(await requestAnalysis(requestText.value, currentSource));
      return { category: result.category, priority: result.priority, nextAction: result.nextAction };
    }
  });
  register({
    name: 'create_local_support_ticket', title: 'Создать локальную заявку',
    description: 'Создаёт демонстрационную заявку из текущего результата анализа.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() { const id = createLocalTicket(); return { id: ticketNumber(id), status: 'Новая', storage: 'local-demo' }; }
  });
};

syncThemeUi();
renderAll();
showView(location.hash === '#requests' ? 'requests' : 'workspace', false);
registerWebMcpTools();
