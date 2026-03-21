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

const ACCESS_EXPIRES_IN = '15s';
const REFRESH_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

let refreshTokens = new Set();

const createSeedUser = async (email, first_name, last_name, password, role) => ({
  id: nanoid(6),
  email,
  first_name,
  last_name,
  passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
  role,
  isBlocked: false
});

let users = await Promise.all([
  createSeedUser('admin@techstore.local', 'Admin', 'System', 'admin123', 'admin'),
  createSeedUser('seller@techstore.local', 'Seller', 'Store', 'seller123', 'seller'),
  createSeedUser('user@techstore.local', 'Regular', 'User', 'user123', 'user')
]);

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
    last_name: user.last_name,
    role: user.role,
    isBlocked: user.isBlocked
  };
}

function findUserByEmail(email) {
  return users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
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

    const user = users.find((u) => u.id === payload.sub);

    if (!user || user.isBlocked) {
      return res.status(403).json({ error: 'User is blocked or not found' });
    }

    next();
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

function validateRegisterBody(body) {
  const { email, first_name, last_name, password } = body;

  if (!email || !first_name || !last_name || !password) {
    return 'email, first_name, last_name, password are required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email';
  }

  if (String(first_name).trim().length < 2) {
    return 'first_name must contain at least 2 characters';
  }

  if (String(last_name).trim().length < 2) {
    return 'last_name must contain at least 2 characters';
  }

  if (String(password).length < 6) {
    return 'password must contain at least 6 characters';
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
      title: 'TechStore API with RBAC',
      version: '6.0.0',
      description: 'API с ролями user / seller / admin и авторизацией по email'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local server'
      }
    ],
    tags: [
      { name: 'Auth', description: 'Аутентификация' },
      { name: 'Users', description: 'Пользователи' },
      { name: 'Products', description: 'Товары' }
    ]
  },
  apis: ['./app.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.post('/api/auth/register', async (req, res) => {
  try {
    const validationError = validateRegisterBody(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { email, first_name, last_name, password, role } = req.body;
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());

    if (exists) {
      return res.status(409).json({ error: 'email already exists' });
    }

    const allowedRoles = ['user', 'seller', 'admin'];
    const userRole = allowedRoles.includes(role) ? role : 'user';

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = {
      id: nanoid(6),
      email: email.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      passwordHash,
      role: userRole,
      isBlocked: false
    };

    users.push(user);

    return res.status(201).json(sanitizeUser(user));
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = findUserByEmail(email);

    if (!user || user.isBlocked) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/refresh', (req, res) => {
  const refreshToken = req.headers['x-refresh-token'];

  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken header is required' });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find((u) => u.id === payload.sub);

    if (!user || user.isBlocked) {
      return res.status(401).json({ error: 'User not found or blocked' });
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
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const refreshToken = req.headers['x-refresh-token'];

  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }

  return res.json({ logout: true });
});

app.get('/api/auth/me', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  const user = users.find((u) => u.id === req.user.sub);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json(sanitizeUser(user));
});

app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  return res.json(users.map(sanitizeUser));
});

app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = users.find((u) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json(sanitizeUser(user));
});

app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const user = users.find((u) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { email, first_name, last_name, role, isBlocked, password } = req.body;

  if (email !== undefined) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const duplicate = users.find((u) => u.id !== user.id && u.email.toLowerCase() === normalizedEmail);
    if (duplicate) {
      return res.status(409).json({ error: 'email already exists' });
    }

    user.email = normalizedEmail;
  }

  if (first_name !== undefined) {
    if (!String(first_name).trim()) {
      return res.status(400).json({ error: 'first_name cannot be empty' });
    }
    user.first_name = String(first_name).trim();
  }

  if (last_name !== undefined) {
    if (!String(last_name).trim()) {
      return res.status(400).json({ error: 'last_name cannot be empty' });
    }
    user.last_name = String(last_name).trim();
  }

  if (role !== undefined) {
    if (!['user', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    user.role = role;
  }

  if (isBlocked !== undefined) {
    user.isBlocked = Boolean(isBlocked);
  }

  if (password !== undefined && String(password)) {
    user.passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
  }

  return res.json(sanitizeUser(user));
});

app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = users.find((u) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.isBlocked = true;
  return res.json({ blocked: true, user: sanitizeUser(user) });
});

app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
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

app.get('/api/products', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  return res.json(products);
});

app.get('/api/products/:id', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  const product = products.find((p) => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.json(product);
});

app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
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

app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
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