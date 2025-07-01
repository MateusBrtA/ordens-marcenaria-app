import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Settings, Check, X, Wifi, WifiOff } from 'lucide-react';
import { updateBackendURL, getBackendURL, testConnection } from '../services/api.js';

const BackendConfig = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [backendURL, setBackendURL] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTestedURL, setLastTestedURL] = useState('');

  useEffect(() => {
    // Carregar URL salva do localStorage
    const savedURL = localStorage.getItem('backend_url');
    if (savedURL) {
      setBackendURL(savedURL);
      updateBackendURL(savedURL);
      setLastTestedURL(savedURL);
    } else {
      setBackendURL(getBackendURL());
    }

    // Testar conexão inicial
    testConnectionStatus();
  }, []);

  const testConnectionStatus = async () => {
    setIsLoading(true);
    try {
      const connected = await testConnection();
      setIsConnected(connected);
      if (connected) {
        setLastTestedURL(getBackendURL());
      }
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Atualizar URL na API
      updateBackendURL(backendURL);
      
      // Testar conexão
      const connected = await testConnection();
      setIsConnected(connected);
      
      if (connected) {
        // Salvar no localStorage
        localStorage.setItem('backend_url', backendURL);
        setLastTestedURL(backendURL);
        setIsOpen(false);
      } else {
        alert('Não foi possível conectar com o backend nesta URL. Verifique se o servidor está rodando.');
      }
    } catch (error) {
      setIsConnected(false);
      alert('Erro ao testar conexão: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setBackendURL(lastTestedURL || getBackendURL());
    setIsOpen(false);
  };

  const formatURL = (url) => {
    if (!url) return '';
    // Remover /api do final se existir para exibição
    return url.replace('/api', '');
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 ${isConnected ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : isConnected ? (
          <Wifi size={16} />
        ) : (
          <WifiOff size={16} />
        )}
        <Settings size={16} />
        Backend
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Backend</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">URL do Backend:</label>
              <Input
                value={formatURL(backendURL)}
                onChange={(e) => setBackendURL(e.target.value)}
                placeholder="https://sua-url-ngrok.ngrok-free.app"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Exemplo: https://17a5-177-212-28-159.ngrok-free.app
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              ) : isConnected ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <X size={16} className="text-red-600" />
              )}
              <span className="text-sm">
                {isLoading ? 'Testando conexão...' : 
                 isConnected ? 'Conectado com sucesso!' : 
                 'Não foi possível conectar'}
              </span>
            </div>

            <Button
              onClick={testConnectionStatus}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BackendConfig;

