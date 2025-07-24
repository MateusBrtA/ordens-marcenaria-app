import axios from "axios";

// URL padrão que você pode alterar diretamente no código
const DEFAULT_BACKEND_URL = "https://611300632a31.ngrok-free.app";

// Função para obter a URL do backend atual
const getCurrentBackendUrl = () => {
  // Prioridade:
  // 1. URL manual do localStorage (BackendUrlChanger)
  // 2. Variável de ambiente do Vercel
  // 3. URL padrão definida no código
  
  const manualUrl = localStorage.getItem("backendUrl");
  const envUrl = import.meta.env.VITE_API_URL;
  
  // Se há URL manual no localStorage, ela tem prioridade máxima
  if (manualUrl) {
    console.log("📱 Usando URL manual do localStorage:", manualUrl);
    return manualUrl;
  }
  
  // Se não há URL manual, usar variável de ambiente
  if (envUrl) {
    console.log("🌐 Usando URL da variável de ambiente:", envUrl);
    return envUrl;
  }
  
  // Fallback para URL padrão no código
  console.log("🔧 Usando URL padrão do código:", DEFAULT_BACKEND_URL);
  return DEFAULT_BACKEND_URL;
};

// Função para salvar a URL do backend
const setBackendUrl = (url) => {
  const cleanUrl = url.replace(/\/$/, "");
  localStorage.setItem("backendUrl", cleanUrl);
  
  // Atualizar a baseURL do axios
  api.defaults.baseURL = cleanUrl + "/api";
  
  console.log("🔄 URL do backend atualizada manualmente para:", cleanUrl);
  
  // Disparar evento para notificar outros componentes
  window.dispatchEvent(
    new CustomEvent("backendUrlChanged", {
      detail: { newUrl: cleanUrl, source: "manual" },
    })
  );
  
  return cleanUrl;
};

// Função para limpar URL manual e voltar ao padrão
const clearManualBackendUrl = () => {
  localStorage.removeItem("backendUrl");
  const defaultUrl = getCurrentBackendUrl();
  api.defaults.baseURL = defaultUrl + "/api";
  
  console.log("🧹 URL manual removida, voltando ao padrão:", defaultUrl);
  
  window.dispatchEvent(
    new CustomEvent("backendUrlChanged", {
      detail: { newUrl: defaultUrl, source: "reset" },
    })
  );
  
  return defaultUrl;
};

// Função para buscar a URL global do backend (simplificada)
const getGlobalBackendUrl = async () => {
  const currentUrl = getCurrentBackendUrl();
  
  if (!currentUrl) {
    console.log("⚠️ Nenhuma URL configurada");
    return null;
  }
  
  try {
    console.log(`🌐 Buscando configuração global de: ${currentUrl}`);
    
    const response = await axios.get(`${currentUrl}/api/system/config/backend-url`, {
      timeout: 10000,
      headers: {
        "ngrok-skip-browser-warning": "true",
        "Accept": "application/json",
      },
    });

    if (response.data.backend_url) {
      console.log("✅ URL global encontrada:", response.data.backend_url);
      return response.data.backend_url;
    }
  } catch (error) {
    console.log(`❌ Erro ao buscar configuração global:`, error.message);
  }
  
  return null;
};

// Função para inicializar a URL do backend
export const initializeBackendUrl = async () => {
  try {
    console.log("🚀 Inicializando configuração do backend...");
    
    const currentUrl = getCurrentBackendUrl();
    
    if (!currentUrl) {
      console.log("⚠️ Nenhuma URL configurada.");
      return null;
    }
    
    // Configurar axios com a URL atual
    api.defaults.baseURL = currentUrl + "/api";
    console.log("✅ URL do backend configurada:", currentUrl);
    
    // Tentar buscar URL global apenas se não há URL manual
    const manualUrl = localStorage.getItem("backendUrl");
    if (!manualUrl) {
      try {
        const globalUrl = await getGlobalBackendUrl();
        
        if (globalUrl && globalUrl !== currentUrl) {
          console.log("🔄 Atualizando para URL global:", globalUrl);
          // Não salvar no localStorage para não interferir com configuração manual
          api.defaults.baseURL = globalUrl + "/api";
          return globalUrl;
        }
      } catch (error) {
        console.log("⚠️ Não foi possível buscar URL global, usando URL atual");
      }
    }
    
    return currentUrl;
  } catch (error) {
    console.error("❌ Erro ao inicializar URL do backend:", error);
    return getCurrentBackendUrl();
  }
};

