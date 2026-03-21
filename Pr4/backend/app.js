import express from 'express';
import { nanoid } from 'nanoid';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();
const port = 3000;

const ACCESS_SECRET = 'access_secret';
const REFRESH_SECRET = 'refresh_secret';

const ACCESS_EXPIRES_IN = '15s'; // для демонстрации на защите
const REFRESH_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

let users = [];
let refreshTokens = new Set();

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
  }
];

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001' }));

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

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
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
    const payload = jwt.verify(token, ACCESS_SECRET);
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
      version: '4.0.0',
      description: 'API с access и refresh токенами'
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
 *     refreshHeader:
 *       type: apiKey
 *       in: header
 *       name: x-refresh-token
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
 *         email:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *     LoginResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/UserResponse'
 *     RefreshResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
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
 *         title:
 *           type: string
 *         category:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         rating:
 *           type: number
 *         image:
 *           type: string
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
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
 *     summary: Вход в систему и получение пары токенов
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Успешный вход
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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.add(refreshToken);

    return res.json({
      accessToken,
      refreshToken,
      user: sanitizeUser(user)
    });
  } catch {
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить пару токенов по refresh-токену из заголовка
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-refresh-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Refresh token
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 */
app.post('/api/auth/refresh', (req, res) => {
  const refreshToken = req.headers['x-refresh-token'];

  if (!refreshToken) {
    return res.status(400).json({
      error: 'refreshToken header is required'
    });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({
      error: 'Invalid refresh token'
    });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find((u) => u.id === payload.sub);

    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    refreshTokens.delete(refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.add(newRefreshToken);

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired refresh token'
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Выход из системы
 *     tags: [Auth]
 */
app.post('/api/auth/logout', (req, res) => {
  const refreshToken = req.headers['x-refresh-token'];

  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }

  return res.json({ logout: true });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.sub);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json(sanitizeUser(user));
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
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
 *     summary: Создать товар
 *     tags: [Products]
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