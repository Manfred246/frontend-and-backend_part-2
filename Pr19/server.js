const express = require('express');
const pool = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is working');
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

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, age)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [first_name, last_name, age]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение всех пользователей
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users ORDER BY id ASC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение пользователя по id
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление пользователя
app.patch('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, age } = req.body;

    const checkUser = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (checkUser.rows.length === 0) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    const currentUser = checkUser.rows[0];

    const updatedFirstName = first_name ?? currentUser.first_name;
    const updatedLastName = last_name ?? currentUser.last_name;
    const updatedAge = age ?? currentUser.age;

    const result = await pool.query(
      `UPDATE users
       SET first_name = $1,
           last_name = $2,
           age = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [updatedFirstName, updatedLastName, updatedAge, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление пользователя
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    res.json({
      message: 'Пользователь удалён',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});