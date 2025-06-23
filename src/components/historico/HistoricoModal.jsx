import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useHistorico } from '../../hooks/useHistorico';

const HistoricoModal = ({ isOpen, onClose }) => {
  const { historico, loading, error, refetch } = useHistorico();

  useEffect(() => {
    if (isOpen) {
      refetch(); // Recarrega o histórico toda vez que o modal é aberto
    }
  }, [isOpen, refetch]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Histórico de Alterações</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {loading && <p>Carregando histórico...</p>}
          {error && <p className="text-red-500">Erro ao carregar histórico: {error}</p>}
          {!loading && !error && historico.length === 0 && <p>Nenhuma alteração registrada.</p>}
          
          {!loading && !error && historico.length > 0 && (
            <div className="max-h-96 overflow-y-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historico.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTimestamp(item.timestamp)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.usuario_nome}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.acao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.detalhes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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


