import axios from "axios";

// Função para buscar a URL global do backend do servidor
const getGlobalBackendUrl = async () => {
  try {
    // Tentar buscar a URL global do servidor usando uma URL base conhecida
    const possibleUrls = [
      localStorage.getItem("backendUrl"),
      "https://cef4-177-116-239-98.ngrok-free.app",
      "https://eee1aaa3647c.ngrok-free.app",
    ].filter(Boolean);

    for (const baseUrl of possibleUrls) {
      try {
        const response = await axios.get(`${baseUrl}/api/system/config/backend-url`, {
          timeout: 5000,
          headers: {
            "ngrok-skip-browser-warning": "true",
            "Accept": "application/json",
          },
        });

        if (response.data.backend_url) {
          console.log("🌐 URL global do backend encontrada:", response.data.backend_url);
          return response.data.backend_url;
        }
      } catch (error) {
        console.log(`❌ Não foi possível buscar configuração de ${baseUrl}`);
      }
    }

    return null;
  } catch (error) {
    console.error("❌ Erro ao buscar URL global do backend:", error);
    return null;
  }
};

const getStoredBackendUrl = () => {
  return localStorage.getItem("backendUrl") || "https://cef4-177-116-239-98.ngrok-free.app";
};

const setStoredBackendUrl = (url) => {
  localStorage.setItem("backendUrl", url);
};

// Inicializar com URL padrão
let API_BASE_URL = "https://eee1aaa3647c.ngrok-free.app/api";

