import React, { useState } from 'react';

export default function ProductItem({ product, onEdit, onDelete }) {
  const [imageError, setImageError] = useState(false);
  const isLowStock = product.stock < 5;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="productCard">
      <div className="productImageContainer">
        {!imageError && product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="productImage"
            onError={handleImageError}
          />
        ) : (
          <div className="productImagePlaceholder">
            <span>📷</span>
            <span>Нет фото</span>
          </div>
        )}
      </div>
      
      <div className="productInfo">
        <div className="productHeader">
          <h3 className="productName">{product.name}</h3>
          {product.rating && (
            <span className="productRating">★ {product.rating}</span>
          )}
        </div>

        <div className="productCategory">{product.category}</div>
        
        <p className="productDescription">{product.description}</p>

        <div className="productDetails">
          <span className="productPrice">{product.price.toLocaleString()}</span>
          <span className={`productStock ${isLowStock ? 'lowStock' : ''}`}>
            {product.stock} шт.
          </span>
        </div>

        <div className="productActions">
          <button className="btn" onClick={() => onEdit(product)}>
            ✎ Редактировать
          </button>
          <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
            × Удалить
          </button>
        </div>
      </div>
    </div>
  );
}