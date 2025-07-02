import axios from 'axios';

// URL do backend - ATUALIZE COM A URL DO LOCAL TUNNEL
let API_BASE_URL = 'https://tidy-files-fix.loca.lt/api'; // EX: 'https://random-word.loca.lt/api'

// Função para atualizar a URL do backend
export const updateBackendURL = (newURL ) => {
  API_BASE_URL = newURL.endsWith('/api') ? newURL : `${newURL}/api`;
  api.defaults.baseURL = API_BASE_URL;
  console.log('🔄 URL do backend atualizada para:', API_BASE_URL);
};

// Função para obter a URL atual do backend
export const getBackendURL = () => API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos de timeout
});

// Interceptador para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Removendo ngrok-skip-browser-warning, pois não é mais necessário com localtunnel
  delete config.headers['ngrok-skip-browser-warning'];
  return config;
});

// Interceptador para tratar erros de autenticação e conexão
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Erro na API:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('⏰ Timeout na conexão com o backend');
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error('🌐 Erro de rede - backend pode estar offline ou problema de CORS/rede');
    }
    
    return Promise.reject(error);
  }
);

// Funções para gerenciar ordens
export const ordersAPI = {
  getAll: () => {
    console.log('📦 Buscando todas as ordens...');
    return api.get('/orders');
  },
  getById: (id) => {
    console.log(`📦 Buscando ordem ${id}...`);
    return api.get(`/orders/${id}`);
  },
  create: (order) => {
    console.log('➕ Criando nova ordem:', order);
    return api.post('/orders', order);
  },
  update: (id, order) => {
    console.log(`🔄 Atualizando ordem ${id}:`, order);
    return api.put(`/orders/${id}`, order);
  },
  delete: (id) => {
    console.log(`🗑️ Deletando ordem ${id}...`);
    return api.delete(`/orders/${id}`);
  },
  addMaterial: (orderId, material) => {
    console.log(`➕ Adicionando material à ordem ${orderId}:`, material);
    return api.post(`/orders/${orderId}/materials`, material);
  },
  updateMaterial: (orderId, materialId, material) => {
    console.log(`🔄 Atualizando material ${materialId} da ordem ${orderId}:`, material);
    return api.put(`/orders/${orderId}/materials/${materialId}`, material);
  },
  deleteMaterial: (orderId, materialId) => {
    console.log(`🗑️ Deletando material ${materialId} da ordem ${orderId}...`);
    return api.delete(`/orders/${orderId}/materials/${materialId}`);
  }
};

// Funções para gerenciar marceneiros
export const carpentersAPI = {
  getAll: () => {
    console.log('👷 Buscando todos os marceneiros...');
    return api.get('/carpenters');
  },
  getNames: () => {
    console.log('👷 Buscando nomes dos marceneiros...');
    return api.get('/carpenters/names');
  },
  create: (carpenter) => {
    console.log('➕ Criando novo marceneiro:', carpenter);
    return api.post('/carpenters', carpenter);
  },
  update: (id, carpenter) => {
    console.log(`🔄 Atualizando marceneiro ${id}:`, carpenter);
    return api.put(`/carpenters/${id}`, carpenter);
  },
  delete: (id) => {
    console.log(`🗑️ Deletando marceneiro ${id}...`);
    return api.delete(`/carpenters/${id}`);
  }
};

// Funções para autenticação
export const authAPI = {
  login: (credentials) => {
    console.log('🔐 Fazendo login...');
    return api.post('/auth/login', credentials);
  },
  register: (userData) => {
    console.log('📝 Registrando usuário...');
    return api.post('/auth/register', userData);
  },
  me: () => {
    console.log('👤 Verificando usuário atual...');
    return api.get('/auth/me');
  },
  getUsers: () => {
    console.log('👥 Buscando todos os usuários...');
    return api.get('/auth/users');
  },
  updateUser: (id, userData) => {
    console.log(`🔄 Atualizando usuário ${id}:`, userData);
    return api.put(`/auth/users/${id}`, userData);
  }
};

// Função para testar conectividade com o backend
export const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão com o backend...');
    const response = await api.get('/health');
    console.log('✅ Conexão com backend OK:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão com backend:', error.message);
    return false;
  }
};

export default api;
