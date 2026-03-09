import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/signin" />;
  }

  if (roles && roles.length > 0 && !roles.includes(currentUser.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;