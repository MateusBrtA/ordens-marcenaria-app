import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const LoginPage = () => {
  const { user, loading } = useAuth();

  // Se já estiver logado e não estiver carregando, redireciona para a página principal
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-gray-600">
          Não tem uma conta? <a href="/register" className="text-blue-600 hover:underline">Registre-se aqui</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;