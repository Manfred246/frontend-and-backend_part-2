import React, { useEffect, useState } from 'react';

const initialState = {
  title: '',
  category: '',
  description: '',
  price: '',
  stock: '',
  rating: '',
  image: ''
};

export default function ProductForm({ initialProduct, onSubmit, submitText }) {
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        title: initialProduct.title || '',
        category: initialProduct.category || '',
        description: initialProduct.description || '',
        price: initialProduct.price?.toString() || '',
        stock: initialProduct.stock?.toString() || '',
        rating: initialProduct.rating?.toString() || '',
        image: initialProduct.image || ''
      });
    } else {
      setFormData(initialState);
    }
  }, [initialProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      title: formData.title.trim(),
      category: formData.category.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      stock: Number(formData.stock),
      rating: formData.rating ? Number(formData.rating) : null,
      image: formData.image.trim() || 'https://via.placeholder.com/300'
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <input
        className="input"
        name="title"
        placeholder="Название"
        value={formData.title}
        onChange={handleChange}
        required
      />

      <input
        className="input"
        name="category"
        placeholder="Категория"
        value={formData.category}
        onChange={handleChange}
        required
      />

      <textarea
        className="input textarea"
        name="description"
        placeholder="Описание"
        value={formData.description}
        onChange={handleChange}
        required
      />

      <input
        className="input"
        type="number"
        name="price"
        placeholder="Цена"
        value={formData.price}
        onChange={handleChange}
        required
      />

      <input
        className="input"
        type="number"
        name="stock"
        placeholder="Количество"
        value={formData.stock}
        onChange={handleChange}
        required
      />

      <input
        className="input"
        type="number"
        step="0.1"
        name="rating"
        placeholder="Рейтинг"
        value={formData.rating}
        onChange={handleChange}
      />

      <input
        className="input"
        name="image"
        placeholder="URL изображения"
        value={formData.image}
        onChange={handleChange}
      />

      <button className="btn btn--primary" type="submit">
        {submitText}
      </button>
    </form>
  );
}