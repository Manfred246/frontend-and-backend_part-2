import React from 'react';
import { Navigate } from 'react-router-dom';
import { tokenStorage } from '../api';

export default function ProtectedRoute({ children }) {
  const accessToken = tokenStorage.getAccessToken();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}