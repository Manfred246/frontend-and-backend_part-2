const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const statusDiv = document.getElementById('app-status');

const socket = io();

function setStatus(text) {
  if (statusDiv) {
    statusDiv.textContent = text;
  }
}

function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach((btn) => btn.classList.remove('active'));
  document.getElementById(activeId).classList.add('active');
}

async function loadContent(page) {
  try {
    const response = await fetch(`/content/${page}.html`);

    if (!response.ok) {
      throw new Error(`Не удалось загрузить страницу: ${page}`);
    }

    const html = await response.text();
    contentDiv.innerHTML = html;

    if (page === 'home') {
      initNotes();
    }
  } catch (err) {
    contentDiv.innerHTML =
      '<p style="text-align:center;color:#db4437;">Ошибка загрузки страницы.</p>';
    console.error(err);
  }
}

homeBtn.addEventListener('click', () => {
  setActiveButton('home-btn');
  loadContent('home');
});

aboutBtn.addEventListener('click', () => {
  setActiveButton('about-btn');
  loadContent('about');
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    setStatus('Push-уведомления не поддерживаются в этом браузере.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
      setStatus('Push-уведомления уже включены.');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BH1g__GOGN4lQ2_WgEbL0L5OedWbgDxmQlJHEN-rIhus3bSfZYI0xvpg3IFQktGbpv7-S7pr6xDHd20ynmazg_E'
      )
    });

    await fetch('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    setStatus('Push-уведомления включены.');
  } catch (err) {
    console.error('Ошибка подписки на push:', err);
    setStatus('Не удалось включить push-уведомления.');
  }
}

async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      setStatus('Активной push-подписки нет.');
      return;
    }

    await fetch('/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });

    await subscription.unsubscribe();
    setStatus('Push-уведомления отключены.');
  } catch (err) {
    console.error('Ошибка отписки от push:', err);
    setStatus('Не удалось отключить push-уведомления.');
  }
}

