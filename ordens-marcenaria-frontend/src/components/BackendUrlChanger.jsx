import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import api, { systemConfigAPI, initializeBackendUrl } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export function BackendUrlChanger({ variant = "login" }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [backendUrl, setBackendUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUrl = localStorage.getItem("backendUrl");
    if (storedUrl) {
      setBackendUrl(storedUrl);
    } else {
      setBackendUrl(api.defaults.baseURL.replace("/api", ""));
    }

    // Listener para mudanças na URL do backend
    const handleBackendUrlChange = (event) => {
      if (event.detail && event.detail.newUrl) {
        setBackendUrl(event.detail.newUrl);
      }
    };

    window.addEventListener("backendUrlChanged", handleBackendUrlChange);

    return () => {
      window.removeEventListener("backendUrlChanged", handleBackendUrlChange);
    };
  }, []);

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
      // Se o usuário estiver logado e for admin, salvar globalmente
      if (user && user.role === "administrador") {
        console.log("👑 Salvando URL do backend globalmente (admin)...");
        await systemConfigAPI.setBackendUrl(backendUrl);
        setSuccess("URL do backend atualizada globalmente para todos os usuários!");
      } else {
        console.log("👤 Salvando URL do backend localmente...");
        setSuccess("URL do backend atualizada localmente!");
      }

      // Salvar no localStorage (sempre)
      localStorage.setItem("backendUrl", backendUrl);

      // Atualizar api.js
      api.defaults.baseURL = backendUrl.endsWith("/api") ? backendUrl : `${backendUrl}/api`;

      // Disparar evento personalizado para sincronizar outros componentes
      window.dispatchEvent(
        new CustomEvent("backendUrlChanged", {
          detail: { newUrl: backendUrl },
        })
      );

      setTimeout(() => {
        setIsOpen(false);
        // Recarregar apenas se estivermos na tela de login
        if (variant === "login") {
          window.location.reload();
        }
      }, 2000);
    } catch (err) {
      console.error("❌ Erro ao salvar URL do backend:", err);
      setError("Erro ao salvar configuração: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Estilo baseado na variante
  const buttonStyle =
    variant === "login"
      ? "border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
      : "border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700";

  const buttonText = variant === "login" ? "Configurar Backend" : "Alterar URL do Backend";

  const buttonPosition = variant === "login" ? "absolute top-4 right-4" : "";

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
            <Label htmlFor="backendUrl">URL do Backend</Label>
            <Input
              id="backendUrl"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="Ex: https://seu-backend.ngrok.io"
              className="w-full"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Insira a URL completa do seu backend (sem /api no final)
            </p>

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
                  Esta alteração será aplicada apenas neste dispositivo. Para configuração global, faça login como administrador.
                </p>
              </div>
            )}
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
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-green-500 hover:bg-green-600 text-white"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}