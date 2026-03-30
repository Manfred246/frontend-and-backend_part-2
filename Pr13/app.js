const STORAGE_KEY = 'offline-todos';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const clearCompletedButton = document.getElementById('clear-completed');
const networkStatus = document.getElementById('network-status');

function getTodos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function renderTodos() {
  const todos = getTodos();
  list.innerHTML = '';

  emptyState.style.display = todos.length ? 'none' : 'block';

  todos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = 'todo-item';

    const main = document.createElement('div');
    main.className = 'todo-main';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const text = document.createElement('span');
    text.className = `todo-text ${todo.completed ? 'done' : ''}`;
    text.textContent = todo.text;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'icon-button';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Удалить';
    deleteButton.addEventListener('click', () => deleteTodo(todo.id));

    main.append(checkbox, text);
    item.append(main, deleteButton);
    list.append(item);
  });
}

function addTodo(text) {
  const todos = getTodos();
  todos.push({
    id: Date.now().toString(),
    text,
    completed: false,
  });
  saveTodos(todos);
  renderTodos();
}

function toggleTodo(id) {
  const todos = getTodos().map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  saveTodos(todos);
  renderTodos();
}

function deleteTodo(id) {
  const todos = getTodos().filter((todo) => todo.id !== id);
  saveTodos(todos);
  renderTodos();
}

function clearCompleted() {
  const todos = getTodos().filter((todo) => !todo.completed);
  saveTodos(todos);
  renderTodos();
}

function updateNetworkStatus() {
  if (navigator.onLine) {
    networkStatus.textContent = 'Онлайн';
    networkStatus.classList.remove('offline');
  } else {
    networkStatus.textContent = 'Офлайн';
    networkStatus.classList.add('offline');
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addTodo(text);
  input.value = '';
  input.focus();
});

clearCompletedButton.addEventListener('click', clearCompleted);
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

renderTodos();
updateNetworkStatus();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker зарегистрирован:', registration.scope);
    } catch (error) {
      console.error('Ошибка регистрации Service Worker:', error);
    }
  });
}