function showRealtimeMessage(text) {
  const toast = document.createElement('div');
  toast.className = 'realtime-toast';
  toast.textContent = text;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function normalizeNotes(rawNotes) {
  return rawNotes.map((note) => {
    if (typeof note === 'string') {
      return {
        id: Date.now() + Math.random(),
        text: note,
        reminder: null,
        createdAt: Date.now()
      };
    }

    return {
      id: note.id || Date.now() + Math.random(),
      text: note.text || '',
      reminder: note.reminder || null,
      createdAt: note.createdAt || Date.now()
    };
  });
}

function formatReminder(reminderTimestamp) {
  if (!reminderTimestamp) {
    return '';
  }

  const date = new Date(reminderTimestamp);
  return `Напоминание: ${date.toLocaleString()}`;
}

function saveNotes(notes) {
  localStorage.setItem('notes', JSON.stringify(notes));
}

function readNotes() {
  return normalizeNotes(JSON.parse(localStorage.getItem('notes') || '[]'));
}

function initNotes() {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  const reminderForm = document.getElementById('reminder-form');
  const reminderText = document.getElementById('reminder-text');
  const reminderTime = document.getElementById('reminder-time');
  const list = document.getElementById('notes-list');

  if (!form || !input || !reminderForm || !reminderText || !reminderTime || !list) {
    return;
  }

  function loadNotes() {
    const notes = readNotes();

    list.innerHTML = notes
      .map((note) => {
        const reminderInfo = note.reminder
          ? `<div class="note-meta">⏰ ${formatReminder(note.reminder)}</div>`
          : '<div class="note-meta">Обычная заметка</div>';

        return `
          <li class="card" style="margin-bottom: 0.5rem; padding: 0.75rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
              <div style="flex:1;">
                <div class="note-text">${note.text}</div>
                ${reminderInfo}
              </div>
              <button
                class="button error"
                type="button"
                onclick="deleteNote(${note.id})"
              >
                Удалить
              </button>
            </div>
          </li>
        `;
      })
      .join('');
  }

  function addNote(text, reminderTimestamp = null) {
    const notes = readNotes();

    const newNote = {
      id: Date.now(),
      text,
      reminder: reminderTimestamp,
      createdAt: Date.now()
    };

    notes.push(newNote);
    saveNotes(notes);
    loadNotes();

    if (reminderTimestamp) {
      socket.emit('newReminder', {
        id: newNote.id,
        text: newNote.text,
        reminderTime: reminderTimestamp
      });

      setStatus('Заметка с напоминанием сохранена.');
    } else {
      socket.emit('newTask', {
        id: newNote.id,
        text: newNote.text,
        timestamp: Date.now()
      });

      setStatus('Заметка сохранена.');
    }
  }

  function deleteNote(id) {
    const notes = readNotes();
    const updatedNotes = notes.filter((note) => note.id !== id);
    saveNotes(updatedNotes);
    loadNotes();
    setStatus('Заметка удалена.');
  }

  window.deleteNote = deleteNote;

  form.onsubmit = (e) => {
    e.preventDefault();

    const text = input.value.trim();
    if (!text) {
      return;
    }

    addNote(text);
    input.value = '';
  };

  reminderForm.onsubmit = (e) => {
    e.preventDefault();

    const text = reminderText.value.trim();
    const datetime = reminderTime.value;

    if (!text || !datetime) {
      return;
    }

    const timestamp = new Date(datetime).getTime();

    if (Number.isNaN(timestamp) || timestamp <= Date.now()) {
      alert('Дата напоминания должна быть в будущем');
      return;
    }

    addNote(text, timestamp);
    reminderText.value = '';
    reminderTime.value = '';
  };

  loadNotes();
}

socket.on('connect', () => {
  console.log('Подключено к серверу WebSocket');
  setStatus('Подключено к серверу.');
});

socket.on('connect_error', (err) => {
  console.error('Ошибка подключения к WebSocket:', err.message);
  setStatus('Нет подключения к серверу.');
});

socket.on('taskAdded', (task) => {
  console.log('Задача от сервера:', task);
  showRealtimeMessage(`Новая задача: ${task.text}`);

  const notesList = document.getElementById('notes-list');
  if (!notesList) {
    return;
  }

  const notes = readNotes();
  const alreadyExists = notes.some((note) => note.id === task.id);

  if (!alreadyExists) {
    notes.push({
      id: task.id || Date.now(),
      text: task.text,
      reminder: null,
      createdAt: task.timestamp || Date.now()
    });

    saveNotes(notes);
    initNotes();
  }
});

socket.on('reminderScheduled', (reminder) => {
  showRealtimeMessage(`Напоминание запланировано: ${reminder.text}`);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', reg.scope);

      const enableBtn = document.getElementById('enable-push');
      const disableBtn = document.getElementById('disable-push');

      if (enableBtn && disableBtn) {
        const subscription = await reg.pushManager.getSubscription();

        if (subscription) {
          enableBtn.style.display = 'none';
          disableBtn.style.display = 'inline-block';
        } else {
          enableBtn.style.display = 'inline-block';
          disableBtn.style.display = 'none';
        }

        enableBtn.addEventListener('click', async () => {
          if (Notification.permission === 'denied') {
            alert('Уведомления запрещены. Разрешите их в настройках браузера.');
            return;
          }

          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
              alert('Необходимо разрешить уведомления.');
              return;
            }
          }

          await subscribeToPush();
          enableBtn.style.display = 'none';
          disableBtn.style.display = 'inline-block';
        });

        disableBtn.addEventListener('click', async () => {
          await unsubscribeFromPush();
          disableBtn.style.display = 'none';
          enableBtn.style.display = 'inline-block';
        });
      }
    } catch (err) {
      console.log('SW registration failed:', err);
      setStatus('Ошибка регистрации Service Worker.');
    }
  });
}

loadContent('home');