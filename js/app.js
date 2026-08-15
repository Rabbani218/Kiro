/**
 * Life Dashboard — app.js
 * Pure Vanilla JS, ES6+
 * No frameworks, no external deps.
 *
 * Modules:
 *  1. Storage helpers
 *  2. Theme Manager
 *  3. Clock & Greeting
 *  4. Custom Name
 *  5. Focus Timer (Pomodoro)
 *  6. To-Do List
 *  7. Quick Links
 *  8. Toast Notification
 *  9. Bootstrap / init
 */

'use strict';

/* ============================================================
   1. STORAGE HELPERS
   ============================================================ */

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
      console.warn('LocalStorage write failed:', e);
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

const KEYS = {
  THEME:  'ld_theme',
  NAME:   'ld_name',
  TASKS:  'ld_tasks',
  LINKS:  'ld_links',
};

/* ============================================================
   2. TOAST NOTIFICATION
   ============================================================ */

const Toast = (() => {
  const el = document.getElementById('toast');
  let timer = null;

  function show(message, duration = 2800) {
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), duration);
  }

  return { show };
})();

/* ============================================================
   3. THEME MANAGER
   ============================================================ */

const ThemeManager = (() => {
  const toggle = document.getElementById('themeToggle');
  const html   = document.documentElement;

  function apply(theme) {
    html.setAttribute('data-theme', theme);
    if (toggle) toggle.checked = (theme === 'dark');
  }

  function init() {
    const saved = Storage.get(KEYS.THEME, 'light');
    apply(saved);

    if (toggle) {
      toggle.addEventListener('change', () => {
        const next = toggle.checked ? 'dark' : 'light';
        apply(next);
        Storage.set(KEYS.THEME, next);
        Toast.show(`Switched to ${next} mode`);
      });
    }
  }

  return { init, apply };
})();

/* ============================================================
   4. CLOCK & GREETING
   ============================================================ */

const ClockWidget = (() => {
  const clockEl    = document.getElementById('clock');
  const dateEl     = document.getElementById('dateDisplay');
  const greetingEl = document.getElementById('greeting');

  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

  function getGreeting(hour) {
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now  = new Date();
    const h    = now.getHours();
    const m    = now.getMinutes();
    const s    = now.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;

    if (clockEl) clockEl.textContent = `${pad(h12)}:${pad(m)}:${pad(s)} ${ampm}`;
    if (greetingEl) greetingEl.textContent = getGreeting(h);

    if (dateEl) {
      const day  = DAYS[now.getDay()];
      const date = now.getDate();
      const mon  = MONTHS[now.getMonth()];
      const yr   = now.getFullYear();
      dateEl.textContent = `${day}, ${mon} ${date}, ${yr}`;
    }
  }

  function init() {
    tick();
    setInterval(tick, 1000);
  }

  return { init };
})();

/* ============================================================
   5. CUSTOM NAME
   ============================================================ */

const NameManager = (() => {
  const nameDisplay  = document.getElementById('greetingName');
  const editBtn      = document.getElementById('editNameBtn');
  const nameEditor   = document.getElementById('nameEditor');
  const nameInput    = document.getElementById('nameInput');
  const saveBtn      = document.getElementById('saveNameBtn');
  const cancelBtn    = document.getElementById('cancelNameBtn');

  let currentName = 'Friend';

  function render(name) {
    currentName = name || 'Friend';
    if (nameDisplay) nameDisplay.textContent = currentName;
  }

  function openEditor() {
    if (!nameEditor || !nameInput) return;
    nameInput.value = currentName === 'Friend' ? '' : currentName;
    nameEditor.classList.add('visible');
    nameEditor.setAttribute('aria-hidden', 'false');
    nameInput.focus();
  }

  function closeEditor() {
    if (!nameEditor) return;
    nameEditor.classList.remove('visible');
    nameEditor.setAttribute('aria-hidden', 'true');
  }

  function saveName() {
    const val = nameInput ? nameInput.value.trim() : '';
    const name = val || 'Friend';
    render(name);
    Storage.set(KEYS.NAME, name);
    closeEditor();
    Toast.show(`Hello, ${name}! 👋`);
  }

  function init() {
    const saved = Storage.get(KEYS.NAME, 'Friend');
    render(saved);

    if (editBtn)   editBtn.addEventListener('click', openEditor);
    if (saveBtn)   saveBtn.addEventListener('click', saveName);
    if (cancelBtn) cancelBtn.addEventListener('click', closeEditor);

    if (nameInput) {
      nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') saveName();
        if (e.key === 'Escape') closeEditor();
      });
    }
  }

  return { init };
})();

