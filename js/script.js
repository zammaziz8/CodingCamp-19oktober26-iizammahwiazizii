/* ============================================================
   LIFE DASHBOARD — script.js
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────
   STORAGE HELPERS
   ────────────────────────────────────────────────────────── */
const Storage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }
  },
};

/* ──────────────────────────────────────────────────────────
   1. GREETING & REAL-TIME CLOCK
   ────────────────────────────────────────────────────────── */
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function getGreeting(hour) {
  if (hour >= 5  && hour < 12) return 'Good Morning ☀️';
  if (hour >= 12 && hour < 17) return 'Good Afternoon 🌤️';
  if (hour >= 17 && hour < 21) return 'Good Evening 🌇';
  return 'Good Night 🌙';
}

function padTwo(n) {
  return String(n).padStart(2, '0');
}

function updateClock() {
  const now  = new Date();
  const h    = now.getHours();
  const m    = now.getMinutes();
  const s    = now.getSeconds();
  const day  = DAYS[now.getDay()];
  const date = now.getDate();
  const mon  = MONTHS[now.getMonth()];
  const yr   = now.getFullYear();

  document.getElementById('timeDisplay').textContent =
    `${padTwo(h)}:${padTwo(m)}:${padTwo(s)}`;

  document.getElementById('dateDisplay').textContent =
    `${day}, ${date} ${mon} ${yr}`;

  document.getElementById('greetingText').textContent = getGreeting(h);
}

setInterval(updateClock, 1000);
updateClock(); // immediate first paint

/* ──────────────────────────────────────────────────────────
   2. CUSTOM NAME IN GREETING
   ────────────────────────────────────────────────────────── */
const nameDisplay    = document.getElementById('userNameDisplay');
const nameEditForm   = document.getElementById('nameEditForm');
const nameInput      = document.getElementById('nameInput');
const btnEditName    = document.getElementById('btnEditName');
const btnSaveName    = document.getElementById('btnSaveName');
const btnCancelName  = document.getElementById('btnCancelName');

function loadUserName() {
  const saved = Storage.get('userName', 'User');
  nameDisplay.textContent = saved + '!';
}

function showNameForm() {
  const current = Storage.get('userName', 'User');
  nameInput.value = current;
  nameEditForm.classList.remove('hidden');
  btnEditName.classList.add('hidden');
  nameInput.focus();
  nameInput.select();
}

function hideNameForm() {
  nameEditForm.classList.add('hidden');
  btnEditName.classList.remove('hidden');
}

function saveName() {
  const val = nameInput.value.trim();
  if (!val) return;
  Storage.set('userName', val);
  nameDisplay.textContent = val + '!';
  hideNameForm();
}

btnEditName.addEventListener('click', showNameForm);
btnSaveName.addEventListener('click', saveName);
btnCancelName.addEventListener('click', hideNameForm);
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  saveName();
  if (e.key === 'Escape') hideNameForm();
});

loadUserName();

/* ──────────────────────────────────────────────────────────
   3. LIGHT / DARK MODE
   ────────────────────────────────────────────────────────── */
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const htmlEl      = document.documentElement;

function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  Storage.set('theme', theme);
}

function toggleTheme() {
  const current = htmlEl.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

themeToggle.addEventListener('click', toggleTheme);

// Load saved theme on start
applyTheme(Storage.get('theme', 'light'));

/* ──────────────────────────────────────────────────────────
   4. FOCUS TIMER (POMODORO)
   ────────────────────────────────────────────────────────── */
const TIMER_MODES = {
  pomodoro: { label: 'Pomodoro', minutes: 25 },
  short:    { label: 'Short Break', minutes: 5 },
  long:     { label: 'Long Break', minutes: 15 },
};

const timerDisplay      = document.getElementById('timerDisplay');
const timerProgressFill = document.getElementById('timerProgressFill');
const timerSessionInfo  = document.getElementById('timerSessionInfo');
const btnStart          = document.getElementById('btnStart');
const btnStop           = document.getElementById('btnStop');
const btnReset          = document.getElementById('btnReset');
const modeTabs          = document.querySelectorAll('.mode-tab');

let timerInterval   = null;
let timerRunning    = false;
let currentMode     = 'pomodoro';
let totalSeconds    = TIMER_MODES[currentMode].minutes * 60;
let remainingSeconds = totalSeconds;
let pomodoroCount   = 0;

function formatTimer(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${padTwo(m)}:${padTwo(s)}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTimer(remainingSeconds);
  const pct = totalSeconds > 0
    ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100
    : 0;
  timerProgressFill.style.width = `${pct}%`;
}

function updateSessionInfo() {
  const modeLabel = TIMER_MODES[currentMode].label;
  if (currentMode === 'pomodoro') {
    timerSessionInfo.textContent = `Sesi ke-${pomodoroCount + 1} · Fokus! 🎯`;
  } else {
    timerSessionInfo.textContent = `${modeLabel} · Istirahat sejenak ☕`;
  }
}

function setMode(mode) {
  if (timerRunning) stopTimer();
  currentMode      = mode;
  totalSeconds     = TIMER_MODES[mode].minutes * 60;
  remainingSeconds = totalSeconds;
  modeTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });
  timerDisplay.classList.remove('running');
  updateTimerDisplay();
  updateSessionInfo();
}

