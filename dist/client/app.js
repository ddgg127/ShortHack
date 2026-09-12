const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const STORAGE_KEY = 'line-demo-tickets-v3';
const PREVIOUS_STORAGE_KEYS = ['line-demo-tickets-v2', 'pulse-demo-tickets-v2'];
const MAIL_STORAGE_KEY = 'line-demo-mail-v1';
const THEME_STORAGE_KEY = 'line-theme';
const ESCALATED_STATUS = 'Передана старшему';
const THEMES = { light: 'Светлая', dark: 'Тёмная', graphite: 'Серо-чёрная', sber: 'Сбер', polar: 'Полярная ночь', ember: 'Тёплый графит' };

const seedTickets = [
  { id: 24, description: 'В личном кабинете преподавателя не загружается ведомость группы ББИ-25-1. После выбора дисциплины страница остаётся пустой.', summary: 'Не загружается ведомость выбранной учебной группы.', category: 'Образовательная платформа', priority: 'Высокий', status: 'В работе', missing: '1. Название дисциплины.\n2. Браузер и время последней попытки.', nextAction: '1. Проверить доступность сервиса.\n2. Передать данные команде образовательной платформы.', draft: 'Здравствуйте! Мы уже проверяем загрузку ведомости. Уточните, пожалуйста, название дисциплины, браузер и время последней попытки входа.', source: 'Почта', confidence: 96, date: '2026-09-12T08:48:00' },
  { id: 23, description: 'Ноутбук видит корпоративную сеть, но подключиться к Wi-Fi в главном корпусе не получается. Появляется сообщение об ошибке авторизации.', summary: 'Не удаётся подключиться к корпоративному Wi-Fi.', category: 'Сеть и подключения', priority: 'Обычный', status: 'Новая', missing: '1. Модель устройства.\n2. Операционная система.\n3. Название точки доступа.', nextAction: '1. Запросить параметры устройства.\n2. Передать заявку сетевой команде.', draft: 'Здравствуйте! Подскажите модель устройства, версию операционной системы и название Wi-Fi сети. Это поможет проверить настройки подключения.', source: 'Телефон', confidence: 91, date: '2026-09-12T08:26:00' },
  { id: 22, description: 'Забыл пароль от личного кабинета, восстановление через почту не приходит. Нужен доступ к расписанию на сегодня.', summary: 'Не приходит письмо для восстановления пароля.', category: 'Учётная запись', priority: 'Высокий', status: 'Решена', missing: 'Корпоративная почта пользователя.', nextAction: 'Проверить учётную запись и запустить повторную отправку письма.', draft: 'Здравствуйте! Доступ восстановлен, повторное письмо отправлено. Проверьте папку «Спам», если сообщение не появится во входящих.', source: 'Почта', confidence: 98, date: '2026-09-12T07:55:00' },
  { id: 21, description: 'Принтер в кабинете 412 печатает пустые листы, замена картриджа не помогла. Нужно распечатать документы к совещанию.', summary: 'Принтер печатает пустые листы после замены картриджа.', category: 'Оборудование', priority: 'Обычный', status: ESCALATED_STATUS, missing: 'Модель принтера и инвентарный номер.', nextAction: 'Назначить выезд специалиста по оборудованию.', draft: 'Здравствуйте! Мы направим специалиста в кабинет 412. Пришлите, пожалуйста, модель и инвентарный номер принтера.', source: 'Телефон', confidence: 89, date: '2026-09-11T16:40:00' },
  { id: 20, description: 'Проектор в аудитории включается, но не показывает изображение с ноутбука через HDMI. Кабель подключён, источник выбран.', summary: 'Проектор не получает изображение по HDMI.', category: 'Оборудование', priority: 'Низкий', status: 'Новая', missing: 'Номер аудитории и модель проектора.', nextAction: 'Проверить кабель и вход проектора на месте.', draft: 'Здравствуйте! Уточните номер аудитории и модель проектора. Специалист проверит подключение и HDMI-вход.', source: 'Почта', confidence: 87, date: '2026-09-11T14:12:00' },
  { id: 19, description: 'В курсе по аналитике пропала кнопка отправки домашнего задания. Срок сдачи завтра, файл уже подготовлен.', summary: 'Нет кнопки отправки домашнего задания в курсе.', category: 'Образовательная платформа', priority: 'Высокий', status: 'Решена', missing: 'Ссылка на курс и номер задания.', nextAction: 'Проверить сроки и настройки публикации задания.', draft: 'Здравствуйте! Доступ к отправке восстановлен. Обновите страницу курса и попробуйте загрузить файл повторно.', source: 'Почта', confidence: 94, date: '2026-09-10T11:30:00' }
];

const seedMail = [
  { id: 'mail-104', type: 'Письмо', sender: 'Анна Белова', address: 'a.belova@example.ru', subject: 'Не приходит письмо для смены пароля', date: '2026-09-12T10:18:00', text: 'Добрый день! Уже дважды запросила смену пароля от личного кабинета, но письмо не приходит. В спаме тоже ничего нет. Сегодня до 15:00 нужно скачать справку об обучении. Помогите, пожалуйста.' },
  { id: 'call-103', type: 'Расшифровка разговора', sender: 'Михаил Орлов', address: 'Входящий звонок · 3:42', subject: 'Не работает проектор в аудитории 305', date: '2026-09-12T09:54:00', text: 'Оператор: Добрый день, служба поддержки. Пользователь: Здравствуйте. В 305 аудитории проектор включается, но экран синий. Ноутбук подключили по HDMI, источник HDMI 1 выбрали. Через двадцать минут начинается лекция. Оператор: Индикатор на кабеле горит? Пользователь: Да, но другого кабеля рядом нет.' },
  { id: 'mail-102', type: 'Письмо', sender: 'Илья Ветров', address: 'i.vetrov@example.ru', subject: 'Пропала кнопка отправки задания', date: '2026-09-12T09:11:00', text: 'Здравствуйте. В курсе «Основы анализа данных» у задания №4 нет кнопки «Отправить». Дедлайн сегодня вечером, файл готов. Страница перезагружена, пробовал в двух браузерах — без результата.' },
  { id: 'call-101', type: 'Расшифровка разговора', sender: 'Елена Соколова', address: 'Входящий звонок · 5:06', subject: 'Не подключается рабочий VPN', date: '2026-09-12T08:37:00', text: 'Оператор: Что происходит после запуска VPN? Пользователь: Появляется окно «Ошибка проверки сертификата». Вчера всё работало. Я дома, интернет есть, сайты открываются. Оператор: Обновления системы устанавливали? Пользователь: Да, Windows обновился перед выключением. Мне нужен доступ к внутренней системе до совещания в 11:00.' }
];

const clone = (items) => items.map((item) => ({ ...item }));
const loadStoredArray = (keys, fallback) => {
  try {
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length) return saved;
    }
  } catch { /* используем демонстрационные данные */ }
  return clone(fallback);
};

let tickets = loadStoredArray([STORAGE_KEY, ...PREVIOUS_STORAGE_KEYS], seedTickets);
let mailItems = loadStoredArray([MAIL_STORAGE_KEY], seedMail);
let currentSource = 'Почта';
let currentAnalysis = null;
let editingTicketId = null;
let viewingTicketId = null;
let viewingMailId = null;
let viewingSolution = null;
let solutions = [];
let lastFocusedElement = null;

const requestText = $('#requestText');
const charCount = $('#charCount');
const analyzeButton = $('#analyzeButton');
const emptyState = $('#emptyState');
const resultContent = $('#resultContent');
const sourceOptions = $$('.source-option');
const toast = $('#toast');
const editModal = $('#editModal');
const detailModal = $('#detailModal');
const mailDetailModal = $('#mailDetailModal');
const solutionDetailModal = $('#solutionDetailModal');
const example = 'Здравствуйте! После смены телефона не получается войти в личный кабинет. Код подтверждения приходит на старый номер, доступа к нему уже нет. Мне срочно нужна ведомость для деканата сегодня. Что делать?';

const persistTickets = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets)); } catch {} };
const persistMail = () => { try { localStorage.setItem(MAIL_STORAGE_KEY, JSON.stringify(mailItems)); } catch {} };
const statusClass = (status) => ({ 'В работе': 'in-work', 'Решена': 'done', 'Новая': 'new', [ESCALATED_STATUS]: 'escalated' }[status] || 'new');
const priorityClass = (priority) => priority === 'Высокий' ? 'priority-high' : priority === 'Низкий' ? 'priority-low' : '';
const ticketNumber = (id) => `#${String(id).padStart(3, '0')}`;
const formatDate = (date) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
const makeElement = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
const editIcon = () => '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 16-.8 4.8L8 20l11-11-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/></svg>';
const typeIcon = (type) => type === 'Письмо' ? '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>' : '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.5 3h3l1.5 5-2 1.5a15 15 0 0 0 5.5 5.5l1.5-2 5 1.5v3A3.5 3.5 0 0 1 17.5 21C9.5 20.5 3.5 14.5 3 6.5A3.5 3.5 0 0 1 6.5 3Z"/></svg>';
const showToast = (message) => { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800); };
const solutionPayload = (ticket) => {
  if (!ticket.solutionId) ticket.solutionId = crypto.randomUUID();
  return { ticketId: ticket.solutionId, description: ticket.description, summary: ticket.summary, category: ticket.category, priority: ticket.priority, missing: ticket.missing, nextAction: ticket.nextAction, draft: ticket.draft, source: ticket.source, confidence: ticket.confidence, resolvedAt: ticket.resolvedAt || ticket.date || new Date().toISOString() };
};
const apiJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Сервер временно недоступен.');
  return data;
};
const storeSolution = async (ticket) => apiJson('/api/solutions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(solutionPayload(ticket)) });
const syncResolvedTickets = async () => {
  const solved = tickets.filter((ticket) => ticket.status === 'Решена');
  if (!solved.length) return;
  persistTickets();
  try {
    await apiJson('/api/solutions/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: solved.map(solutionPayload) }) });
    persistTickets();
  } catch { /* база может быть ещё не подключена в локальном предпросмотре */ }
};

const themeButton = $('#themeButton');
const themeMenu = $('#themeMenu');
const themeOptions = $$('[data-theme-option]');
const currentTheme = () => THEMES[document.documentElement.dataset.theme] ? document.documentElement.dataset.theme : 'graphite';
const closeThemeMenu = () => { themeMenu.hidden = true; themeButton.setAttribute('aria-expanded', 'false'); };
const syncThemeUi = () => {
  const selected = currentTheme();
  $('#themeButtonLabel').textContent = THEMES[selected];
  themeButton.setAttribute('aria-label', `Изменить тему. Сейчас: ${THEMES[selected]}`);
  themeOptions.forEach((option) => { const active = option.dataset.themeOption === selected; option.classList.toggle('active', active); option.setAttribute('aria-checked', String(active)); });
};
const setTheme = (theme) => { if (!THEMES[theme]) return; document.documentElement.dataset.theme = theme; try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch {} syncThemeUi(); closeThemeMenu(); showToast(`Тема: ${THEMES[theme]}`); };
themeButton.addEventListener('click', () => { const opening = themeMenu.hidden; themeMenu.hidden = !opening; themeButton.setAttribute('aria-expanded', String(opening)); if (opening) themeOptions.find((option) => option.classList.contains('active'))?.focus(); });
themeOptions.forEach((option) => option.addEventListener('click', () => setTheme(option.dataset.themeOption)));
document.addEventListener('click', (event) => { if (!event.target.closest('.theme-control')) closeThemeMenu(); });

const requestAnalysis = async (text, source = currentSource) => {
  const response = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, source }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Не удалось выполнить анализ.');
  return result;
};
const renderAnalysis = (analysis) => {
  currentAnalysis = analysis;
  $('#summaryValue').textContent = analysis.summary; $('#categoryValue').textContent = analysis.category;
  $('#priorityValue').innerHTML = `<i></i> ${analysis.priority}`; $('#priorityValue').style.color = analysis.priority === 'Высокий' ? 'var(--warning)' : 'var(--accent)';
  $('#missingValue').textContent = analysis.missing; $('#actionValue').textContent = analysis.nextAction; $('#draftValue').textContent = analysis.draft;
  $('.confidence strong').textContent = `${analysis.confidence}%`; emptyState.hidden = true; $('#errorState').hidden = true; resultContent.hidden = false;
  return analysis;
};
const markInWork = (ticket) => { if (ticket.status !== 'Новая') return false; ticket.status = 'В работе'; persistTickets(); return true; };

const renderRecent = () => {
  const container = $('#requestList'); container.replaceChildren();
  [...tickets].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3).forEach((ticket) => {
    const row = makeElement('article', 'request-row'); row.dataset.openTicket = ticket.id; row.tabIndex = 0; row.setAttribute('role', 'button'); row.setAttribute('aria-label', `Открыть заявку ${ticketNumber(ticket.id)}`);
    row.append(makeElement('span', 'request-id', ticketNumber(ticket.id)));
    const details = makeElement('div'); details.append(makeElement('strong', '', ticket.summary), makeElement('span', '', `${ticket.category} · ${ticket.source}`));
    row.append(details, makeElement('span', `status-pill ${statusClass(ticket.status)}`, ticket.status), makeElement('span', 'request-time', formatDate(ticket.date)));
    const edit = makeElement('button', 'row-edit-button'); edit.type = 'button'; edit.dataset.editId = ticket.id; edit.innerHTML = `${editIcon()}<span>Редактировать</span>`; edit.setAttribute('aria-label', `Редактировать заявку ${ticketNumber(ticket.id)}`); edit.disabled = ticket.status === ESCALATED_STATUS;
    row.append(edit); container.append(row);
  });
  $('#navCount').textContent = tickets.length;
};