// Função para verificar atualizações da URL (simplificada)
export const checkForBackendUrlUpdates = async () => {
  try {
    // Se há URL manual, não verificar atualizações automáticas
    const manualUrl = localStorage.getItem("backendUrl");
    if (manualUrl) {
      return false;
    }
    
    const currentUrl = getCurrentBackendUrl();
    
    if (!currentUrl) {
      return false;
    }
    
    const globalUrl = await getGlobalBackendUrl();
    
    if (globalUrl && globalUrl !== currentUrl) {
      console.log("🔄 Nova URL detectada:", globalUrl);
      // Não salvar no localStorage para não interferir com configuração manual
      api.defaults.baseURL = globalUrl + "/api";
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("❌ Erro ao verificar atualizações:", error);
    return false;
  }
};

// Função para obter URL inicial para o axios
const getInitialUrl = () => {
  const url = getCurrentBackendUrl();
  return url ? url + "/api" : "http://localhost:5000/api";
};

// Criar instância do axios
const api = axios.create({
  baseURL: getInitialUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptador para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Headers para ngrok
  config.headers["ngrok-skip-browser-warning"] = "true";
  config.headers["Accept"] = "application/json, text/plain, */*";
  config.headers["Content-Type"] = "application/json";
  config.headers["X-Requested-With"] = "XMLHttpRequest";
  
  return config;
});

// Interceptador para tratar erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("❌ Erro na API:", error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }
    
    return Promise.reject(error);
  }
);

// Funções para gerenciar ordens
export const ordersAPI = {
  getAll: () => api.get("/orders"),
  getById: (id) => api.get(`/orders/${id}`),
  create: (order) => api.post("/orders", order),
  update: (id, order) => api.put(`/orders/${id}`, order),
  delete: (id) => api.delete(`/orders/${id}`),
  addMaterial: (orderId, material) => api.post(`/orders/${orderId}/materials`, material),
  updateMaterial: (orderId, materialId, material) => api.put(`/orders/${orderId}/materials/${materialId}`, material),
  deleteMaterial: (orderId, materialId) => api.delete(`/orders/${orderId}/materials/${materialId}`),
};

// Funções para gerenciar marceneiros
export const carpentersAPI = {
  getAll: () => api.get("/carpenters"),
  create: (carpenter) => api.post("/carpenters", carpenter),
  delete: (name) => api.delete(`/carpenters/${name}`),
};

// Funções para testar conexão
export const testConnection = async () => {
  try {
    const response = await api.get("/health");
    console.log("✅ Conexão OK:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Falha na conexão:", error.message);
    return false;
  }
};

// Funções para gerenciar entregas
export const deliveriesAPI = {
  getAll: () => api.get("/deliveries"),
  getById: (id) => api.get(`/deliveries/${id}`),
  create: (delivery) => api.post("/deliveries", delivery),
  update: (id, delivery) => api.put(`/deliveries/${id}`, delivery),
  delete: (id) => api.delete(`/deliveries/${id}`),
};

// Funções para gerenciar configurações do sistema
export const systemConfigAPI = {
  getAll: () => api.get("/system/config"),
  getConfig: (key) => api.get(`/system/config/${key}`),
  getBackendUrl: () => api.get("/system/config/backend-url"),
  setConfig: (key, value, description) => api.post("/system/config", { key, value, description }),
  setBackendUrl: (url) => api.post("/system/config/backend-url", { url }),
  deleteConfig: (key) => api.delete(`/system/config/${key}`),
};

// Exportar funções principais
export { getCurrentBackendUrl, setBackendUrl, clearManualBackendUrl };
export default api;

