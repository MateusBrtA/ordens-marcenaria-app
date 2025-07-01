import axios from 'axios';

// URL do backend - pode ser configurada via variável de ambiente
const API_BASE_URL = 'https://17ca-177-212-28-159.ngrok-free.app/api';


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptador para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptador para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Funções para gerenciar ordens
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (order) => api.post('/orders', order),
  update: (id, order) => api.put(`/orders/${id}`, order),
  delete: (id) => api.delete(`/orders/${id}`),
  addMaterial: (orderId, material) => api.post(`/orders/${orderId}/materials`, material),
  updateMaterial: (orderId, materialId, material) => api.put(`/orders/${orderId}/materials/${materialId}`, material),
  deleteMaterial: (orderId, materialId) => api.delete(`/orders/${orderId}/materials/${materialId}`)
};

// Funções para gerenciar marceneiros
export const carpentersAPI = {
  getAll: () => api.get('/carpenters'),
  getNames: () => api.get('/carpenters/names'),
  create: (carpenter) => api.post('/carpenters', carpenter),
  update: (id, carpenter) => api.put(`/carpenters/${id}`, carpenter),
  delete: (id) => api.delete(`/carpenters/${id}`)
};

// Funções para autenticação
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  updateUser: (id, userData) => api.put(`/auth/users/${id}`, userData)
};

export default api;