function startTimer() {
  if (timerRunning) return;
  if (remainingSeconds <= 0) resetTimer();
  timerRunning = true;
  timerDisplay.classList.add('running');
  btnStart.disabled = true;
  timerInterval = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();
    } else {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.classList.remove('running');
      btnStart.disabled = false;
      if (currentMode === 'pomodoro') pomodoroCount++;
      notifyTimerEnd();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerDisplay.classList.remove('running');
  btnStart.disabled = false;
}

function resetTimer() {
  stopTimer();
  remainingSeconds = totalSeconds;
  updateTimerDisplay();
  updateSessionInfo();
  timerProgressFill.style.width = '0%';
}

function notifyTimerEnd() {
  const msg = currentMode === 'pomodoro'
    ? `🎉 Sesi Pomodoro selesai! Waktunya istirahat.`
    : `⏰ Istirahat selesai! Siap fokus kembali?`;
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Life Dashboard — Timer', { body: msg, icon: '' });
  }
  // Fallback: visual flash
  timerDisplay.style.color = 'var(--success)';
  setTimeout(() => { timerDisplay.style.color = ''; }, 2000);
  updateSessionInfo();
}

// Request notification permission on first interaction
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

btnStart.addEventListener('click', () => { requestNotifPermission(); startTimer(); });
btnStop.addEventListener('click',  stopTimer);
btnReset.addEventListener('click', resetTimer);

modeTabs.forEach((tab) => {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
});

// Init
updateTimerDisplay();
updateSessionInfo();

/* ──────────────────────────────────────────────────────────
   5. TO-DO LIST
   ────────────────────────────────────────────────────────── */
const todoInput       = document.getElementById('todoInput');
const btnAddTodo      = document.getElementById('btnAddTodo');
const todoListEl      = document.getElementById('todoList');
const todoCounter     = document.getElementById('todoCounter');
const duplicateWarn   = document.getElementById('duplicateWarning');
const btnClearDone    = document.getElementById('btnClearDone');

let todos = Storage.get('todos', []); // [{ id, text, done }]

function saveTodos() {
  Storage.set('todos', todos);
}

function renderTodos() {
  todoListEl.innerHTML = '';
  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.id = todo.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type      = 'checkbox';
    cb.className = 'todo-checkbox';
    cb.checked   = todo.done;
    cb.setAttribute('aria-label', `Tandai "${todo.text}" selesai`);
    cb.addEventListener('change', () => toggleTodo(todo.id));

    // Text
    const span = document.createElement('span');
    span.className   = 'todo-text';
    span.textContent = todo.text;

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'todo-delete';
    delBtn.title     = 'Hapus tugas';
    delBtn.innerHTML = '🗑';
    delBtn.setAttribute('aria-label', `Hapus tugas "${todo.text}"`);
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    li.append(cb, span, delBtn);
    todoListEl.appendChild(li);
  });

  updateTodoCounter();
}

function updateTodoCounter() {
  const total = todos.length;
  const done  = todos.filter((t) => t.done).length;
  todoCounter.textContent = total === 0
    ? '0 tugas'
    : `${done}/${total} selesai`;
}

function isDuplicate(text) {
  return todos.some((t) => t.text.toLowerCase() === text.toLowerCase());
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;

  if (isDuplicate(text)) {
    duplicateWarn.classList.remove('hidden');
    todoInput.focus();
    setTimeout(() => duplicateWarn.classList.add('hidden'), 3000);
    return;
  }

  duplicateWarn.classList.add('hidden');
  todos.push({ id: Date.now(), text, done: false });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    saveTodos();
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  renderTodos();
}

function clearDoneTodos() {
  const doneCount = todos.filter((t) => t.done).length;
  if (doneCount === 0) return;
  if (confirm(`Hapus ${doneCount} tugas yang sudah selesai?`)) {
    todos = todos.filter((t) => !t.done);
    saveTodos();
    renderTodos();
  }
}

btnAddTodo.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});
btnClearDone.addEventListener('click', clearDoneTodos);

renderTodos();

/* ──────────────────────────────────────────────────────────
   6. QUICK LINKS
   ────────────────────────────────────────────────────────── */
const linkNameInput = document.getElementById('linkNameInput');
const linkUrlInput  = document.getElementById('linkUrlInput');
const btnAddLink    = document.getElementById('btnAddLink');
const linksGrid     = document.getElementById('linksGrid');
const linkWarning   = document.getElementById('linkWarning');
const linksEmpty    = document.getElementById('linksEmpty');

let links = Storage.get('quickLinks', []); // [{ id, name, url }]

function saveLinks() {
  Storage.set('quickLinks', links);
}

function getFaviconUrl(url) {
  try {
    const parsed = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return null;
  }
}

function renderLinks() {
  linksGrid.innerHTML = '';

  if (links.length === 0) {
    linksEmpty.classList.remove('hidden');
    return;
  }

  linksEmpty.classList.add('hidden');

  links.forEach((link) => {
    const a = document.createElement('a');
    a.className  = 'link-card';
    a.href       = link.url;
    a.target     = '_blank';
    a.rel        = 'noopener noreferrer';
    a.dataset.id = link.id;

    const faviconUrl = getFaviconUrl(link.url);
    if (faviconUrl) {
      const img    = document.createElement('img');
      img.className = 'link-favicon';
      img.src      = faviconUrl;
      img.alt      = link.name;
      img.onerror  = () => { img.style.display = 'none'; };
      a.appendChild(img);
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = link.name;
    a.appendChild(nameSpan);

    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete-btn';
    delBtn.title     = 'Hapus link';
    delBtn.innerHTML = '✕';
    delBtn.setAttribute('aria-label', `Hapus link "${link.name}"`);
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    a.appendChild(delBtn);
    linksGrid.appendChild(a);
  });
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function addLink() {
  const name = linkNameInput.value.trim();
  let   url  = linkUrlInput.value.trim();

  if (!name || !url) {
    linkWarning.textContent = '⚠️ Nama dan URL tidak boleh kosong!';
    linkWarning.classList.remove('hidden');
    setTimeout(() => linkWarning.classList.add('hidden'), 3000);
    return;
  }

  // Auto-prefix https:// if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  if (!isValidUrl(url)) {
    linkWarning.textContent = '⚠️ URL tidak valid. Contoh: https://google.com';
    linkWarning.classList.remove('hidden');
    setTimeout(() => linkWarning.classList.add('hidden'), 3000);
    return;
  }

  linkWarning.classList.add('hidden');
  links.push({ id: Date.now(), name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
}

function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  saveLinks();
  renderLinks();
}

btnAddLink.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink();
});
linkNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink();
});

renderLinks();

/* ──────────────────────────────────────────────────────────
   INIT — seed default links for first-time users
   ────────────────────────────────────────────────────────── */
function seedDefaultLinks() {
  if (Storage.get('quickLinks') !== null) return; // already initialised
  const defaults = [
    { id: 1, name: 'Google',   url: 'https://google.com' },
    { id: 2, name: 'YouTube',  url: 'https://youtube.com' },
    { id: 3, name: 'GitHub',   url: 'https://github.com' },
    { id: 4, name: 'Dicoding', url: 'https://dicoding.com' },
  ];
  Storage.set('quickLinks', defaults);
  links = defaults;
  renderLinks();
}

seedDefaultLinks();
