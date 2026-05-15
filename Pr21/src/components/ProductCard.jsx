import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product, onEdit, onDelete, canEdit, canDelete }) {
  return (
    <div className="card">
      <img
        className="card__image"
        src={product.image || 'https://via.placeholder.com/300'}
        alt={product.title}
      />

      <div className="card__body">
        <h3 className="card__title">{product.title}</h3>
        <div className="card__category">{product.category}</div>
        <p className="card__description">{product.description}</p>

        <div className="card__meta">
          <span className="card__price">{product.price} ₽</span>
          <span className="card__stock">Остаток: {product.stock}</span>
        </div>

        <div className="card__actions">
          <Link to={`/products/${product.id}`} className="btn">
            Подробнее
          </Link>

          {canEdit && (
            <button className="btn" onClick={() => onEdit(product)}>
              Изменить
            </button>
          )}

          {canDelete && (
            <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
              Удалить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}