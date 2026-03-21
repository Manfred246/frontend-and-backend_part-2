import React, { useEffect, useState } from 'react';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';

export default function ProductsPage({ currentUser }) {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch {
      alert('Ошибка загрузки товаров');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = async (payload) => {
    try {
      const created = await api.createProduct(payload);
      setProducts((prev) => [created, ...prev]);
    } catch (err) {
      alert(err?.response?.data?.error || 'Ошибка создания');
    }
  };

  const handleUpdate = async (payload) => {
    if (!editingProduct) return;

    try {
      const updated = await api.updateProduct(editingProduct.id, payload);

      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? updated : p))
      );

      setEditingProduct(null);
    } catch (err) {
      alert(err?.response?.data?.error || 'Ошибка обновления');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err?.response?.data?.error || 'Ошибка удаления');
    }
  };

  return (
    <div>
      <h1>Каталог товаров</h1>

      {currentUser && (
        <section className="section">
          <h2>{editingProduct ? 'Редактировать товар' : 'Создать товар'}</h2>

          <ProductForm
            initialProduct={editingProduct}
            onSubmit={editingProduct ? handleUpdate : handleCreate}
            submitText={editingProduct ? 'Сохранить' : 'Создать'}
          />

          {editingProduct && (
            <button className="btn" onClick={() => setEditingProduct(null)}>
              Отменить редактирование
            </button>
          )}
        </section>
      )}

      <section className="grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={setEditingProduct}
            onDelete={handleDelete}
            canManage={Boolean(currentUser)}
          />
        ))}
      </section>
    </div>
  );
}