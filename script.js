/* ═══════════════════════════════════════════════
   FOCUS — To-Do List  |  script.js
   Features: Add / Complete / Delete / Filter /
             localStorage / Stats / Progress bar
═══════════════════════════════════════════════ */

// ── State ─────────────────────────────────────────
let tasks  = [];
let filter = 'all';   // 'all' | 'pending' | 'completed'

// ── DOM References ────────────────────────────────
const taskInput    = document.getElementById('taskInput');
const addBtn       = document.getElementById('addBtn');
const messageDiv = document.getElementById("message");
addBtn.addEventListener("click", () => {
  messageDiv.textContent = "Task added successfully! ✅";
  setTimeout(() => messageDiv.textContent = "", 2000); // 2 sec me auto hide
});

const taskList     = document.getElementById('taskList');
const emptyState   = document.getElementById('emptyState');
const clearBtn     = document.getElementById('clearcompleted');
const mesageDiv = document.getElementById("mesage");

clearcompleted.addEventListener("click", () => {
  mesageDiv.textContent = "🗑️ Completed task deleted.";
  setTimeout(() => mesageDiv.textContent = "", 2000); // 2 sec me auto hide
});








const filterBtns   = document.querySelectorAll('.filter-btn');
const currentDate  = document.getElementById('currentDate');
const totalCount   = document.getElementById('totalCount');
const pendingCount = document.getElementById('pendingCount');
const doneCount    = document.getElementById('doneCount');
const progressBar  = document.getElementById('progressBar');

// ── Utilities ─────────────────────────────────────

/** Generate a unique ID */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Display today's date in the header */
function renderDate() {
  const now = new Date();
  currentDate.textContent = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric'
  }).toUpperCase();
}

// ── LocalStorage ──────────────────────────────────

/** Persist the current tasks array to localStorage */
function saveTasks() {
  localStorage.setItem('focus_tasks', JSON.stringify(tasks));
}

/** Load tasks from localStorage on app start */
function loadTasks() {
  const stored = localStorage.getItem('focus_tasks');
  tasks = stored ? JSON.parse(stored) : [];
}

// ── Task Operations ───────────────────────────────

/**
 * Add a new task from the input field.
 * Validates input, creates task object, saves & re-renders.
 */
function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    // Shake the input to signal it's empty
    taskInput.classList.add('shake');
    setTimeout(() => taskInput.classList.remove('shake'), 400);
    taskInput.focus();
    return;
  }

  const newTask = {
    id:        generateId(),
    text:      text,
    completed: false,
    createdAt: Date.now()
  };

  tasks.unshift(newTask);   // Add to top of list
  saveTasks();
  renderAll();

  taskInput.value = '';
  taskInput.focus();
}

/**
 * Toggle the completed state of a task by its ID.
 * @param {string} id
 */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderAll();
  }
}

/**
 * Delete a task by ID. Plays a fade-out animation first.
 * @param {string} id
 */
function deleteTask(id) {
  const li = taskList.querySelector(`[data-id="${id}"]`);
  if (!li) return;

  li.classList.add('removing');

  // Wait for animation to finish before removing from state
  li.addEventListener('animationend', () => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderAll();
  }, { once: true });
}

/**
 * Delete all tasks that are marked as completed.
 */
function clearCompleted() {
  const completedItems = taskList.querySelectorAll('.task-item.completed');
  if (completedItems.length === 0) return;

  let pending = completedItems.length;

  completedItems.forEach(li => {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      pending--;
      if (pending === 0) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderAll();
      }
    }, { once: true });
  });
}

// ── Filter ────────────────────────────────────────

/**
 * Set the active filter and re-render the list.
 * @param {'all'|'pending'|'completed'} newFilter
 */
function setFilter(newFilter) {
  filter = newFilter;

  filterBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  renderAll();
}

/**
 * Return the subset of tasks based on the current filter.
 * @returns {Array}
 */
function getFilteredTasks() {
  if (filter === 'completed') return tasks.filter(t => t.completed);
  if (filter === 'pending')   return tasks.filter(t => !t.completed);
  return tasks;
}

// ── Rendering ─────────────────────────────────────

/**
 * Build and return a <li> element for a task.
 * @param {Object} task
 * @returns {HTMLElement}
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' completed' : '');
  li.setAttribute('data-id', task.id);
  li.setAttribute('role', 'listitem');
  li.title = 'Click to toggle · Double-click to delete';

  // Custom checkbox (visual only — interaction on the <li>)
  const checkbox = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked   = task.completed;
  checkbox.setAttribute('tabindex', '-1');  // li handles focus

  // Task label
  const span = document.createElement('span');
  span.className   = 'task-text';
  span.textContent = task.text;

  // Delete hint
  const hint = document.createElement('span');
  hint.className   = 'delete-hint';
  hint.textContent = '2× delete';

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(hint);

  // Single click → toggle
  li.addEventListener('click', () => toggleTask(task.id));

  // Double click → delete
  li.addEventListener('dblclick', (e) => {
    e.preventDefault();       // Prevent text selection on fast dblclick
    deleteTask(task.id);
  });

  return li;
}

/**
 * Update stats counters and the progress bar.
 */
function renderStats() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.completed).length;
  const pending = total - done;
  const pct     = total > 0 ? (done / total) * 100 : 0;

  totalCount.textContent   = total;
  doneCount.textContent    = done;
  pendingCount.textContent = pending;
  progressBar.style.width  = pct + '%';
}

/**
 * Main render function — refreshes the task list and stats.
 */
function renderAll() {
  const visible = getFilteredTasks();

  // Clear and rebuild the list
  taskList.innerHTML = '';

  if (visible.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    visible.forEach(task => {
      taskList.appendChild(createTaskElement(task));
    });
  }

  renderStats();
}

// ── Event Listeners ───────────────────────────────

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

clearBtn.addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// ── Shake animation (CSS class approach) ──────────
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }
  .shake { animation: shake 0.35s ease; border-color: #c0392b !important; }
`;
document.head.appendChild(style);

// ── Initialise ────────────────────────────────────
renderDate();
loadTasks();
renderAll();



