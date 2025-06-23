import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useMarceneiros } from '../../hooks/useMarceneiros';
import { usePermissions } from '../../hooks/usePermissions';

const ManageCarpenterModal = ({ isOpen, onClose }) => {
  const { marceneiros, createMarceneiro, deleteMarceneiro, refetch: refetchMarceneiros } = useMarceneiros();
  const { canManageMarceneiros } = usePermissions();
  const [newCarpenterName, setNewCarpenterName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      refetchMarceneiros();
      setNewCarpenterName('');
      setError('');
    }
  }, [isOpen, refetchMarceneiros]);

  const handleAddCarpenter = async () => {
    if (!newCarpenterName.trim()) {
      setError('O nome do marceneiro não pode ser vazio.');
      return;
    }
    setError('');
    const result = await createMarceneiro({ nome: newCarpenterName });
    if (result.success) {
      setNewCarpenterName('');
    } else {
      setError(result.message);
    }
  };

  const handleRemoveCarpenter = async (id) => {
    if (confirm('Tem certeza que deseja remover este marceneiro?')) {
      const result = await deleteMarceneiro(id);
      if (!result.success) {
        setError(result.message);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Marceneiros</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {canManageMarceneiros && (
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Nome do novo marceneiro"
                value={newCarpenterName}
                onChange={(e) => setNewCarpenterName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddCarpenter();
                }}
              />
              <Button onClick={handleAddCarpenter}>Adicionar</Button>
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="max-h-60 overflow-y-auto border rounded-md p-2">
            {marceneiros.length === 0 ? (
              <p className="text-gray-500 text-center">Nenhum marceneiro cadastrado.</p>
            ) : (
              marceneiros.map((carpenter) => (
                <div key={carpenter.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span>{carpenter.nome}</span>
                  {canManageMarceneiros && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCarpenter(carpenter.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageCarpenterModal;