import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ProductsPage.scss';
import ProductsList from '../../components/ProductsList';
import ProductModal from '../../components/ProductModal';
import AuthModal from '../../components/AuthModal';
import { api, authStorage } from '../../api';

const USER_KEY = 'techstore_user';

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
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const scrollPositionRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        setLoading(true);

        const data = await api.getProducts();
        if (isMounted) {
          setProducts(data);
        }

        const token = authStorage.getAccessToken();
        if (token) {
          try {
            const me = await api.getMe();
            if (isMounted) {
              setCurrentUser(me);
              localStorage.setItem(USER_KEY, JSON.stringify(me));
            }
          } catch {
            authStorage.clear();
            localStorage.removeItem(USER_KEY);
            if (isMounted) {
              setCurrentUser(null);
            }
          }
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

    bootstrap();

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

  const saveAuth = useCallback((user, accessToken, refreshToken) => {
    setCurrentUser(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    authStorage.setAccessToken(accessToken);
    authStorage.setRefreshToken(refreshToken);
  }, []);

  const clearAuth = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      authStorage.clear();
    } finally {
      setCurrentUser(null);
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const openCreate = useCallback(() => {
    setModalMode('create');
    setEditingProduct(null);
    setModalOpen(true);
  }, []);

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

  const handleLogout = useCallback(async () => {
    await clearAuth();
    alert('Вы вышли из аккаунта');
  }, [clearAuth]);

  const handleRegister = useCallback(async (payload) => {
    try {
      setAuthLoading(true);

      await api.register(payload);

      const loginResult = await api.login({
        email: payload.email,
        password: payload.password
      });

      saveAuth(
        loginResult.user,
        loginResult.accessToken,
        loginResult.refreshToken
      );

      setAuthOpen(false);
      alert(`Добро пожаловать, ${loginResult.user.first_name}!`);
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      alert(err?.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setAuthLoading(false);
    }
  }, [saveAuth]);

  const handleLogin = useCallback(async (payload) => {
    try {
      setAuthLoading(true);

      const result = await api.login(payload);

      saveAuth(result.user, result.accessToken, result.refreshToken);

      setAuthOpen(false);
      alert(`Здравствуйте, ${result.user.first_name}!`);
    } catch (err) {
      console.error('Ошибка входа:', err);
      alert(err?.response?.data?.error || 'Ошибка авторизации');
    } finally {
      setAuthLoading(false);
    }
  }, [saveAuth]);

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
                  Для редактирования и удаления защищённых товаров нужна авторизация
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