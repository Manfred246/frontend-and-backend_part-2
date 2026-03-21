import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, tokenStorage } from '../api';

export default function LoginPage({ setCurrentUser }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await api.login(formData);

      tokenStorage.setAccessToken(result.accessToken);
      tokenStorage.setRefreshToken(result.refreshToken);
      setCurrentUser(result.user);

      navigate('/');
    } catch (err) {
      alert(err?.response?.data?.error || 'Ошибка входа');
    }
  };

  return (
    <div className="authPage">
      <h1>Вход</h1>

      <form className="form" onSubmit={handleSubmit}>
        <input
          className="input"
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          className="input"
          type="password"
          name="password"
          placeholder="Пароль"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button className="btn btn--primary" type="submit">
          Войти
        </button>
      </form>

      <p>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}