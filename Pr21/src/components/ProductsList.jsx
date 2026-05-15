import React from 'react';
import ProductItem from './ProductItem';

export default function ProductsList({ products, onEdit, onDelete, canManage }) {
  if (!products.length) {
    return <div className="empty">Товаров пока нет</div>;
  }

  return (
    <div className="grid">
      {products.map((product) => (
        <ProductItem
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          canManage={canManage}
        />
      ))}
    </div>
  );
}