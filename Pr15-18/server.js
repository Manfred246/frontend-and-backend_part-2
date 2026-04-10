const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const webpush = require('web-push');
const cors = require('cors');
const path = require('path');

const vapidKeys = {
  publicKey: 'BH1g__GOGN4lQ2_WgEbL0L5OedWbgDxmQlJHEN-rIhus3bSfZYI0xvpg3IFQktGbpv7-S7pr6xDHd20ynmazg_E',
  privateKey: 'I8Jr6lxZnJyrwJ9-a2_O_5hJbx5l_Aijv00etSoD7NY'
};

webpush.setVapidDetails(
  'mailto:manfredkun@yandex.ru',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

const subscriptions = [];
const reminders = new Map();

const sslOptions = {
  cert: fs.readFileSync(path.join(__dirname, 'localhost+2.pem')),
  key: fs.readFileSync(path.join(__dirname, 'localhost+2-key.pem'))
};

const server = https.createServer(sslOptions, app);
const io = socketIo(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST']
  }
});

function sendPushToAll(payload) {
  subscriptions.forEach((sub) => {
    webpush.sendNotification(sub, payload).catch((err) => {
      console.error('Push error:', err.message);
    });
  });
}

function scheduleReminder(reminder) {
  const delay = reminder.reminderTime - Date.now();

  if (delay <= 0) {
    return false;
  }

  const timeoutId = setTimeout(() => {
    const payload = JSON.stringify({
      title: '⏰ Напоминание',
      body: reminder.text,
      reminderId: reminder.id
    });

    sendPushToAll(payload);
    reminders.delete(reminder.id);
  }, delay);

  reminders.set(reminder.id, {
    timeoutId,
    text: reminder.text,
    reminderTime: reminder.reminderTime
  });

  return true;
}

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);

  socket.on('newTask', (task) => {
    io.emit('taskAdded', task);

    const payload = JSON.stringify({
      title: 'Новая задача',
      body: task.text
    });

    sendPushToAll(payload);
  });

  socket.on('newReminder', (reminder) => {
    const scheduled = scheduleReminder(reminder);

    if (scheduled) {
      io.emit('reminderScheduled', reminder);
      console.log('Напоминание запланировано:', reminder.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

app.post('/subscribe', (req, res) => {
  const newSubscription = req.body;
  const exists = subscriptions.some((sub) => sub.endpoint === newSubscription.endpoint);

  if (!exists) {
    subscriptions.push(newSubscription);
  }

  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  const index = subscriptions.findIndex((sub) => sub.endpoint === endpoint);

  if (index !== -1) {
    subscriptions.splice(index, 1);
  }

  res.status(200).json({ message: 'Подписка удалена' });
});

app.post('/snooze', (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);

  if (!reminderId || !reminders.has(reminderId)) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const reminder = reminders.get(reminderId);
  clearTimeout(reminder.timeoutId);

  const newDelay = 5 * 60 * 1000;
  const newTimeoutId = setTimeout(() => {
    const payload = JSON.stringify({
      title: 'Напоминание отложено',
      body: reminder.text,
      reminderId
    });

    sendPushToAll(payload);
    reminders.delete(reminderId);
  }, newDelay);

  reminders.set(reminderId, {
    timeoutId: newTimeoutId,
    text: reminder.text,
    reminderTime: Date.now() + newDelay
  });

  return res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`HTTPS сервер запущен на https://localhost:${PORT}`);
});