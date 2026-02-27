import express from 'express';
import { nanoid } from 'nanoid';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();
const port = 3000;

let products = [
  { id: nanoid(6), name: 'Ноутбук Asus ROG', category: 'Ноутбуки', description: 'Игровой ноутбук с RTX 3060', price: 129990, stock: 5, rating: 4.8, image: 'https://main-cdn.sbermegamarket.ru/big2/hlr-system/-18/907/881/863/201/447/600023414992b2.jpg' },
  { id: nanoid(6), name: 'iPhone 15', category: 'Смартфоны', description: 'Флагман Apple', price: 119990, stock: 8, rating: 4.9, image: 'https://avatars.mds.yandex.net/get-mpic/16488168/2a0000019aafc674dbf1dc61f04d2804bf84/orig' },
  { id: nanoid(6), name: 'Samsung Tab S9', category: 'Планшеты', description: 'AMOLED экран', price: 74990, stock: 12, rating: 4.7, image: 'https://basket-16.wbbasket.ru/vol2539/part253983/253983234/images/big/1.webp' },
  { id: nanoid(6), name: 'Sony WH-1000XM5', category: 'Аксессуары', description: 'Наушники с шумоподавлением', price: 29990, stock: 15, rating: 4.9, image: 'https://www.central.co.th/_next/image?url=https%3A%2F%2Fassets.central.co.th%2Ffile-assets%2FCDSPIM%2Fweb%2FImage%2FMKP1527%2FSONY-WH1000XM5OVEREARWIRELESSBLUETOOTHHEADPHONESILVER-MKP1527068-1.webp&w=640&q=75' },
  { id: nanoid(6), name: 'LG UltraGear 27"', category: 'Мониторы', description: '144Hz игровой монитор', price: 39990, stock: 7, rating: 4.6, image: 'https://avatars.mds.yandex.net/get-mpic/17405852/2a00000198b4d418e3db20529fb7b2059467/orig' },
  { id: nanoid(6), name: 'Logitech MX', category: 'Аксессуары', description: 'Механическая клавиатура', price: 15990, stock: 20, rating: 4.7, image: 'https://avatars.mds.yandex.net/get-mpic/1363071/img_id1479193677521036715.jpeg/orig' },
  { id: nanoid(6), name: 'Razer DeathAdder', category: 'Аксессуары', description: 'Игровая мышь', price: 8990, stock: 25, rating: 4.8, image: 'https://via.placeholder.com/300' },
  { id: nanoid(6), name: 'Samsung SSD 1TB', category: 'Комплектующие', description: 'NVMe M.2 SSD', price: 11990, stock: 18, rating: 5.0, image: 'https://via.placeholder.com/300' },
  { id: nanoid(6), name: 'RTX 4070 Ti', category: 'Комплектующие', description: '12GB видеокарта', price: 89990, stock: 3, rating: 4.9, image: 'https://via.placeholder.com/300' },
  { id: nanoid(6), name: 'HP LaserJet', category: 'Оргтехника', description: 'Лазерный принтер', price: 24990, stock: 6, rating: 4.4, image: 'https://via.placeholder.com/300' },
  { id: nanoid(6), name: 'TP-Link AX11000', category: 'Сетевое оборудование', description: 'Wi-Fi 6 роутер', price: 27990, stock: 9, rating: 4.7, image: 'https://via.placeholder.com/300' },
];

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001' }));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API интернет-магазина TechStore',
      version: '1.0.0',
      description: 'API для управления товарами в интернет-магазине электроники',
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
      {
        name: 'Products',
        description: 'Управление товарами'
      }
    ]
  },
  apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор товара (генерируется автоматически)
 *           example: "abc123"
 *         name:
 *           type: string
 *           description: Название товара
 *           example: "Ноутбук Asus ROG Strix"
 *         category:
 *           type: string
 *           description: Категория товара
 *           example: "Ноутбуки"
 *         description:
 *           type: string
 *           description: Описание товара
 *           example: "Игровой ноутбук с RTX 3060, 16GB RAM, 512GB SSD"
 *         price:
 *           type: number
 *           description: Цена товара в рублях
 *           example: 129990
 *         stock:
 *           type: integer
 *           description: Количество товара на складе
 *           example: 5
 *         rating:
 *           type: number
 *           description: Рейтинг товара (от 0 до 5)
 *           example: 4.8
 *         image:
 *           type: string
 *           description: URL изображения товара
 *           example: "https://via.placeholder.com/300x200?text=Asus+ROG"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Сообщение об ошибке
 *           example: "Product not found"
 */


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

app.get('/api/products', (req, res) => res.json(products));

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
 *         example: "abc123"
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
  const product = products.find(p => p.id === req.params.id);
  product ? res.json(product) : res.status(404).json({ error: 'Not found' });
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
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Новый товар"
 *               category:
 *                 type: string
 *                 example: "Ноутбуки"
 *               description:
 *                 type: string
 *                 example: "Описание нового товара"
 *               price:
 *                 type: number
 *                 example: 99990
 *               stock:
 *                 type: integer
 *                 example: 10
 *               rating:
 *                 type: number
 *                 example: 4.5
 *               image:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
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
  const newProduct = { id: nanoid(6), ...req.body };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить существующий товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *         example: "abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Обновленное название"
 *               category:
 *                 type: string
 *                 example: "Смартфоны"
 *               description:
 *                 type: string
 *                 example: "Обновленное описание"
 *               price:
 *                 type: number
 *                 example: 89990
 *               stock:
 *                 type: integer
 *                 example: 15
 *               rating:
 *                 type: number
 *                 example: 4.9
 *               image:
 *                 type: string
 *                 example: "https://example.com/new-image.jpg"
 *     responses:
 *       200:
 *         description: Товар успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет полей для обновления
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

app.patch('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  Object.assign(product, req.body);
  res.json(product);
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
 *         example: "abc123"
 *     responses:
 *       204:
 *         description: Товар успешно удален (нет тела ответа)
 *       404:
 *         description: Товар не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

app.delete('/api/products/:id', (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Документация Swagger доступна на http://localhost:${port}/api-docs`);
});