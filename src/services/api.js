import axios from 'axios';

// Lê a URL do backend da variável de ambiente que configuramos no Vercel
const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Isso é um "interceptador". Ele vai adicionar o token de autenticação
// em todas as chamadas para a API, depois que o usuário fizer login.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Pega o token salvo no navegador
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