const filteredTickets = () => {
  const query = $('#requestSearch').value.trim().toLowerCase(), category = $('#categoryFilter').value, priority = $('#priorityFilter').value, status = $('#statusFilter').value;
  const result = tickets.filter((ticket) => `${ticket.description} ${ticket.summary} ${ticket.draft}`.toLowerCase().includes(query) && (category === 'all' || ticket.category === category) && (priority === 'all' || ticket.priority === priority) && (status === 'all' || ticket.status === status));
  const priorityRank = { 'Высокий': 0, 'Обычный': 1, 'Низкий': 2 }, sort = $('#sortSelect').value;
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

const renderTicketGrid = () => {
  const visible = filteredTickets(), grid = $('#ticketGrid'); grid.replaceChildren();
  visible.forEach((ticket) => {
    const locked = ticket.status === ESCALATED_STATUS, card = makeElement('article', `ticket-card${locked ? ' locked' : ''}`);
    card.dataset.openTicket = ticket.id; card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-label', `Открыть заявку ${ticketNumber(ticket.id)}`);
    const header = makeElement('header', 'ticket-card-header'); header.append(makeElement('span', 'ticket-number', ticketNumber(ticket.id)));
    const title = makeElement('div', 'ticket-card-title'); title.append(makeElement('strong', '', ticket.summary), makeElement('span', '', `${ticket.source} · ${formatDate(ticket.date)}`)); header.append(title);
    const edit = makeElement('button', 'ticket-edit-button'); edit.type = 'button'; edit.dataset.editId = ticket.id; edit.innerHTML = `${editIcon()}<span>Редактировать</span>`; edit.disabled = locked; header.append(edit);
    card.append(header, makeElement('p', 'ticket-card-description', ticket.description));
    const meta = makeElement('div', 'ticket-meta'); meta.append(makeElement('span', 'meta-chip', ticket.category), makeElement('span', `meta-chip ${priorityClass(ticket.priority)}`, `Приоритет: ${ticket.priority}`), makeElement('span', `status-pill ${statusClass(ticket.status)}`, ticket.status), makeElement('span', 'meta-chip', `Уверенность ${ticket.confidence}%`)); card.append(meta);
    const details = makeElement('div', 'ticket-details');
    [['Нужно уточнить', ticket.missing || 'Дополнительные сведения не требуются.'], ['Следующий шаг', ticket.nextAction], ['Черновик ответа', ticket.draft || 'Черновик пока не подготовлен.']].forEach(([label, value]) => { const item = makeElement('div', 'ticket-detail'); item.append(makeElement('span', '', label), makeElement('p', '', value)); details.append(item); });
    card.append(details); const footer = makeElement('footer', 'ticket-card-footer'); footer.append(makeElement('span', 'ticket-date', `Создана ${formatDate(ticket.date)}`)); card.append(footer); grid.append(card);
  });
  $('#visibleCount').textContent = `${visible.length} ${visible.length === 1 ? 'заявка' : visible.length < 5 ? 'заявки' : 'заявок'}`; $('#totalRequests').textContent = tickets.length;
  const filtersCount = [$('#requestSearch').value.trim(), $('#categoryFilter').value !== 'all', $('#priorityFilter').value !== 'all', $('#statusFilter').value !== 'all'].filter(Boolean).length;
  $('#activeFilterLabel').textContent = filtersCount ? `Активных условий: ${filtersCount}` : 'Без фильтров'; $('#noResults').hidden = visible.length !== 0;
};

const renderMail = () => {
  const list = $('#mailList'); list.replaceChildren();
  [...mailItems].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((item) => {
    const article = makeElement('article', 'mail-item'), main = makeElement('div', 'mail-item-main'), icon = makeElement('span', `mail-type-icon${item.type === 'Письмо' ? '' : ' call'}`); icon.innerHTML = typeIcon(item.type);
    article.dataset.openMail = item.id; article.tabIndex = 0; article.setAttribute('role', 'button'); article.setAttribute('aria-label', `Открыть ${item.type.toLowerCase()}: ${item.subject}`);
    const copy = makeElement('div', 'mail-copy'), meta = makeElement('div', 'mail-meta'); meta.append(makeElement('span', '', item.type), makeElement('span', '', item.sender), makeElement('span', '', item.address), makeElement('span', '', formatDate(item.date)));
    copy.append(meta, makeElement('h3', '', item.subject), makeElement('p', '', item.text));
    const action = makeElement('button', 'mail-analyze-button', item.analysis ? `Открыть заявку ${ticketNumber(item.ticketId)}` : 'Отправить на анализ'); action.type = 'button'; action.dataset.analyzeMail = item.id;
    main.append(icon, copy, action); article.append(main);
    if (item.analysis) {
      const result = makeElement('div', 'mail-analysis');
      [['Кратко', item.analysis.summary], ['Категория', item.analysis.category], ['Приоритет', item.analysis.priority], ['Результат', `Создана заявка ${ticketNumber(item.ticketId)}`]].forEach(([label, value], index) => { const cell = makeElement('div', 'mail-analysis-cell'); cell.append(makeElement('span', '', label), makeElement('p', index === 3 ? 'mail-analysis-ticket' : '', value)); result.append(cell); });
      article.append(result);
    }
    list.append(article);
  });
  $('#mailCount').textContent = mailItems.filter((item) => !item.analysis).length; $('#totalMail').textContent = mailItems.length;
  $('#analyzeAllMailButton').disabled = mailItems.every((item) => item.analysis);
};

const renderSolutions = () => {
  const list = $('#solutionList'); list.replaceChildren();
  $('#knowledgeCount').textContent = solutions.length; $('#totalSolutions').textContent = solutions.length;
  $('#solutionState').hidden = solutions.length > 0;
  if (!solutions.length && !$('#solutionState').textContent) $('#solutionState').textContent = 'В базе пока нет решённых обращений.';
  solutions.forEach((item) => {
    const card = makeElement('article', 'solution-card'); card.tabIndex = 0; card.setAttribute('role', 'button'); card.dataset.solutionId = item.ticketId;
    const header = makeElement('div', 'solution-card-header'); header.append(makeElement('span', 'status-pill done', 'Решена'), makeElement('span', 'ticket-date', formatDate(item.resolvedAt)));
    card.append(header, makeElement('h3', '', item.summary), makeElement('p', '', item.description));
    const meta = makeElement('div', 'ticket-meta'); meta.append(makeElement('span', 'meta-chip', item.category), makeElement('span', 'meta-chip', `Приоритет: ${item.priority}`)); card.append(meta);
    const draft = makeElement('div', 'solution-draft'); draft.append(makeElement('span', '', 'Черновик ответа'), makeElement('p', '', item.draft)); card.append(draft);
    list.append(card);
  });
};

const loadSolutions = async () => {
  const state = $('#solutionState'); state.hidden = false; state.textContent = 'Загружаем решения…';
  try {
    const data = await apiJson('/api/solutions'); solutions = Array.isArray(data.items) ? data.items : []; state.textContent = solutions.length ? '' : 'В базе пока нет решённых обращений.'; renderSolutions();
  } catch (error) {
    solutions = []; renderSolutions(); state.hidden = false; state.textContent = error instanceof Error ? error.message : 'Не удалось загрузить базу решений.';
  }
};

const populateCategoryFilter = () => {
  const select = $('#categoryFilter'), current = select.value, categories = [...new Set(tickets.map((ticket) => ticket.category))].sort((a, b) => a.localeCompare(b, 'ru'));
  select.replaceChildren(new Option('Все категории', 'all'), ...categories.map((category) => new Option(category, category))); select.value = categories.includes(current) ? current : 'all';
};
const renderAll = () => { populateCategoryFilter(); renderRecent(); renderTicketGrid(); renderMail(); };

const pageMeta = { workspace: ['Рабочее пространство', 'Разбор обращения', 'Линия — помощник поддержки'], requests: ['Работа с обращениями', 'Заявки', 'Заявки — Линия'], mail: ['Входящий поток', 'Почта', 'Почта — Линия'], knowledge: ['Опыт поддержки', 'База решений', 'База решений — Линия'] };
const showView = (view, updateHash = true) => {
  const safeView = pageMeta[view] ? view : 'workspace';
  $$('[data-view]').forEach((section) => { section.hidden = section.dataset.view !== safeView; }); $$('[data-view-link]').forEach((link) => link.classList.toggle('active', link.dataset.viewLink === safeView));
  $('#pageEyebrow').textContent = pageMeta[safeView][0]; $('#pageTitle').textContent = pageMeta[safeView][1]; document.title = pageMeta[safeView][2];
  if (safeView === 'requests') renderTicketGrid(); if (safeView === 'mail') renderMail(); if (safeView === 'knowledge') loadSolutions(); if (updateHash) history.replaceState(null, '', `#${safeView}`);
  $('.sidebar').classList.remove('open'); window.scrollTo({ top: 0, behavior: 'smooth' });
};

const syncDetail = (ticket) => {
  const locked = ticket.status === ESCALATED_STATUS;
  $('#detailTicketId').textContent = ticketNumber(ticket.id); $('#detailStatus').textContent = ticket.status; $('#detailStatus').className = `status-pill ${statusClass(ticket.status)}`;
  $('#detailCreated').textContent = `${ticket.source} · создана ${formatDate(ticket.date)} · уверенность ${ticket.confidence}%`;
  $('#detailDescription').textContent = ticket.description; $('#detailSummary').textContent = ticket.summary; $('#detailCategory').textContent = ticket.category; $('#detailPriority').textContent = ticket.priority;
  $('#detailMissing').textContent = ticket.missing || 'Дополнительные сведения не требуются.'; $('#detailNextAction').textContent = ticket.nextAction; $('#detailDraft').textContent = ticket.draft || 'Черновик пока не подготовлен.';
  $('#detailLockedNote').hidden = !locked; $('#detailEditButton').disabled = locked; $('#escalateTicketButton').disabled = locked || ticket.status === 'Решена'; $('#resolveTicketButton').disabled = locked || ticket.status === 'Решена';
};
const openDetail = (id) => {
  const ticket = tickets.find((item) => item.id === Number(id)); if (!ticket) return;
  viewingTicketId = ticket.id; lastFocusedElement = document.activeElement; const changed = markInWork(ticket); if (changed) { renderAll(); showToast(`Заявка ${ticketNumber(ticket.id)} принята в работу`); }
  syncDetail(ticket); detailModal.hidden = false; document.body.classList.add('modal-open'); $('#closeDetail').focus();
};
const closeDetail = () => { detailModal.hidden = true; document.body.classList.remove('modal-open'); viewingTicketId = null; lastFocusedElement?.focus(); };
const openEditor = (id) => {
  const ticket = tickets.find((item) => item.id === Number(id)); if (!ticket) return;
  if (ticket.status === ESCALATED_STATUS) { showToast('Заявка уже передана старшему оператору'); return; }
  const changed = markInWork(ticket); if (changed) { renderAll(); showToast(`Заявка ${ticketNumber(ticket.id)} принята в работу`); }
  editingTicketId = ticket.id; lastFocusedElement = document.activeElement; $('#modalTicketId').textContent = ticketNumber(ticket.id);
  $('#editDescription').value = ticket.description; $('#editSummary').value = ticket.summary; $('#editCategory').value = ticket.category; $('#editPriority').value = ticket.priority; $('#editMissing').value = ticket.missing; $('#editNextAction').value = ticket.nextAction; $('#editDraftText').value = ticket.draft;
  editModal.hidden = false; document.body.classList.add('modal-open'); $('#editDescription').focus();
};
const closeEditor = () => { editModal.hidden = true; document.body.classList.remove('modal-open'); editingTicketId = null; lastFocusedElement?.focus(); };

const syncMailDetail = (item) => {
  $('#mailDetailType').textContent = item.type; $('#mailDetailTitle').textContent = item.subject;
  $('#mailDetailMeta').textContent = `${item.sender} · ${item.address} · ${formatDate(item.date)}`; $('#mailDetailText').textContent = item.text;
  const analysisBlock = $('#mailDetailAnalysis');
  analysisBlock.hidden = !item.analysis;
  $('#mailDetailAnalysisText').textContent = item.analysis ? `${item.analysis.summary}\n${item.analysis.category} · приоритет: ${item.analysis.priority}\nСоздана заявка ${ticketNumber(item.ticketId)}` : '';
  $('#mailDetailAnalyzeButton').textContent = item.analysis ? `Открыть заявку ${ticketNumber(item.ticketId)}` : 'Отправить на анализ';
};
const openMailDetail = (id) => {
  const item = mailItems.find((entry) => entry.id === id); if (!item) return;
  viewingMailId = id; lastFocusedElement = document.activeElement; syncMailDetail(item); mailDetailModal.hidden = false; document.body.classList.add('modal-open'); $('#closeMailDetail').focus();
};
const closeMailDetail = () => { mailDetailModal.hidden = true; document.body.classList.remove('modal-open'); viewingMailId = null; lastFocusedElement?.focus(); };
const openSolutionDetail = (id) => {
  const item = solutions.find((entry) => entry.ticketId === id); if (!item) return;
  viewingSolution = item; lastFocusedElement = document.activeElement; $('#solutionDetailTitle').textContent = item.summary; $('#solutionDetailMeta').textContent = `${item.category} · ${item.source} · решена ${formatDate(item.resolvedAt)}`;
  $('#solutionDetailDescription').textContent = item.description; $('#solutionDetailSummary').textContent = item.summary; $('#solutionDetailDraft').textContent = item.draft;
  solutionDetailModal.hidden = false; document.body.classList.add('modal-open'); $('#closeSolutionDetail').focus();
};
const closeSolutionDetail = () => { solutionDetailModal.hidden = true; document.body.classList.remove('modal-open'); viewingSolution = null; lastFocusedElement?.focus(); };

const analyzeMailItem = async (item, button) => {
  if (item.analysis && item.ticketId) { openDetail(item.ticketId); return item.ticketId; }
  if (button) { button.disabled = true; button.textContent = 'Анализируем…'; }
  try {
    const source = item.type === 'Письмо' ? 'Почта' : 'Телефон';
    const analysis = await requestAnalysis(item.text, source);
    item.analysis = analysis; item.ticketId = createLocalTicket(analysis, source, item.text); persistMail(); renderAll();
    if (!mailDetailModal.hidden && viewingMailId === item.id) syncMailDetail(item);
    showToast(`Анализ готов — создана заявка ${ticketNumber(item.ticketId)}`);
    return item.ticketId;
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = 'Повторить анализ'; }
    throw error;
  }
};

