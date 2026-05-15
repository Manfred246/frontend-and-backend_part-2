import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { api, tokenStorage } from '../api';

export default function Layout({ currentUser, setCurrentUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      tokenStorage.clear();
    } finally {
      setCurrentUser(null);
      navigate('/login');
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="container header__inner">
          <Link to="/" className="brand">🛒 TechStore</Link>

          <nav className="nav">
            {currentUser && <Link to="/" className="nav__link">Товары</Link>}
            {currentUser?.role === 'admin' && (
              <Link to="/users" className="nav__link">Пользователи</Link>
            )}

            {currentUser ? (
              <>
                <span className="nav__user">
                  {currentUser.first_name} {currentUser.last_name} ({currentUser.role})
                </span>
                <button className="btn" onClick={handleLogout}>Выйти</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn">Вход</Link>
                <Link to="/register" className="btn btn--primary">Регистрация</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}