/* ============================================================
   6. FOCUS TIMER (POMODORO)
   ============================================================ */

const TimerWidget = (() => {
  const TOTAL_SECONDS = 25 * 60; // 1500

  const minEl       = document.getElementById('timerMinutes');
  const secEl       = document.getElementById('timerSeconds');
  const colonEl     = document.querySelector('.timer__colon');
  const fillEl      = document.getElementById('timerProgressFill');
  const progressBar = document.getElementById('timerProgressBar');
  const statusEl    = document.getElementById('timerStatus');
  const displayEl   = document.querySelector('.timer__display');
  const startBtn    = document.getElementById('timerStart');
  const stopBtn     = document.getElementById('timerStop');
  const resetBtn    = document.getElementById('timerReset');

  let remaining  = TOTAL_SECONDS;
  let intervalId = null;
  let running    = false;

  function pad(n) { return String(n).padStart(2, '0'); }

  function render() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    if (minEl) minEl.textContent = pad(m);
    if (secEl) secEl.textContent = pad(s);

    // Progress bar
    const pct = (remaining / TOTAL_SECONDS) * 100;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', remaining);

    // Colour urgency
    if (displayEl) {
      displayEl.classList.toggle('timer--warning', remaining <= 300 && remaining > 60);
      displayEl.classList.toggle('timer--urgent',  remaining <= 60 && remaining > 0);
    }
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function setButtons(isRunning) {
    if (startBtn) startBtn.disabled = isRunning;
    if (stopBtn)  stopBtn.disabled  = !isRunning;
    if (colonEl)  colonEl.classList.toggle('paused', !isRunning);
  }

  function start() {
    if (running || remaining <= 0) return;
    running = true;
    setButtons(true);
    setStatus('Stay focused — you got this! 🎯');

    intervalId = setInterval(() => {
      remaining--;
      render();

      if (remaining <= 0) {
        clearInterval(intervalId);
        running = false;
        setButtons(false);
        setStatus('Session complete! Great work. 🎉');
        Toast.show('Pomodoro complete! Take a break. 🍅', 4000);
        // Flash title
        let flashCount = 0;
        const origTitle = document.title;
        const flash = setInterval(() => {
          document.title = flashCount % 2 === 0 ? '✅ Time is up!' : origTitle;
          flashCount++;
          if (flashCount > 8) { clearInterval(flash); document.title = origTitle; }
        }, 700);
      }
    }, 1000);
  }

  function stop() {
    if (!running) return;
    clearInterval(intervalId);
    running = false;
    setButtons(false);
    setStatus('Paused — resume whenever you\'re ready.');
  }

  function reset() {
    clearInterval(intervalId);
    running    = false;
    remaining  = TOTAL_SECONDS;
    setButtons(false);
    setStatus('Ready to focus');
    render();
  }

  function init() {
    render();
    if (startBtn) startBtn.addEventListener('click', start);
    if (stopBtn)  stopBtn.addEventListener('click',  stop);
    if (resetBtn) resetBtn.addEventListener('click',  reset);
  }

  return { init };
})();

/* ============================================================
   7. TO-DO LIST
   ============================================================ */