requestText.addEventListener('input', () => { charCount.textContent = `${requestText.value.length} / 2000`; });
$('#exampleButton').addEventListener('click', () => { requestText.value = example; requestText.dispatchEvent(new Event('input')); requestText.focus(); });
sourceOptions.forEach((option) => option.addEventListener('click', () => { sourceOptions.forEach((item) => item.classList.remove('active')); option.classList.add('active'); currentSource = option.dataset.source; }));
analyzeButton.addEventListener('click', async () => {
  const text = requestText.value.trim(); if (!text) { requestText.focus(); showToast('Сначала добавьте текст обращения'); return; }
  analyzeButton.disabled = true; $('span', analyzeButton).textContent = 'Разбираем обращение…'; $('#errorState').hidden = true;
  try { renderAnalysis(await requestAnalysis(text)); $('span', analyzeButton).textContent = 'Проанализировать ещё раз'; }
  catch (error) { currentAnalysis = null; resultContent.hidden = true; emptyState.hidden = true; $('#errorMessage').textContent = error instanceof Error ? error.message : 'Не удалось выполнить анализ.'; $('#errorState').hidden = false; showToast('Не удалось выполнить анализ'); $('span', analyzeButton).textContent = 'Повторить анализ'; }
  finally { analyzeButton.disabled = false; }
});

