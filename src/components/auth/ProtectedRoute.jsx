import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando autenticação...</div>; // Ou um spinner de carregamento
  }

  if (!user) {
    // Usuário não autenticado, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.tipo_acesso)) {
    // Usuário autenticado, mas sem a permissão necessária
    return <div>Acesso negado. Você não tem permissão para visualizar esta página.</div>; // Ou redirecionar para uma página de erro/home
  }

  return children;
};

export default ProtectedRoute;