const TodoManager = (() => {
  // State
  let tasks  = [];   // [{ id, text, completed, createdAt }]
  let filter = 'all';

  // Elements
  const inputEl       = document.getElementById('taskInput');
  const addBtn        = document.getElementById('addTaskBtn');
  const listEl        = document.getElementById('taskList');
  const errorEl       = document.getElementById('taskError');
  const emptyEl       = document.getElementById('taskEmpty');
  const countEl       = document.getElementById('taskCount');
  const clearDoneBtn  = document.getElementById('clearCompletedBtn');
  const filterTabs    = document.querySelectorAll('.filter-tab');

  /* ── Persistence ── */
  function load() {
    tasks = Storage.get(KEYS.TASKS, []);
  }

  function save() {
    Storage.set(KEYS.TASKS, tasks);
  }

  /* ── Helpers ── */
  function uid() {
    return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function showError(msg) {
    if (errorEl) {
      errorEl.textContent = msg;
      if (msg) {
        setTimeout(() => { if (errorEl.textContent === msg) errorEl.textContent = ''; }, 3000);
      }
    }
  }

  function isDuplicate(text) {
    return tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
  }

  /* ── Filtering ── */
  function getFiltered() {
    if (filter === 'active')    return tasks.filter(t => !t.completed);
    if (filter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
  }

  /* ── Render ── */
  function render() {
    if (!listEl) return;
    const visible = getFiltered();

    listEl.innerHTML = '';

    if (visible.length === 0) {
      emptyEl && (emptyEl.classList.add('visible'));
    } else {
      emptyEl && (emptyEl.classList.remove('visible'));
      visible.forEach(task => listEl.appendChild(createTaskEl(task)));
    }

    updateCount();
  }

  function updateCount() {
    if (!countEl) return;
    const total     = tasks.length;
    const done      = tasks.filter(t => t.completed).length;
    const remaining = total - done;
    countEl.textContent = remaining > 0
      ? `${remaining} task${remaining !== 1 ? 's' : ''} remaining`
      : total > 0 ? 'All done! 🎉' : '';
  }

  /* ── Task Element Builder ── */
  function createTaskEl(task) {
    const li = document.createElement('li');
    li.className = `task-item${task.completed ? ' completed' : ''}`;
    li.dataset.id = task.id;

    // Checkbox
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'task-item__check';
    check.checked = task.completed;
    check.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
    check.addEventListener('change', () => toggleTask(task.id));

    // Text
    const textSpan = document.createElement('span');
    textSpan.className = 'task-item__text';
    textSpan.textContent = task.text;
    textSpan.title = task.text;

    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-item__actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'task-item__btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edit task';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.addEventListener('click', () => startEdit(li, task));

    const delBtn = document.createElement('button');
    delBtn.className = 'task-item__btn task-item__btn--delete';
    delBtn.innerHTML = '🗑';
    delBtn.title = 'Delete task';
    delBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    delBtn.addEventListener('click', () => deleteTask(li, task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(check);
    li.appendChild(textSpan);
    li.appendChild(actions);

    return li;
  }

  /* ── Inline Edit ── */
  function startEdit(li, task) {
    const textSpan = li.querySelector('.task-item__text');
    const actions  = li.querySelector('.task-item__actions');
    if (!textSpan) return;

    // Replace text with input
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-item__edit-input';
    editInput.value = task.text;
    editInput.maxLength = 120;
    editInput.setAttribute('aria-label', 'Edit task text');

    textSpan.replaceWith(editInput);
    editInput.focus();
    editInput.select();

    // Replace edit button with save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'task-item__btn task-item__btn--save';
    saveBtn.innerHTML = '💾';
    saveBtn.title = 'Save';
    saveBtn.setAttribute('aria-label', 'Save edited task');

    const editBtn = actions.querySelector('.task-item__btn:not(.task-item__btn--delete)');
    if (editBtn) editBtn.replaceWith(saveBtn);

    function commitEdit() {
      const newText = editInput.value.trim();
      if (!newText) {
        Toast.show('Task cannot be empty');
        editInput.focus();
        return;
      }
      if (newText.toLowerCase() !== task.text.toLowerCase() && isDuplicate(newText)) {
        Toast.show('A task with this name already exists');
        editInput.focus();
        return;
      }
      task.text = newText;
      const idx = tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) tasks[idx].text = newText;
      save();
      render();
    }

    saveBtn.addEventListener('click', commitEdit);
    editInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') commitEdit();
      if (e.key === 'Escape') render(); // cancel
    });
    editInput.addEventListener('blur', e => {
      // Small delay so save button click registers first
      setTimeout(() => {
        if (document.activeElement !== saveBtn) render();
      }, 150);
    });
  }

  /* ── CRUD Operations ── */
  function addTask() {
    const text = inputEl ? inputEl.value.trim() : '';

    if (!text) {
      showError('Please enter a task.');
      inputEl && inputEl.focus();
      return;
    }

    if (isDuplicate(text)) {
      showError(`"${text}" is already in your list.`);
      inputEl && inputEl.focus();
      return;
    }

    showError('');
    tasks.unshift({ id: uid(), text, completed: false, createdAt: Date.now() });
    save();
    render();

    if (inputEl) inputEl.value = '';
    inputEl && inputEl.focus();
    Toast.show('Task added ✓');
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    save();
    render();
  }

  function deleteTask(li, id) {
    li.classList.add('removing');
    li.addEventListener('transitionend', () => {
      tasks = tasks.filter(t => t.id !== id);
      save();
      render();
    }, { once: true });
    // fallback if transition doesn't fire
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      save();
      render();
    }, 450);
  }

  function clearCompleted() {
    const count = tasks.filter(t => t.completed).length;
    if (count === 0) { Toast.show('No completed tasks to clear'); return; }
    tasks = tasks.filter(t => !t.completed);
    save();
    render();
    Toast.show(`Cleared ${count} completed task${count !== 1 ? 's' : ''}`);
  }

  /* ── Filter Tabs ── */
  function setFilter(f) {
    filter = f;
    filterTabs.forEach(tab => {
      const isActive = tab.dataset.filter === f;
      tab.classList.toggle('filter-tab--active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
    render();
  }

  /* ── Init ── */
  function init() {
    load();
    render();

    if (addBtn)  addBtn.addEventListener('click', addTask);
    if (inputEl) {
      inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') addTask();
      });
    }

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => setFilter(tab.dataset.filter));
    });

    if (clearDoneBtn) clearDoneBtn.addEventListener('click', clearCompleted);
  }

  return { init };
})();

