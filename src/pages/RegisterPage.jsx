import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const RegisterPage = () => {
  const { user, loading } = useAuth();

  // Se já estiver logado e não estiver carregando, redireciona para a página principal
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Registrar</h2>
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-gray-600">
          Já tem uma conta? <a href="/login" className="text-blue-600 hover:underline">Faça login aqui</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;