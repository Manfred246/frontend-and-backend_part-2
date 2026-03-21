import express from 'express';
import { nanoid } from 'nanoid';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();
const port = 3000;

const JWT_SECRET = 'access_secret';
const ACCESS_EXPIRES_IN = '15s';
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
  },
  {
    id: nanoid(6),
    title: 'LG UltraGear 27"',
    category: 'Мониторы',
    description: '144Hz игровой монитор',
    price: 39990,
    stock: 7,
    rating: 4.6,
    image: 'https://avatars.mds.yandex.net/get-mpic/17405852/2a00000198b4d418e3db20529fb7b2059467/orig'
  }
];

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001' }));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      console.log('Body:', req.body);
    }
  });
  next();
});

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

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'Missing or invalid Authorization header'
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
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

function validateProductBody(body) {
  const { title, category, description, price, stock, rating } = body;

  if (!title || !category || !description || price === undefined) {
    return 'Поля title, category, description, price обязательны';
  }

  if (Number.isNaN(Number(price)) || Number(price) <= 0) {
    return 'Поле price должно быть числом больше 0';
  }

  if (stock !== undefined && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) {
    return 'Поле stock должно быть целым числом 0 или больше';
  }

  if (
    rating !== undefined &&
    rating !== null &&
    rating !== '' &&
    (Number.isNaN(Number(rating)) || Number(rating) < 0 || Number(rating) > 5)
  ) {
    return 'Поле rating должно быть в диапазоне от 0 до 5';
  }

  return null;
}

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API интернет-магазина TechStore',
      version: '2.0.0',
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

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
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
 *           example: "abc123"
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
 *         accessToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 *           example: "https://via.placeholder.com/300"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Invalid or expired token"
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
 *         description: Пользователь успешно зарегистрирован
 *       400:
 *         description: Ошибка валидации
 *       409:
 *         description: Пользователь уже существует
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
      return res.status(409).json({
        error: 'Пользователь с таким email уже существует'
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = {
      id: nanoid(6),
      email: email.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      passwordHash
    };

    users.push(user);

    return res.status(201).json(sanitizeUser(user));
  } catch {
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему и получение JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginRequest'
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверные учетные данные
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'email and password are required'
      });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      JWT_SECRET,
      { expiresIn: ACCESS_EXPIRES_IN }
    );

    return res.json({
      accessToken,
      user: sanitizeUser(user)
    });
  } catch {
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить текущего авторизованного пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные текущего пользователя
 *       401:
 *         description: Токен отсутствует или недействителен
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  return res.json(sanitizeUser(user));
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Успешный запрос
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар найден
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', authMiddleware, (req, res) => {
  const product = products.find((p) => p.id === req.params.id);

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
 *         description: Товар создан
 *       400:
 *         description: Ошибка валидации
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
    rating:
      req.body.rating !== undefined && req.body.rating !== null && req.body.rating !== ''
        ? Number(req.body.rating)
        : null,
    image: req.body.image?.trim() || 'https://via.placeholder.com/300'
  };

  products.push(newProduct);
  return res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', authMiddleware, (req, res) => {
  const product = products.find((p) => p.id === req.params.id);

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
  product.rating =
    req.body.rating !== undefined && req.body.rating !== null && req.body.rating !== ''
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Товар удален
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  products.splice(index, 1);
  return res.status(204).send();
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api-docs`);
});