/* ============================================================
   8. QUICK LINKS
   ============================================================ */

const LinksManager = (() => {
  let links = []; // [{ id, name, url }]

  const form     = document.getElementById('addLinkForm');
  const nameEl   = document.getElementById('linkName');
  const urlEl    = document.getElementById('linkUrl');
  const gridEl   = document.getElementById('linksGrid');
  const errorEl  = document.getElementById('linkError');
  const emptyEl  = document.getElementById('linksEmpty');

  /* ── Persistence ── */
  function load() {
    links = Storage.get(KEYS.LINKS, []);
  }

  function save() {
    Storage.set(KEYS.LINKS, links);
  }

  /* ── Helpers ── */
  function uid() {
    return `l_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function showError(msg) {
    if (errorEl) {
      errorEl.textContent = msg;
      if (msg) setTimeout(() => { if (errorEl.textContent === msg) errorEl.textContent = ''; }, 3500);
    }
  }

  function normaliseUrl(raw) {
    let url = raw.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    return url;
  }

  function isValidUrl(url) {
    try { new URL(url); return true; } catch { return false; }
  }

  function getFaviconUrl(url) {
    try {
      const { origin } = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
    } catch {
      return '';
    }
  }

  /* ── Render ── */
  function render() {
    if (!gridEl) return;
    gridEl.innerHTML = '';

    if (links.length === 0) {
      emptyEl && emptyEl.classList.add('visible');
      return;
    }

    emptyEl && emptyEl.classList.remove('visible');
    links.forEach(link => gridEl.appendChild(createChip(link)));
  }

  function createChip(link) {
    const chip = document.createElement('div');
    chip.className = 'link-chip';
    chip.dataset.id = link.id;

    // Favicon
    const favicon = document.createElement('img');
    favicon.className = 'link-chip__favicon';
    favicon.src = getFaviconUrl(link.url);
    favicon.alt = '';
    favicon.width = 20;
    favicon.height = 20;
    favicon.onerror = () => { favicon.style.visibility = 'hidden'; };

    // Name label
    const nameSpan = document.createElement('span');
    nameSpan.className = 'link-chip__name';
    nameSpan.textContent = link.name;
    nameSpan.title = link.url;

    // Invisible anchor covering chip (accessible navigation)
    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.setAttribute('aria-label', `Open ${link.name}`);

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'link-chip__delete';
    delBtn.innerHTML = '✕';
    delBtn.title = `Remove ${link.name}`;
    delBtn.setAttribute('aria-label', `Remove ${link.name}`);
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      deleteLink(chip, link.id);
    });

    chip.appendChild(favicon);
    chip.appendChild(nameSpan);
    chip.appendChild(anchor);
    chip.appendChild(delBtn);

    return chip;
  }

  /* ── Add ── */
  function addLink(e) {
    e.preventDefault();
    const name = nameEl ? nameEl.value.trim() : '';
    const raw  = urlEl  ? urlEl.value.trim()  : '';

    if (!name) { showError('Please enter a name for the link.'); nameEl && nameEl.focus(); return; }
    if (!raw)  { showError('Please enter a URL.'); urlEl && urlEl.focus(); return; }

    const url = normaliseUrl(raw);

    if (!isValidUrl(url)) {
      showError('Please enter a valid URL (e.g. https://example.com).');
      urlEl && urlEl.focus();
      return;
    }

    showError('');
    links.push({ id: uid(), name, url });
    save();
    render();

    if (nameEl) nameEl.value = '';
    if (urlEl)  urlEl.value  = '';
    nameEl && nameEl.focus();
    Toast.show(`${name} added to Quick Links`);
  }

  /* ── Delete ── */
  function deleteLink(chip, id) {
    chip.style.transition = 'opacity 0.2s, transform 0.2s';
    chip.style.opacity = '0';
    chip.style.transform = 'scale(0.85)';
    setTimeout(() => {
      links = links.filter(l => l.id !== id);
      save();
      render();
    }, 220);
  }

  /* ── Init ── */
  function init() {
    load();
    render();
    if (form) form.addEventListener('submit', addLink);
  }

  return { init };
})();

/* ============================================================
   9. BOOTSTRAP
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  ClockWidget.init();
  NameManager.init();
  TimerWidget.init();
  TodoManager.init();
  LinksManager.init();
});
