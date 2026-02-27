import React, { useEffect, useState } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    stock: '',
    rating: '',
    image: ''
  });

  const categories = [
    'Ноутбуки',
    'Смартфоны', 
    'Планшеты',
    'Мониторы',
    'Комплектующие',
    'Аксессуары',
    'Оргтехника',
    'Сетевое оборудование'
  ];
  
  useEffect(() => {
    if (open) {
      setFormData({
        name: initialProduct?.name || '',
        category: initialProduct?.category || categories[0],
        description: initialProduct?.description || '',
        price: initialProduct?.price?.toString() || '',
        stock: initialProduct?.stock?.toString() || '',
        rating: initialProduct?.rating?.toString() || '',
        image: initialProduct?.image || ''
      });
    }
  }, [open, initialProduct]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Введите название товара');
      return;
    }
    
    if (!formData.category) {
      alert('Выберите категорию');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Введите описание товара');
      return;
    }
    
    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Введите корректную цену (больше 0)');
      return;
    }
    
    const stockNum = Number(formData.stock);
    if (isNaN(stockNum) || stockNum < 0) {
      alert('Введите корректное количество (0 или больше)');
      return;
    }
    
    const ratingNum = formData.rating ? Number(formData.rating) : null;
    if (ratingNum && (ratingNum < 0 || ratingNum > 5)) {
      alert('Рейтинг должен быть от 0 до 5');
      return;
    }

    onSubmit({
      id: initialProduct?.id,
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim(),
      price: priceNum,
      stock: stockNum,
      rating: ratingNum,
      image: formData.image.trim() || 'https://via.placeholder.com/300'
    });
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">
            {mode === 'edit' ? 'Редактирование товара' : 'Добавление товара'}
          </h2>
          <button className="iconBtn" onClick={onClose}>✕</button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название товара *
            <input
              type="text"
              name="name"
              className="input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Например, Ноутбук Asus ROG"
              autoFocus
              required
            />
          </label>

          <label className="label">
            Категория *
            <select
              name="category"
              className="select"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          <label className="label">
            Описание *
            <textarea
              name="description"
              className="textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Краткое описание товара..."
              required
            />
          </label>

          <div className="row">
            <label className="label">
              Цена (₽) *
              <input
                type="number"
                name="price"
                className="input"
                value={formData.price}
                onChange={handleChange}
                placeholder="1000"
                min="0"
                step="1"
                required
              />
            </label>

            <label className="label">
              На складе (шт.) *
              <input
                type="number"
                name="stock"
                className="input"
                value={formData.stock}
                onChange={handleChange}
                placeholder="10"
                min="0"
                step="1"
                required
              />
            </label>
          </div>

          <div className="row">
            <label className="label">
              Рейтинг (0-5)
              <input
                type="number"
                name="rating"
                className="input"
                value={formData.rating}
                onChange={handleChange}
                placeholder="4.5"
                min="0"
                max="5"
                step="0.1"
              />
            </label>

            <label className="label">
              URL фото
              <input
                type="text"
                name="image"
                className="input"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/photo.jpg"
              />
            </label>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === 'edit' ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}