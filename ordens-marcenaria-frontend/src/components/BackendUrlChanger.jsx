import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Settings, AlertCircle, CheckCircle, RotateCcw } from "lucide-react";
import { systemConfigAPI, testConnection, getCurrentBackendUrl, setBackendUrl, clearManualBackendUrl } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export function BackendUrlChanger({ variant = "login" }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const currentUrl = getCurrentBackendUrl();
    if (currentUrl) {
      setUrl(currentUrl);
    }

    // Listener para mudanças na URL do backend
    const handleBackendUrlChange = (event) => {
      if (event.detail && event.detail.newUrl) {
        setUrl(event.detail.newUrl);
      }
    };

    window.addEventListener("backendUrlChanged", handleBackendUrlChange);

    return () => {
      window.removeEventListener("backendUrlChanged", handleBackendUrlChange);
    };
  }, []);

  const handleTest = async () => {
    if (!url) {
      setError("Digite uma URL para testar");
      return;
    }

    setTesting(true);
    setError("");
    setSuccess("");

    try {
      // Temporariamente definir a URL para teste
      const originalUrl = getCurrentBackendUrl();
      setBackendUrl(url);
      
      const isConnected = await testConnection();
      
      if (isConnected) {
        setSuccess("✅ Conexão testada com sucesso!");
      } else {
        setError("❌ Não foi possível conectar com esta URL");
        // Restaurar URL original se o teste falhar
        if (originalUrl) {
          setBackendUrl(originalUrl);
        }
      }
    } catch (err) {
      setError("❌ Erro ao testar conexão: " + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    if (!url.trim()) {
      setError("Digite a URL do backend");
      setLoading(false);
      return;
    }

    try {
      // Primeiro, definir a URL localmente
      const cleanUrl = setBackendUrl(url);
      
      // Se o usuário estiver logado e for admin, tentar salvar globalmente
      if (user && user.role === "administrador") {
        try {
          console.log("👑 Tentando salvar URL globalmente...");
          await systemConfigAPI.setBackendUrl(cleanUrl);
          setSuccess("✅ URL salva globalmente para todos os usuários!");
        } catch (globalError) {
          console.log("⚠️ Não foi possível salvar globalmente, mas URL foi salva localmente");
          setSuccess("✅ URL salva localmente! (Não foi possível salvar globalmente)");
        }
      } else {
        setSuccess("✅ URL salva localmente!");
      }

      setTimeout(() => {
        setIsOpen(false);
        if (variant === "login") {
          window.location.reload();
        }
      }, 2000);
    } catch (err) {
      console.error("❌ Erro ao salvar URL:", err);
      setError("Erro ao salvar: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setError("");
    setSuccess("");
    
    try {
      const defaultUrl = clearManualBackendUrl();
      setUrl(defaultUrl);
      setSuccess("✅ Configuração resetada para o padrão!");
      
      setTimeout(() => {
        setIsOpen(false);
        if (variant === "login") {
          window.location.reload();
        }
      }, 2000);
    } catch (err) {
      setError("❌ Erro ao resetar configuração: " + err.message);
    }
  };

  const buttonStyle =
    variant === "login"
      ? "border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
      : "border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700";

  const buttonText = variant === "login" ? "Configurar Backend" : "Alterar URL do Backend";
  const buttonPosition = variant === "login" ? "absolute top-4 right-4" : "";

  // Verificar se há configuração manual
  const hasManualConfig = localStorage.getItem("backendUrl");
  const envUrl = import.meta.env.VITE_API_URL;
  const currentUrl = getCurrentBackendUrl();

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar URL do Backend</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-blue-700 text-sm font-medium">ℹ️ Informações de Configuração</p>
            <div className="text-blue-600 text-xs mt-2 space-y-1">
              <p><strong>URL Atual:</strong> {currentUrl}</p>
              {envUrl && (
                <p><strong>Variável de Ambiente:</strong> {envUrl}</p>
              )}
              {hasManualConfig && (
                <p><strong>Configuração Manual:</strong> Ativa</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL do Backend</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://sua-url-ngrok.ngrok-free.app"
              className="w-full"
              disabled={loading || testing}
            />
            <p className="text-xs text-gray-500">
              Digite a URL completa do seu backend (incluindo https://)
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTest}
              variant="outline"
              disabled={loading || testing || !url}
              className="flex-1"
            >
              {testing ? "Testando..." : "Testar Conexão"}
            </Button>
            
            {hasManualConfig && (
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={loading || testing}
                className="flex items-center gap-2"
                title="Resetar para configuração padrão"
              >
                <RotateCcw size={16} />
                Reset
              </Button>
            )}
          </div>

          {user && user.role === "administrador" && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-blue-700 text-sm font-medium">👑 Configuração Global</p>
              <p className="text-blue-600 text-xs">
                Como administrador, esta alteração será aplicada para todos os usuários do sistema.
              </p>
            </div>
          )}

          {(!user || user.role !== "administrador") && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-yellow-700 text-sm font-medium">👤 Configuração Local</p>
              <p className="text-yellow-600 text-xs">
                Esta alteração será aplicada apenas neste dispositivo.
              </p>
            </div>
          )}

          {hasManualConfig && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <p className="text-orange-700 text-sm font-medium">⚠️ Configuração Manual Ativa</p>
              <p className="text-orange-600 text-xs">
                Você tem uma configuração manual que sobrescreve as configurações automáticas. 
                Use "Reset" para voltar ao padrão.
              </p>
            </div>
          )}

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
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={loading || !url}
          >
            {loading ? "Salvando..." : "Salvar URL"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

