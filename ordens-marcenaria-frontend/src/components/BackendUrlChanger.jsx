import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Settings, AlertCircle, CheckCircle } from "lucide-react";
import { systemConfigAPI, testConnection, getCurrentBackendUrl, setBackendUrl } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export function BackendUrlChanger({ variant = "login" }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [backendUrl, setBackendUrlState] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const currentUrl = getCurrentBackendUrl();
    if (currentUrl) {
      setBackendUrlState(currentUrl);
    }

    // Listener para mudanças na URL do backend
    const handleBackendUrlChange = (event) => {
      if (event.detail && event.detail.newUrl) {
        setBackendUrlState(event.detail.newUrl);
      }
    };

    window.addEventListener("backendUrlChanged", handleBackendUrlChange);

    return () => {
      window.removeEventListener("backendUrlChanged", handleBackendUrlChange);
    };
  }, []);

  const handleTest = async () => {
    if (!backendUrl) {
      setError("Digite uma URL para testar");
      return;
    }

    setTesting(true);
    setError("");
    setSuccess("");

    try {
      // Temporariamente definir a URL para teste
      const originalUrl = getCurrentBackendUrl();
      setBackendUrl(backendUrl);
      
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

    if (!backendUrl.startsWith("http://") && !backendUrl.startsWith("https://")) {
      setError("A URL deve começar com http:// ou https://");
      setLoading(false);
      return;
    }

    try {
      new URL(backendUrl);
    } catch (e) {
      setError("URL inválida");
      setLoading(false);
      return;
    }

    try {
      // Primeiro, definir a URL localmente
      setBackendUrl(backendUrl);
      
      // Se o usuário estiver logado e for admin, tentar salvar globalmente
      if (user && user.role === "administrador") {
        try {
          console.log("👑 Tentando salvar URL globalmente...");
          await systemConfigAPI.setBackendUrl(backendUrl);
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

  const buttonStyle =
    variant === "login"
      ? "border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
      : "border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700";

  const buttonText = variant === "login" ? "Configurar Backend" : "Alterar URL do Backend";
  const buttonPosition = variant === "login" ? "absolute top-4 right-4" : "";

  // Mostrar aviso se não há URL configurada
  const hasUrl = getCurrentBackendUrl();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${buttonPosition} ${buttonStyle} flex items-center gap-2 ${!hasUrl ? 'animate-pulse border-red-500 text-red-600' : ''}`}
        >
          {!hasUrl ? <AlertCircle size={16} /> : <Settings size={16} />}
          {!hasUrl ? "Configurar Backend (Obrigatório)" : buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar URL do Backend</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!hasUrl && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm font-medium">⚠️ Configuração Obrigatória</p>
              <p className="text-red-600 text-xs">
                Você precisa configurar a URL do backend para usar a aplicação.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="backendUrl">URL do Backend</Label>
            <Input
              id="backendUrl"
              value={backendUrl}
              onChange={(e) => setBackendUrlState(e.target.value)}
              placeholder="Ex: https://seu-backend.ngrok.io"
              className="w-full"
              disabled={loading || testing}
            />
            <p className="text-xs text-gray-500">
              Insira a URL completa do seu backend (sem /api no final)
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTest}
              variant="outline"
              disabled={loading || testing || !backendUrl}
              className="flex-1"
            >
              {testing ? "Testando..." : "Testar Conexão"}
            </Button>
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
            className="bg-green-500 hover:bg-green-600 text-white"
            disabled={loading || !backendUrl}
          >
            {loading ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

