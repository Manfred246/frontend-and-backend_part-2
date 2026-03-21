import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, tokenStorage } from '../api';

export default function RegisterPage({ setCurrentUser }) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'user'
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.register(formData);

      const result = await api.login({
        email: formData.email,
        password: formData.password
      });

      tokenStorage.setAccessToken(result.accessToken);
      tokenStorage.setRefreshToken(result.refreshToken);
      setCurrentUser(result.user);

      navigate('/');
    } catch (err) {
      alert(err?.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <div className="authPage">
      <h1>Регистрация</h1>

      <form className="form" onSubmit={handleSubmit}>
        <input
          className="input"
          name="first_name"
          placeholder="Имя"
          value={formData.first_name}
          onChange={handleChange}
          required
        />

        <input
          className="input"
          name="last_name"
          placeholder="Фамилия"
          value={formData.last_name}
          onChange={handleChange}
          required
        />

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

        <select
          className="input input--select"
          name="role"
          value={formData.role}
          onChange={handleChange}
        >
          <option value="user">Пользователь</option>
          <option value="seller">Продавец</option>
          <option value="admin">Администратор</option>
        </select>

        <button className="btn btn--primary" type="submit">
          Зарегистрироваться
        </button>
      </form>

      <p>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}