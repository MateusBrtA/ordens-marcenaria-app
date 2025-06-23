import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMarceneiros } from '../../hooks/useMarceneiros';
import { Trash2 } from 'lucide-react';

const ManageCarpenterModal = ({ isOpen, onClose, marceneiros, refetchMarceneiros }) => {
  const [newCarpenterName, setNewCarpenterName] = useState('');
  const { createMarceneiro, deleteMarceneiro } = useMarceneiros();

  const handleAddCarpenter = async () => {
    if (newCarpenterName.trim() === '') return;
    const result = await createMarceneiro({ nome: newCarpenterName });
    if (result.success) {
      setNewCarpenterName('');
      refetchMarceneiros();
    } else {
      alert(result.message);
    }
  };

  const handleDeleteCarpenter = async (id) => {
    if (confirm('Tem certeza que deseja excluir este marceneiro?')) {
      const result = await deleteMarceneiro(id);
      if (result.success) {
        refetchMarceneiros();
      } else {
        alert(result.message);
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
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Nome do novo marceneiro"
              value={newCarpenterName}
              onChange={(e) => setNewCarpenterName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddCarpenter}>Adicionar</Button>
          </div>
          <div className="max-h-60 overflow-y-auto border rounded-md p-2">
            {marceneiros.length === 0 ? (
              <p className="text-gray-500 text-center">Nenhum marceneiro cadastrado.</p>
            ) : (
              marceneiros.map((carpenter) => (
                <div key={carpenter.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span>{carpenter.nome}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCarpenter(carpenter.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
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


