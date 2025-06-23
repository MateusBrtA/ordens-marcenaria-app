import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useHistorico } from '../../hooks/useHistorico';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HistoricoModal = ({ isOpen, onClose }) => {
  const { historico, loading, error, refetch } = useHistorico();

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const formatTimestamp = (timestamp) => {
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Histórico de Alterações</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {loading && <p>Carregando histórico...</p>}
          {error && <p className="text-red-500">Erro ao carregar histórico: {error}</p>}
          {!loading && !error && (
            <div className="max-h-96 overflow-y-auto border rounded-md p-2">
              {historico.length === 0 ? (
                <p className="text-gray-500 text-center">Nenhuma alteração registrada.</p>
              ) : (
                historico.map((registro) => (
                  <div key={registro.id} className="py-2 border-b last:border-b-0">
                    <p className="text-sm text-gray-600">{formatTimestamp(registro.timestamp)} - {registro.usuario_nome} ({registro.usuario_tipo_acesso})</p>
                    <p className="font-semibold">{registro.acao}</p>
                    <p className="text-sm text-gray-700">Detalhes: {registro.detalhes}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricoModal;