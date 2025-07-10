import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import api from '../services/api';

export function BackendUrlChanger({ variant = "login" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storedUrl = localStorage.getItem('backendUrl');
    if (storedUrl) {
      setBackendUrl(storedUrl);
    } else {
      setBackendUrl(api.defaults.baseURL);
    }

    // Listener para mudanças na URL do backend
    const handleBackendUrlChange = (event) => {
      if (event.detail && event.detail.newUrl) {
        setBackendUrl(event.detail.newUrl);
      }
    };

    window.addEventListener('backendUrlChanged', handleBackendUrlChange);
    
    return () => {
      window.removeEventListener('backendUrlChanged', handleBackendUrlChange);
    };
  }, []);

  const handleSave = () => {
    setError('');
    setSuccess('');
    
    if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      setError('A URL deve começar com http:// ou https://');
      return;
    }
    
    try {
      new URL(backendUrl);
    } catch (e) {
      setError('URL inválida');
      return;
    }

    // Salvar no localStorage
    localStorage.setItem('backendUrl', backendUrl);
    
    // Atualizar api.js
    api.defaults.baseURL = backendUrl;
    
    // Disparar evento personalizado para sincronizar outros componentes
    window.dispatchEvent(new CustomEvent('backendUrlChanged', {
      detail: { newUrl: backendUrl }
    }));
    
    setSuccess('URL do backend atualizada com sucesso!');
    
    setTimeout(() => {
      setIsOpen(false);
      // Recarregar apenas se estivermos na tela de login
      if (variant === "login") {
        window.location.reload();
      }
    }, 1500);
  };

  // Estilo baseado na variante
  const buttonStyle = variant === "login" 
    ? "border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
    : "border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700";

  const buttonText = variant === "login" 
    ? "Configurar Backend"
    : "Alterar URL do Backend";

  const buttonPosition = variant === "login" 
    ? "absolute top-4 right-4"
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`${buttonPosition} ${buttonStyle} flex items-center gap-2`}
        >
          <Settings size={16} />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar URL do Backend</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="backendUrl">
              URL do Backend
            </Label>
            <Input
              id="backendUrl"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="Ex: https://seu-backend.ngrok.io/api"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Insira a URL completa do seu backend (incluindo /api se necessário)
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

