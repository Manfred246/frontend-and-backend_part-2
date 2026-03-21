import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await api.getProductById(id);
        setProduct(data);
      } catch (err) {
        alert(err?.response?.data?.error || 'Ошибка загрузки товара');
      }
    };

    loadProduct();
  }, [id]);

  if (!product) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="details">
      <Link to="/" className="btn">← Назад</Link>

      <div className="details__card">
        <img
          className="details__image"
          src={product.image || 'https://via.placeholder.com/300'}
          alt={product.title}
        />

        <div className="details__content">
          <h1>{product.title}</h1>
          <p><strong>Категория:</strong> {product.category}</p>
          <p><strong>Описание:</strong> {product.description}</p>
          <p><strong>Цена:</strong> {product.price} ₽</p>
          <p><strong>Остаток:</strong> {product.stock}</p>
          <p><strong>Рейтинг:</strong> {product.rating ?? '—'}</p>
          <p><strong>ID:</strong> {product.id}</p>
        </div>
      </div>
    </div>
  );
}