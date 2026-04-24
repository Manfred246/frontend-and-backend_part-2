const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/practice20_db')
  .then(() => {
    console.log('Подключение к MongoDB успешно');
  })
  .catch((error) => {
    console.error('Ошибка подключения к MongoDB:', error);
  });

const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.send('API MongoDB is working');
});

// Создание пользователя
app.post('/api/users', async (req, res) => {
  try {
    const { first_name, last_name, age } = req.body;

    if (!first_name || !last_name || age === undefined) {
      return res.status(400).json({
        message: 'first_name, last_name и age обязательны'
      });
    }

    const user = new User({
      first_name,
      last_name,
      age
    });

    await user.save();

    res.status(201).json(user);
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение всех пользователей
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение пользователя по id
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление пользователя
app.patch('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const updatedData = {
      ...req.body,
      updated_at: Date.now()
    };

    const user = await User.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление пользователя
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    res.json({
      message: 'Пользователь удалён',
      user
    });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});