$('#editDraft').addEventListener('click', (event) => { const draft = $('#draftValue'), editing = draft.contentEditable === 'true'; draft.contentEditable = String(!editing); event.currentTarget.textContent = editing ? 'Редактировать' : 'Готово'; if (!editing) draft.focus(); });
$('#copyButton').addEventListener('click', async () => { const text = [$('#summaryValue').textContent, $('#categoryValue').textContent, $('#priorityValue').textContent, $('#actionValue').textContent].join('\n'); try { await navigator.clipboard.writeText(text); showToast('Результат скопирован'); } catch { showToast('Не удалось скопировать автоматически'); } });
const createLocalTicket = (analysis = currentAnalysis, source = currentSource, description = requestText.value.trim()) => {
  if (!analysis) throw new Error('Сначала проанализируйте обращение');
  const id = Math.max(0, ...tickets.map((ticket) => ticket.id)) + 1;
  tickets.push({ ...analysis, id, description: description || analysis.description || analysis.summary, source, draft: analysis.draft || '', status: 'Новая', date: new Date().toISOString() }); persistTickets(); renderAll(); return id;
};
$('#createButton').addEventListener('click', () => { const id = createLocalTicket({ ...currentAnalysis, draft: $('#draftValue').textContent.trim() }); showToast(`Заявка ${ticketNumber(id)} создана`); });

