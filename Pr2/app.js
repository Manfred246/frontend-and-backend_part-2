const express = require('express');
const app = express();
const port = 3000;

let goods = [
    { id: 1, name: 'Адаптер', price: 25000 },
    { id: 2, name: 'Монитор', price: 10000 },
    { id: 3, name: 'Клавиатура', price: 15000 },
    { id: 4, name: 'Наушники', price: 30000 },
];

app.use(express.json());

app.get('/goods', (req, res) => {
    res.json(goods);
});

app.post('/goods', (req, res) => {
    const { name, price } = req.body;
    const newGood = {id: Date.now(), name, price};
    goods.push(newGood);
    res.status(201).json(newGood);
});

app.get('/goods/:id', (req, res) => {
    const good = goods.find(g => g.id == req.params.id);
    if (!good) return res.status(404).json({error: 'Товар не найден'});
    res.json(good);
});

app.patch('/goods/:id', (req, res) => {
    const good = goods.find(g => g.id == req.params.id);
    if (!good) return res.status(404).json({error: 'Товар не найден'});

    const {name, price} = req.body;
    if (name) good.name = name;
    if (price) good.price = price;
    res.json(good);
});

app.delete('/goods/:id', (req, res) => {
    goods = goods.filter(g => g.id != req.params.id);
    res.json({message: 'Товар удален'});
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});