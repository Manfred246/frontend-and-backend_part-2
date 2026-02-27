import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ProductsPage.scss';
import ProductsList from '../../components/ProductsList';
import ProductModal from '../../components/ProductModal';
import { api } from '../../api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);
  
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await api.getProducts();
        if (isMounted) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Ошибка загрузки:', err);
        if (isMounted) {
          alert('Ошибка загрузки товаров');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (modalOpen) {
      scrollPositionRef.current = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollPositionRef.current);
    }
  }, [modalOpen]);

  const openCreate = useCallback(() => {
    setModalMode('create');
    setEditingProduct(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((product) => {
    setModalMode('edit');
    setEditingProduct(product);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
  }, []);

  const handleDelete = useCallback(async (id) => {
    const ok = window.confirm('Удалить товар?');
    if (!ok) return;

    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка удаления товара');
    }
  }, []);

  const handleSubmitModal = useCallback(async (payload) => {
    try {
      if (modalMode === 'create') {
        const newProduct = await api.createProduct(payload);
        setProducts(prev => [...prev, newProduct]);
      } else {
        const updatedProduct = await api.updateProduct(payload.id, payload);
        setProducts(prev =>
          prev.map((p) => (p.id === payload.id ? updatedProduct : p))
        );
      }
      closeModal();
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      alert('Ошибка сохранения товара');
    }
  }, [modalMode, closeModal]);

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">🛒 TechStore</div>
          <div className="header__right">Интернет-магазин электроники</div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Каталог товаров ({products.length})</h1>
            <button className="btn btn--primary" onClick={openCreate}>
              + Добавить товар
            </button>
          </div>

          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : (
            <ProductsList
              products={products}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          © {new Date().getFullYear()} TechStore. Все товары сертифицированы.
        </div>
      </footer>

      {modalOpen && (
        <ProductModal
          open={modalOpen}
          mode={modalMode}
          initialProduct={editingProduct}
          onClose={closeModal}
          onSubmit={handleSubmitModal}
        />
      )}
    </div>
  );
}