$('#mailList').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-analyze-mail]');
  if (button) {
    event.stopPropagation(); const item = mailItems.find((entry) => entry.id === button.dataset.analyzeMail); if (!item) return;
    try { await analyzeMailItem(item, button); } catch (error) { showToast(error instanceof Error ? error.message : 'Не удалось выполнить анализ'); }
    return;
  }
  const target = event.target.closest('[data-open-mail]'); if (target) openMailDetail(target.dataset.openMail);
});

$('#analyzeAllMailButton').addEventListener('click', async (event) => {
  const button = event.currentTarget, pending = mailItems.filter((item) => !item.analysis);
  if (!pending.length) { showToast('Все сообщения уже проанализированы'); return; }
  button.disabled = true;
  let completed = 0;
  for (const item of pending) {
    button.textContent = `Анализируем ${completed + 1} из ${pending.length}…`;
    try { await analyzeMailItem(item); completed += 1; } catch (error) { showToast(error instanceof Error ? error.message : 'Анализ остановлен'); break; }
  }
  button.textContent = 'Проанализировать все'; renderMail();
  if (completed === pending.length) showToast(`Готово: проанализировано сообщений — ${completed}`);
});

document.addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit-id]'); if (editButton) { event.stopPropagation(); openEditor(editButton.dataset.editId); return; }
  const solutionTarget = event.target.closest('[data-solution-id]'); if (solutionTarget) { openSolutionDetail(solutionTarget.dataset.solutionId); return; }
  const ticketTarget = event.target.closest('[data-open-ticket]'); if (ticketTarget) openDetail(ticketTarget.dataset.openTicket);
});
document.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-open-ticket]')) { event.preventDefault(); openDetail(event.target.dataset.openTicket); return; }
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-open-mail]')) { event.preventDefault(); openMailDetail(event.target.dataset.openMail); return; }
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-solution-id]')) { event.preventDefault(); openSolutionDetail(event.target.dataset.solutionId); return; }
  if (event.key !== 'Escape') return; if (!themeMenu.hidden) { closeThemeMenu(); themeButton.focus(); } if (!editModal.hidden) closeEditor(); if (!detailModal.hidden) closeDetail(); if (!mailDetailModal.hidden) closeMailDetail(); if (!solutionDetailModal.hidden) closeSolutionDetail();
});
$$('[data-view-link]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); showView(link.dataset.viewLink); }));
$('#viewAllButton').addEventListener('click', () => showView('requests')); $('#newRequestButton').addEventListener('click', () => { showView('workspace'); setTimeout(() => requestText.focus(), 250); }); $('#menuButton').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
['requestSearch', 'categoryFilter', 'priorityFilter', 'statusFilter', 'sortSelect'].forEach((id) => { $(`#${id}`).addEventListener(id === 'requestSearch' ? 'input' : 'change', renderTicketGrid); });
$('#resetFilters').addEventListener('click', () => { $('#requestSearch').value = ''; $('#categoryFilter').value = 'all'; $('#priorityFilter').value = 'all'; $('#statusFilter').value = 'all'; $('#sortSelect').value = 'date-desc'; renderTicketGrid(); });

$('#detailEditButton').addEventListener('click', () => { const id = viewingTicketId; closeDetail(); openEditor(id); });
$('#resolveTicketButton').addEventListener('click', async (event) => {
  const ticket = tickets.find((item) => item.id === viewingTicketId); if (!ticket || ticket.status === ESCALATED_STATUS || ticket.status === 'Решена') return;
  const button = event.currentTarget; button.disabled = true; button.textContent = 'Сохраняем решение…'; ticket.resolvedAt = new Date().toISOString();
  try {
    await storeSolution(ticket); ticket.status = 'Решена'; persistTickets(); renderAll(); syncDetail(ticket); loadSolutions(); showToast(`Заявка ${ticketNumber(ticket.id)} решена и добавлена в базу`);
  } catch (error) {
    delete ticket.resolvedAt; button.disabled = false; showToast(error instanceof Error ? error.message : 'Не удалось сохранить решение');
  } finally { button.textContent = 'Отметить решённой'; }
});
$('#escalateTicketButton').addEventListener('click', () => { const ticket = tickets.find((item) => item.id === viewingTicketId); if (!ticket || ticket.status === ESCALATED_STATUS || ticket.status === 'Решена') return; ticket.status = ESCALATED_STATUS; persistTickets(); renderAll(); syncDetail(ticket); showToast(`Заявка ${ticketNumber(ticket.id)} передана старшему оператору`); });
$('#closeDetail').addEventListener('click', closeDetail); detailModal.addEventListener('click', (event) => { if (event.target === detailModal) closeDetail(); });
$('#mailDetailAnalyzeButton').addEventListener('click', async (event) => {
  const item = mailItems.find((entry) => entry.id === viewingMailId); if (!item) return;
  if (item.analysis && item.ticketId) { closeMailDetail(); openDetail(item.ticketId); return; }
  try { await analyzeMailItem(item, event.currentTarget); } catch (error) { showToast(error instanceof Error ? error.message : 'Не удалось выполнить анализ'); }
});
$('#closeMailDetail').addEventListener('click', closeMailDetail); mailDetailModal.addEventListener('click', (event) => { if (event.target === mailDetailModal) closeMailDetail(); });
$('#closeSolutionDetail').addEventListener('click', closeSolutionDetail); solutionDetailModal.addEventListener('click', (event) => { if (event.target === solutionDetailModal) closeSolutionDetail(); });
$('#refreshSolutionsButton').addEventListener('click', loadSolutions);
$('#editForm').addEventListener('submit', (event) => {
  event.preventDefault(); const ticket = tickets.find((item) => item.id === editingTicketId); if (!ticket || ticket.status === ESCALATED_STATUS) return;
  Object.assign(ticket, { description: $('#editDescription').value.trim(), summary: $('#editSummary').value.trim(), category: $('#editCategory').value, priority: $('#editPriority').value, missing: $('#editMissing').value.trim(), nextAction: $('#editNextAction').value.trim(), draft: $('#editDraftText').value.trim() });
  persistTickets(); renderAll(); closeEditor(); showToast(`Заявка ${ticketNumber(ticket.id)} обновлена`);
});
$('#closeModal').addEventListener('click', closeEditor); $('#cancelEdit').addEventListener('click', closeEditor); editModal.addEventListener('click', (event) => { if (event.target === editModal) closeEditor(); });
window.addEventListener('hashchange', () => showView(location.hash.slice(1), false));

const registerWebMcpTools = () => {
  const context = document.modelContext; if (!context?.registerTool) return; const lifecycle = new AbortController(); const register = (tool) => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {});
  register({ name: 'analyze_support_request', title: 'Разобрать обращение', description: 'Анализирует переданный текст с помощью Yandex AI и показывает структурированный результат.', inputSchema: { type: 'object', properties: { text: { type: 'string', minLength: 1, maxLength: 2000 }, source: { type: 'string', enum: ['Почта', 'Телефон'] } }, required: ['text'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: true }, async execute(input) { if (!input || typeof input.text !== 'string' || !input.text.trim() || input.text.length > 2000) throw new Error('Текст должен содержать от 1 до 2000 символов'); requestText.value = input.text.trim(); currentSource = input.source || 'Почта'; sourceOptions.forEach((option) => option.classList.toggle('active', option.dataset.source === currentSource)); requestText.dispatchEvent(new Event('input')); const result = renderAnalysis(await requestAnalysis(requestText.value, currentSource)); return { category: result.category, priority: result.priority, nextAction: result.nextAction }; } });
  register({ name: 'create_local_support_ticket', title: 'Создать локальную заявку', description: 'Создаёт заявку из текущего результата анализа.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute() { const id = createLocalTicket(); return { id: ticketNumber(id), status: 'Новая', storage: 'local-demo' }; } });
};

syncThemeUi(); renderAll(); syncResolvedTickets().then(loadSolutions); showView(location.hash.slice(1), false); registerWebMcpTools();
