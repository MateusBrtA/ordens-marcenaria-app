import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import LoginPage from './components/LoginPage.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { LogOut, User, RefreshCw, Settings, Truck, LayoutGrid } from 'lucide-react';
import { BackendUrlChanger } from './components/BackendUrlChanger';
import OrderPage from './components/OrderPage.jsx';
import DeliveryPage from './components/DeliveryPage.jsx';
import { initializeBackendUrl, checkForBackendUrlUpdates } from './services/api.js';
import './App.css';

function MainApp() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('orders');
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    onConfirm: () => { },
    onCancel: () => { }
  });

  const showCustomAlert = useCallback((title, message) => {
    setDialog({ isOpen: true, title, message, type: 'alert', onConfirm: () => { }, onCancel: () => { } });
  }, []);

  const showCustomConfirm = useCallback((title, message, onConfirmCallback, onCancelCallback) => {
    setDialog({ isOpen: true, title, message, type: 'confirm', onConfirm: onConfirmCallback, onCancel: onCancelCallback });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    if (dateString.includes('/')) return dateString;
    if (dateString.includes('-')) {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
      }
    }
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    } catch (e) {
      console.warn('Erro ao formatar data:', dateString);
    }
    return dateString;
  };

  // Verificar periodicamente por atualizações da URL do backend
  useEffect(() => {
    const checkUrlUpdates = async () => {
      try {
        const wasUpdated = await checkForBackendUrlUpdates();
        if (wasUpdated) {
          console.log("🔄 URL do backend foi atualizada automaticamente");
          // Opcional: Mostrar notificação para o usuário
          // showCustomAlert("URL Atualizada", "A URL do backend foi atualizada automaticamente.");
        }
      } catch (error) {
        console.error("❌ Erro ao verificar atualizações da URL:", error);
      }
    };

    // Verificar imediatamente
    checkUrlUpdates();

    // Verificar a cada 30 segundos
    const interval = setInterval(checkUrlUpdates, 30000);

    return () => clearInterval(interval);
  }, []);

  // Listener para mudanças na URL do backend
  useEffect(() => {
    const handleBackendUrlChange = (event) => {
      if (event.detail && event.detail.newUrl) {
        console.log("🔄 URL do backend alterada:", event.detail.newUrl);
        console.log("📡 Fonte da alteração:", event.detail.source);
        
        // Se a alteração veio de uma atualização automática, mostrar notificação
        if (event.detail.source === "auto-update") {
          showCustomAlert(
            "URL Atualizada", 
            "A URL do backend foi atualizada automaticamente pelo administrador."
          );
        }
      }
    };

    window.addEventListener("backendUrlChanged", handleBackendUrlChange);

    return () => {
      window.removeEventListener("backendUrlChanged", handleBackendUrlChange);
    };
  }, [showCustomAlert]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-inter">
      <div className="text-center mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">
            {currentPage === 'orders' ? 'Ordens de Serviço' : 'Entregas'}
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <BackendUrlChanger variant="app" />
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Atualizar
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={16} />
              <span>{user.username} ({user.role})</span>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 mb-6">
          <Button
            onClick={() => setCurrentPage('orders')}
            variant={currentPage === 'orders' ? 'default' : 'outline'}
            className="w-full sm:w-auto"
          >
            <LayoutGrid size={16} className="mr-2" />
            Ordens
          </Button>

          <Button
            onClick={() => setCurrentPage('deliveries')}
            variant={currentPage === 'deliveries' ? 'default' : 'outline'}
            className="w-full sm:w-auto"
          >
            <Truck size={16} className="mr-2" />
            Entregas
          </Button>
        </div>
      </div>

      {currentPage === 'orders' ? (
        <OrderPage 
          canEdit={useAuth().canEdit}
          showCustomAlert={showCustomAlert} 
          showCustomConfirm={showCustomConfirm}
          closeDialog={closeDialog}
          formatDate={formatDate}
        />
      ) : (
        <DeliveryPage 
          canEdit={useAuth().canEdit}
          showCustomAlert={showCustomAlert} 
          showCustomConfirm={showCustomConfirm}
          closeDialog={closeDialog}
          formatDate={formatDate}
          dialog={dialog}
        />
      )}

      <Dialog open={dialog.isOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.title}</DialogTitle>
            <DialogDescription>{dialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {dialog.type === 'confirm' && (
              <Button variant="outline" onClick={dialog.onCancel}>
                Cancelar
              </Button>
            )}
            <Button onClick={dialog.type === 'confirm' ? dialog.onConfirm : closeDialog}>
              {dialog.type === 'confirm' ? 'Confirmar' : 'OK'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [backendInitialized, setBackendInitialized] = useState(false);

  // Inicializar URL do backend ao carregar a aplicação
  useEffect(() => {
    const initBackend = async () => {
      try {
        console.log('🚀 Inicializando configuração global do backend...');
        await initializeBackendUrl();
        setBackendInitialized(true);
        console.log('✅ Configuração do backend inicializada');
      } catch (error) {
        console.error('❌ Erro ao inicializar backend:', error);
        setBackendInitialized(true); // Continuar mesmo com erro
      }
    };

    initBackend();
  }, []);

  if (loading || !backendInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return user ? <MainApp /> : <LoginPage />;
}

export default App;

