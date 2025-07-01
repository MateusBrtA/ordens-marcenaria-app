import axios from 'axios';

// URL do backend - IMPORTANTE: Atualize esta URL sempre que reiniciar o ngrok
const API_BASE_URL = 'https://8b09-177-212-28-159.ngrok-free.app/api';

// Configuração otimizada para ngrok
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
    // Headers necessários para o ngrok
    'ngrok-skip-browser-warning': 'true',
    'X-Requested-With': 'XMLHttpRequest'
  },
});

// Interceptador para adicionar token de autenticação e headers do ngrok
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Garantir que os headers do ngrok sempre estejam presentes
  config.headers['ngrok-skip-browser-warning'] = 'true';
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  
  // Log para debug (remover em produção)
  console.log('Fazendo requisição para:', config.url);
  console.log('Headers:', config.headers);
  
  return config;
}, (error) => {
  console.error('Erro no interceptador de requisição:', error);
  return Promise.reject(error);
});

// Interceptador para tratar erros de autenticação e debug
api.interceptors.response.use(
  (response) => {
    // Log para debug (remover em produção)
    console.log('Resposta recebida:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Erro na resposta:', error);
    
    // Log detalhado do erro para debug
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Requisição feita mas sem resposta:', error.request);
    } else {
      console.error('Erro ao configurar requisição:', error.message);
    }
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    
    return Promise.reject(error);
  }
);

// Função para testar conectividade com o backend
export const testConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('Teste de conectividade bem-sucedido:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Teste de conectividade falhou:', error);
    return { success: false, error: error.message };
  }
};

// Função para testar CORS especificamente
export const testCORS = async () => {
  try {
    const response = await api.get('/test-cors');
    console.log('Teste de CORS bem-sucedido:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Teste de CORS falhou:', error);
    return { success: false, error: error.message };
  }
};

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

// Funções para autenticação com retry automático
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log('Tentando fazer login...');
      const response = await api.post('/auth/login', credentials);
      console.log('Login bem-sucedido:', response.data);
      return response;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  updateUser: (id, userData) => api.put(`/auth/users/${id}`, userData)
};

export default api;

