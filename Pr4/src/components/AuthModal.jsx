import React, { useEffect, useState } from 'react';

const initialRegisterData = {
  first_name: '',
  last_name: '',
  email: '',
  password: ''
};

const initialLoginData = {
  email: '',
  password: ''
};

export default function AuthModal({
  open,
  mode,
  onClose,
  onLoginSubmit,
  onRegisterSubmit,
  loading
}) {
  const [currentMode, setCurrentMode] = useState(mode || 'login');
  const [registerData, setRegisterData] = useState(initialRegisterData);
  const [loginData, setLoginData] = useState(initialLoginData);

  useEffect(() => {
    if (open) {
      setCurrentMode(mode || 'login');
      setRegisterData(initialRegisterData);
      setLoginData(initialLoginData);
    }
  }, [open, mode]);

  if (!open) return null;

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!registerData.first_name.trim()) {
      alert('Введите имя');
      return;
    }

    if (!registerData.last_name.trim()) {
      alert('Введите фамилию');
      return;
    }

    if (!registerData.email.trim()) {
      alert('Введите email');
      return;
    }

    if (!registerData.password.trim() || registerData.password.length < 6) {
      alert('Пароль должен содержать минимум 6 символов');
      return;
    }

    await onRegisterSubmit({
      first_name: registerData.first_name.trim(),
      last_name: registerData.last_name.trim(),
      email: registerData.email.trim(),
      password: registerData.password
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!loginData.email.trim()) {
      alert('Введите email');
      return;
    }

    if (!loginData.password.trim()) {
      alert('Введите пароль');
      return;
    }

    await onLoginSubmit({
      email: loginData.email.trim(),
      password: loginData.password
    });
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal authModal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">
            {currentMode === 'login' ? 'Авторизация' : 'Регистрация'}
          </h2>
          <button className="iconBtn" onClick={onClose}>✕</button>
        </div>

        <div className="authTabs">
          <button
            type="button"
            className={`authTab ${currentMode === 'login' ? 'authTab--active' : ''}`}
            onClick={() => setCurrentMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            className={`authTab ${currentMode === 'register' ? 'authTab--active' : ''}`}
            onClick={() => setCurrentMode('register')}
          >
            Регистрация
          </button>
        </div>

        {currentMode === 'login' ? (
          <form className="form" onSubmit={handleLoginSubmit}>
            <label className="label">
              Email
              <input
                type="email"
                name="email"
                className="input"
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="ivan@example.com"
                autoFocus
                required
              />
            </label>

            <label className="label">
              Пароль
              <input
                type="password"
                name="password"
                className="input"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Введите пароль"
                required
              />
            </label>

            <div className="modal__footer">
              <button type="button" className="btn" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </div>
          </form>
        ) : (
          <form className="form" onSubmit={handleRegisterSubmit}>
            <div className="row">
              <label className="label">
                Имя
                <input
                  type="text"
                  name="first_name"
                  className="input"
                  value={registerData.first_name}
                  onChange={handleRegisterChange}
                  placeholder="Иван"
                  autoFocus
                  required
                />
              </label>

              <label className="label">
                Фамилия
                <input
                  type="text"
                  name="last_name"
                  className="input"
                  value={registerData.last_name}
                  onChange={handleRegisterChange}
                  placeholder="Иванов"
                  required
                />
              </label>
            </div>

            <label className="label">
              Email
              <input
                type="email"
                name="email"
                className="input"
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="ivan@example.com"
                required
              />
            </label>

            <label className="label">
              Пароль
              <input
                type="password"
                name="password"
                className="input"
                value={registerData.password}
                onChange={handleRegisterChange}
                placeholder="Минимум 6 символов"
                required
              />
            </label>

            <div className="modal__footer">
              <button type="button" className="btn" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? 'Создание...' : 'Зарегистрироваться'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}