// Função para inicializar a URL do backend (buscar configuração global)
export const initializeBackendUrl = async () => {
  try {
    const globalUrl = await getGlobalBackendUrl();
    if (globalUrl) {
      API_BASE_URL = globalUrl.endsWith("/api") ? globalUrl : `${globalUrl}/api`;
      api.defaults.baseURL = API_BASE_URL;
      setStoredBackendUrl(globalUrl);
      console.log("🌐 URL do backend inicializada com configuração global:", API_BASE_URL);
      return globalUrl;
    } else {
      // Usar URL local se não conseguir buscar a global
      const localUrl = getStoredBackendUrl();
      API_BASE_URL = localUrl.endsWith("/api") ? localUrl : `${localUrl}/api`;
      api.defaults.baseURL = API_BASE_URL;
      console.log("📱 Usando URL local do backend:", API_BASE_URL);
      return localUrl;
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar URL do backend:", error);
    const fallbackUrl = getStoredBackendUrl();
    API_BASE_URL = fallbackUrl.endsWith("/api") ? fallbackUrl : `${fallbackUrl}/api`;
    api.defaults.baseURL = API_BASE_URL;
    return fallbackUrl;
  }
};

// Função para atualizar a URL do backend
export const updateBackendURL = (newURL) => {
  API_BASE_URL = newURL.endsWith("/api") ? newURL : `${newURL}/api`;
  api.defaults.baseURL = API_BASE_URL;
  console.log("🔄 URL do backend atualizada para:", API_BASE_URL);
};

// Função para obter a URL atual do backend
export const getBackendURL = () => API_BASE_URL;

const api = axios.create({
  baseURL: getStoredBackendUrl() + "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ADICIONAR função para atualizar a URL:
export const updateBackendUrl = (newUrl) => {
  // Remover barra final se existir
  const cleanUrl = newUrl.replace(/\/$/, "");
  setStoredBackendUrl(cleanUrl);
  
  // Atualizar a baseURL do axios
  api.defaults.baseURL = cleanUrl + "/api";
  
  return cleanUrl;
};

export const getCurrentBackendUrl = () => {
  return getStoredBackendUrl();
};

// Interceptador para adicionar token de autenticação
api.interceptors.request.use((config) => {
  console.log("🔍 Iniciando processo de login...");
  console.log("🔍 Dados sendo enviados:", config.data);
  console.log("🔍 Fazendo requisição para:", config.url);
  console.log("🔍 Headers:", config.headers);
  
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Garantir headers para ngrok
  config.headers["ngrok-skip-browser-warning"] = "true";
  config.headers["Accept"] = "application/json, text/plain, */*";
  config.headers["Content-Type"] = "application/json";
  config.headers["X-Requested-With"] = "XMLHttpRequest";
  
  return config;
});

// Interceptador para tratar erros de autenticação e conexão
api.interceptors.response.use(
  (response) => {
    console.log("✅ Resposta recebida:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("❌ Erro na API:", error.response?.data || error.message);
    console.log("❌ Erro capturado:", error);
    console.log("❌ Erro response:", error.response);
    console.log("❌ Erro message:", error.message);
    console.log("❌ Erro code:", error.code);
    console.log("❌ Erro config:", error.config);
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    } else if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      console.error("⏰ Timeout na conexão com o backend");
    } else if (error.code === "ERR_NETWORK" || !error.response) {
      console.error("🌐 Erro de rede - backend pode estar offline ou problema de CORS/rede");
    }
    
    return Promise.reject(error);
  }
);

// Funções para gerenciar ordens
export const ordersAPI = {
  getAll: () => {
    console.log("📦 Buscando todas as ordens...");
    return api.get("/orders");
  },
  getById: (id) => {
    console.log(`📦 Buscando ordem ${id}...`);
    return api.get(`/orders/${id}`);
  },
  create: (order) => {
    console.log("➕ Criando nova ordem:", order);
    return api.post("/orders", order);
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
  },
};

// Funções para gerenciar marceneiros
export const carpentersAPI = {
  getAll: () => {
    console.log("👷 Buscando todos os marceneiros...");
    return api.get("/carpenters");
  },
  create: (carpenter) => {
    console.log("➕ Criando novo marceneiro:", carpenter);
    return api.post("/carpenters", carpenter);
  },
  delete: (name) => {
    console.log(`🗑️ Deletando marceneiro ${name}...`);
    return api.delete(`/carpenters/${name}`);
  },
};

// Funções para testar conexão
export const testConnection = async () => {
  try {
    console.log("🔍 Testando conexão com o backend...");
    const response = await api.get("/test-connection");
    console.log("✅ Conexão OK:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Falha na conexão com backend:", error.message);
    return false;
  }
};

// Função específica para testar CORS
export const testCORS = async () => {
  try {
    console.log("🔍 Testando CORS...");
    const response = await api.get("/test-cors");
    console.log("✅ CORS OK:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Falha no teste de CORS:", error.message);
    return false;
  }
};

// Funções para gerenciar entregas
export const deliveriesAPI = {
  getAll: () => {
    console.log("📦 Buscando todas as entregas...");
    return api.get("/deliveries");
  },
  getById: (id) => {
    console.log(`📦 Buscando entrega ${id}...`);
    return api.get(`/deliveries/${id}`);
  },
  create: (delivery) => {
    console.log("➕ Criando nova entrega:", delivery);
    return api.post("/deliveries", delivery);
  },
  update: (id, delivery) => {
    console.log(`🔄 Atualizando entrega ${id}:`, delivery);
    return api.put(`/deliveries/${id}`, delivery);
  },
  delete: (id) => {
    console.log(`🗑️ Deletando entrega ${id}...`);
    return api.delete(`/deliveries/${id}`);
  },
};

// Funções para gerenciar configurações do sistema
export const systemConfigAPI = {
  getAll: () => {
    console.log("⚙️ Buscando todas as configurações...");
    return api.get("/system/config");
  },
  getConfig: (key) => {
    console.log(`⚙️ Buscando configuração ${key}...`);
    return api.get(`/system/config/${key}`);
  },
  getBackendUrl: () => {
    console.log("🌐 Buscando URL global do backend...");
    return api.get("/system/config/backend-url");
  },
  setConfig: (key, value, description) => {
    console.log(`⚙️ Definindo configuração ${key}:`, value);
    return api.post("/system/config", { key, value, description });
  },
  setBackendUrl: (url) => {
    console.log("🌐 Definindo URL global do backend:", url);
    return api.post("/system/config/backend-url", { url });
  },
  deleteConfig: (key) => {
    console.log(`🗑️ Removendo configuração ${key}...`);
    return api.delete(`/system/config/${key}`);
  },
};

export default api;