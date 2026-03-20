import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ProductsPage.scss';
import ProductsList from '../../components/ProductsList';
import ProductModal from '../../components/ProductModal';
import AuthModal from '../../components/AuthModal';
import { api } from '../../api';

const STORAGE_KEY = 'techstore_user';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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

  const isAnyModalOpen = modalOpen || authOpen;

  useEffect(() => {
    if (isAnyModalOpen) {
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
  }, [isAnyModalOpen]);

  const saveUser = useCallback((user) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }, []);

  const clearUser = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const openCreate = useCallback(() => {
    if (!currentUser) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }

    setModalMode('create');
    setEditingProduct(null);
    setModalOpen(true);
  }, [currentUser]);

  const openEdit = useCallback((product) => {
    if (!currentUser) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }

    setModalMode('edit');
    setEditingProduct(product);
    setModalOpen(true);
  }, [currentUser]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
  }, []);

  const openLogin = useCallback(() => {
    setAuthMode('login');
    setAuthOpen(true);
  }, []);

  const openRegister = useCallback(() => {
    setAuthMode('register');
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    clearUser();
    alert('Вы вышли из аккаунта');
  }, [clearUser]);

  const handleRegister = useCallback(async (payload) => {
    try {
      setAuthLoading(true);
      await api.register(payload);

      const loginResult = await api.login({
        email: payload.email,
        password: payload.password
      });

      saveUser(loginResult.user);
      setAuthOpen(false);
      alert(`Добро пожаловать, ${loginResult.user.first_name}!`);
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      alert(err?.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setAuthLoading(false);
    }
  }, [saveUser]);

  const handleLogin = useCallback(async (payload) => {
    try {
      setAuthLoading(true);
      const result = await api.login(payload);
      saveUser(result.user);
      setAuthOpen(false);
      alert(`Здравствуйте, ${result.user.first_name}!`);
    } catch (err) {
      console.error('Ошибка входа:', err);
      alert(err?.response?.data?.error || 'Ошибка авторизации');
    } finally {
      setAuthLoading(false);
    }
  }, [saveUser]);

  const handleDelete = useCallback(async (id) => {
    if (!currentUser) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }

    const ok = window.confirm('Удалить товар?');
    if (!ok) return;

    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert(err?.response?.data?.error || 'Ошибка удаления товара');
    }
  }, [currentUser]);

  const handleSubmitModal = useCallback(async (payload) => {
    try {
      if (modalMode === 'create') {
        const newProduct = await api.createProduct(payload);
        setProducts((prev) => [...prev, newProduct]);
      } else {
        const updatedProduct = await api.updateProduct(payload.id, payload);
        setProducts((prev) =>
          prev.map((p) => (p.id === payload.id ? updatedProduct : p))
        );
      }

      closeModal();
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      alert(err?.response?.data?.error || 'Ошибка сохранения товара');
    }
  }, [modalMode, closeModal]);

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">🛒 TechStore</div>

          <div className="header__right headerActions">
            {currentUser ? (
              <>
                <div className="userBadge">
                  <span className="userBadge__name">
                    {currentUser.first_name} {currentUser.last_name}
                  </span>
                  <span className="userBadge__email">{currentUser.email}</span>
                </div>
                <button className="btn" onClick={handleLogout}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <button className="btn" onClick={openLogin}>
                  Войти
                </button>
                <button className="btn btn--primary" onClick={openRegister}>
                  Регистрация
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="toolbar">
            <div>
              <h1 className="title">Каталог товаров ({products.length})</h1>
              {!currentUser && (
                <div className="toolbarHint">
                  Для добавления, редактирования и удаления товаров войдите в аккаунт
                </div>
              )}
            </div>

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
              canManage={Boolean(currentUser)}
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

      {authOpen && (
        <AuthModal
          open={authOpen}
          mode={authMode}
          onClose={closeAuth}
          onLoginSubmit={handleLogin}
          onRegisterSubmit={handleRegister}
          loading={authLoading}
        />
      )}
    </div>
  );
}