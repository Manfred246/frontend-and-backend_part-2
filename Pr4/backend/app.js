import express from 'express';
import { nanoid } from 'nanoid';
import cors from 'cors';
import bcrypt from 'bcrypt';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();
const port = 3000;
const SALT_ROUNDS = 10;

let users = [];

let products = [
  {
    id: nanoid(6),
    title: 'Ноутбук Asus ROG',
    category: 'Ноутбуки',
    description: 'Игровой ноутбук с RTX 3060',
    price: 129990,
    stock: 5,
    rating: 4.8,
    image: 'https://main-cdn.sbermegamarket.ru/big2/hlr-system/-18/907/881/863/201/447/600023414992b2.jpg'
  },
  {
    id: nanoid(6),
    title: 'iPhone 15',
    category: 'Смартфоны',
    description: 'Флагман Apple',
    price: 119990,
    stock: 8,
    rating: 4.9,
    image: 'https://avatars.mds.yandex.net/get-mpic/16488168/2a0000019aafc674dbf1dc61f04d2804bf84/orig'
  },
  {
    id: nanoid(6),
    title: 'Samsung Tab S9',
    category: 'Планшеты',
    description: 'AMOLED экран',
    price: 74990,
    stock: 12,
    rating: 4.7,
    image: 'https://basket-16.wbbasket.ru/vol2539/part253983/253983234/images/big/1.webp'
  },
  {
    id: nanoid(6),
    title: 'Sony WH-1000XM5',
    category: 'Аксессуары',
    description: 'Наушники с шумоподавлением',
    price: 29990,
    stock: 15,
    rating: 4.9,
    image: 'https://www.central.co.th/_next/image?url=https%3A%2F%2Fassets.central.co.th%2Ffile-assets%2FCDSPIM%2Fweb%2FImage%2FMKP1527%2FSONY-WH1000XM5OVEREARWIRELESSBLUETOOTHHEADPHONESILVER-MKP1527068-1.webp&w=640&q=75'
  }
];

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001' }));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      console.log('Body:', req.body);
    }
  });
  next();
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API интернет-магазина TechStore',
      version: '1.0.0',
      description: 'API для авторизации пользователей и управления товарами',
      contact: {
        name: 'TechStore Support',
        email: 'support@techstore.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Локальный сервер разработки'
      }
    ],
    tags: [
      { name: 'Auth', description: 'Аутентификация пользователей' },
      { name: 'Products', description: 'Управление товарами' }
    ]
  },
  apis: ['./app.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name
  };
}

function findUserByEmail(email) {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function findProductById(id) {
  return products.find((p) => p.id === id);
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

function validateRegisterBody(body) {
  const { email, first_name, last_name, password } = body;

  if (!email || !first_name || !last_name || !password) {
    return 'Поля email, first_name, last_name, password обязательны';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Некорректный email';
  }

  if (String(password).length < 6) {
    return 'Пароль должен содержать минимум 6 символов';
  }

  return null;
}

function validateProductBody(body, { partial = false } = {}) {
  const requiredFields = ['title', 'category', 'description', 'price'];

  if (!partial) {
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return `Поле ${field} обязательно`;
      }
    }
  }

  if (body.title !== undefined && !String(body.title).trim()) {
    return 'Поле title не может быть пустым';
  }

  if (body.category !== undefined && !String(body.category).trim()) {
    return 'Поле category не может быть пустым';
  }

  if (body.description !== undefined && !String(body.description).trim()) {
    return 'Поле description не может быть пустым';
  }

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (Number.isNaN(price) || price <= 0) {
      return 'Поле price должно быть числом больше 0';
    }
  }

  if (body.stock !== undefined) {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      return 'Поле stock должно быть целым числом 0 или больше';
    }
  }

  if (body.rating !== undefined && body.rating !== null && body.rating !== '') {
    const rating = Number(body.rating);
    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      return 'Поле rating должно быть в диапазоне от 0 до 5';
    }
  }

  return null;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - first_name
 *         - last_name
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: "ivan@example.com"
 *         first_name:
 *           type: string
 *           example: "Иван"
 *         last_name:
 *           type: string
 *           example: "Иванов"
 *         password:
 *           type: string
 *           example: "qwerty123"
 *     UserLoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: "ivan@example.com"
 *         password:
 *           type: string
 *           example: "qwerty123"
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "ab12cd"
 *         email:
 *           type: string
 *           example: "ivan@example.com"
 *         first_name:
 *           type: string
 *           example: "Иван"
 *         last_name:
 *           type: string
 *           example: "Иванов"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         login:
 *           type: boolean
 *           example: true
 *         user:
 *           $ref: '#/components/schemas/UserResponse'
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - category
 *         - description
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           example: "abc123"
 *         title:
 *           type: string
 *           example: "Ноутбук Asus ROG Strix"
 *         category:
 *           type: string
 *           example: "Ноутбуки"
 *         description:
 *           type: string
 *           example: "Игровой ноутбук с RTX 3060, 16GB RAM, 512GB SSD"
 *         price:
 *           type: number
 *           example: 129990
 *         stock:
 *           type: integer
 *           example: 5
 *         rating:
 *           type: number
 *           example: 4.8
 *         image:
 *           type: string
 *           example: "https://via.placeholder.com/300x200?text=Asus+ROG"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Product not found"
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegisterRequest'
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Пользователь уже существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const validationError = validateRegisterBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { email, first_name, last_name, password } = req.body;

    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    const newUser = {
      id: nanoid(6),
      email: email.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      password: await hashPassword(password)
    };

    users.push(newUser);

    return res.status(201).json(sanitizeUser(newUser));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginRequest'
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Отсутствуют обязательные поля
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Неверный пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Поля email и password обязательны' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const isAuthenticated = await verifyPassword(password, user.password);

    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }

    return res.status(200).json({
      login: true,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Успешный запрос. Возвращает массив товаров.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/products/:id', (req, res) => {
  const product = findProductById(req.params.id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/products', (req, res) => {
  const validationError = validateProductBody(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const newProduct = {
    id: nanoid(6),
    title: String(req.body.title).trim(),
    category: String(req.body.category).trim(),
    description: String(req.body.description).trim(),
    price: Number(req.body.price),
    stock: req.body.stock !== undefined ? Number(req.body.stock) : 0,
    rating: req.body.rating !== undefined && req.body.rating !== null && req.body.rating !== ''
      ? Number(req.body.rating)
      : null,
    image: req.body.image?.trim() || 'https://via.placeholder.com/300'
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить параметры товара
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Товар успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.put('/api/products/:id', (req, res) => {
  const product = findProductById(req.params.id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const validationError = validateProductBody(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  product.title = String(req.body.title).trim();
  product.category = String(req.body.category).trim();
  product.description = String(req.body.description).trim();
  product.price = Number(req.body.price);
  product.stock = req.body.stock !== undefined ? Number(req.body.stock) : 0;
  product.rating = req.body.rating !== undefined && req.body.rating !== null && req.body.rating !== ''
    ? Number(req.body.rating)
    : null;
  product.image = req.body.image?.trim() || 'https://via.placeholder.com/300';

  return res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удален
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  products.splice(index, 1);
  return res.status(204).send();
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Документация Swagger доступна на http://localhost:${port}/api-docs`);
});