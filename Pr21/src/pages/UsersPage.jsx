import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function UsersPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'user',
    isBlocked: false
  });

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      alert(err?.response?.data?.error || 'Ошибка загрузки пользователей');
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
    }
  }, [currentUser]);

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      isBlocked: user.isBlocked
    });
  };

  const handleSave = async (id) => {
    try {
      const updated = await api.updateUser(id, formData);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setEditingUserId(null);
    } catch (err) {
      alert(err?.response?.data?.error || 'Ошибка обновления пользователя');
    }
  };

  const handleBlock = async (id) => {
    try {
      const response = await api.blockUser(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? response.user : u))
      );
    } catch (err) {
      alert(err?.response?.data?.error || 'Ошибка блокировки');
    }
  };

  if (currentUser?.role !== 'admin') {
    return <div>Доступ только для администратора.</div>;
  }

  return (
    <div>
      <h1>Управление пользователями</h1>

      <div className="section">
        {users.map((user) => (
          <div key={user.id} className="userRow">
            {editingUserId === user.id ? (
              <>
                <input
                  className="input"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, first_name: e.target.value }))
                  }
                  placeholder="Имя"
                />

                <input
                  className="input"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, last_name: e.target.value }))
                  }
                  placeholder="Фамилия"
                />

                <input
                  className="input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Email"
                />

                <select
                  className="input input--select"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, role: e.target.value }))
                  }
                >
                  <option value="user">user</option>
                  <option value="seller">seller</option>
                  <option value="admin">admin</option>
                </select>

                <label className="checkboxLabel">
                  <input
                    type="checkbox"
                    checked={formData.isBlocked}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isBlocked: e.target.checked }))
                    }
                  />
                  blocked
                </label>

                <button className="btn btn--primary" onClick={() => handleSave(user.id)}>
                  Сохранить
                </button>
              </>
            ) : (
              <>
                <span>{user.first_name} {user.last_name}</span>
                <span>{user.email}</span>
                <span>{user.role}</span>
                <span>{user.isBlocked ? 'Заблокирован' : 'Активен'}</span>
                <button className="btn" onClick={() => startEdit(user)}>
                  Изменить
                </button>
                <button className="btn btn--danger" onClick={() => handleBlock(user.id)}>
                  Заблокировать
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}