import express from 'express';
import { nanoid } from 'nanoid';
import cors from 'cors';

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

app.get('/api/products', (req, res) => res.json(products));

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  product ? res.json(product) : res.status(404).json({ error: 'Not found' });
});

app.post('/api/products', (req, res) => {
  const newProduct = { id: nanoid(6), ...req.body };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.patch('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  Object.assign(product, req.body);
  res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});