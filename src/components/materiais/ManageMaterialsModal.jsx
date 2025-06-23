import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMateriais } from '../../hooks/useMateriais';
import { Trash2 } from 'lucide-react';

const ManageMaterialsModal = ({ isOpen, onClose, materiais, refetchMateriais }) => {
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialStock, setNewMaterialStock] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [stockChange, setStockChange] = useState(0);
  const [stockOperation, setStockOperation] = useState('add'); // 'add' or 'remove'

  const { createMaterial, deleteMaterial, updateEstoque } = useMateriais();

  const handleAddMaterial = async () => {
    if (newMaterialName.trim() === '') return;
    const result = await createMaterial({ nome: newMaterialName, quantidade_estoque: parseInt(newMaterialStock) });
    if (result.success) {
      setNewMaterialName('');
      setNewMaterialStock(0);
      refetchMateriais();
    } else {
      alert(result.message);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (confirm('Tem certeza que deseja excluir este material?')) {
      const result = await deleteMaterial(id);
      if (result.success) {
        refetchMateriais();
      } else {
        alert(result.message);
      }
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedMaterial || stockChange === 0) return;
    const result = await updateEstoque(selectedMaterial.id, stockChange, stockOperation);
    if (result.success) {
      setSelectedMaterial(null);
      setStockChange(0);
      refetchMateriais();
    } else {
      alert(result.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Materiais</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Adicionar Material */}
          <h4 className="font-semibold">Adicionar Novo Material</h4>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Nome do novo material"
              value={newMaterialName}
              onChange={(e) => setNewMaterialName(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Estoque inicial"
              value={newMaterialStock}
              onChange={(e) => setNewMaterialStock(parseInt(e.target.value))}
              className="w-32"
            />
            <Button onClick={handleAddMaterial}>Adicionar</Button>
          </div>

          {/* Lista de Materiais */}
          <h4 className="font-semibold mt-4">Materiais Existentes</h4>
          <div className="max-h-60 overflow-y-auto border rounded-md p-2">
            {materiais.length === 0 ? (
              <p className="text-gray-500 text-center">Nenhum material cadastrado.</p>
            ) : (
              materiais.map((material) => (
                <div key={material.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span>{material.nome} (Estoque: {material.quantidade_estoque})</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMaterial(material)}
                    >
                      Ajustar Estoque
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ajustar Estoque */}
          {selectedMaterial && (
            <div className="border p-4 rounded-md mt-4">
              <h4 className="font-semibold mb-2">Ajustar Estoque de {selectedMaterial.nome}</h4>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={stockChange}
                  onChange={(e) => setStockChange(parseInt(e.target.value))}
                  className="w-24"
                />
                <select
                  value={stockOperation}
                  onChange={(e) => setStockOperation(e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="add">Adicionar</option>
                  <option value="remove">Remover</option>
                </select>
                <Button onClick={handleUpdateStock}>Aplicar</Button>
                <Button variant="outline" onClick={() => setSelectedMaterial(null)}>Cancelar</Button>
              </div>
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

export default ManageMaterialsModal;


