import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { api, tokenStorage } from './api';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const bootstrap = async () => {
      if (!tokenStorage.getAccessToken()) return;

      try {
        const me = await api.getMe();
        setCurrentUser(me);
      } catch {
        tokenStorage.clear();
        setCurrentUser(null);
      }
    };

    bootstrap();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Layout currentUser={currentUser} setCurrentUser={setCurrentUser} />}
        >
          <Route index element={<ProductsPage currentUser={currentUser} />} />
          <Route path="login" element={<LoginPage setCurrentUser={setCurrentUser} />} />
          <Route path="register" element={<RegisterPage setCurrentUser={setCurrentUser} />} />
          <Route
            path="products/:id"
            element={
              <ProtectedRoute>
                <ProductDetailsPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;