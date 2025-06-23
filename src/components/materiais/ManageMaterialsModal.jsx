import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { useMateriais } from '../../hooks/useMateriais';
import { usePermissions } from '../../hooks/usePermissions';

const ManageMaterialsModal = ({ isOpen, onClose }) => {
  const { materiais, createMaterial, updateMaterial, deleteMaterial, updateEstoque, refetch: refetchMateriais } = useMateriais();
  const { canManageMaterials } = usePermissions();
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialEstoque, setNewMaterialEstoque] = useState(0);
  const [editingMaterial, setEditingMaterial] = useState(null); // Material being edited
  const [editName, setEditName] = useState('');
  const [editEstoque, setEditEstoque] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      refetchMateriais();
      setNewMaterialName('');
      setNewMaterialEstoque(0);
      setEditingMaterial(null);
      setError('');
    }
  }, [isOpen, refetchMateriais]);

  const handleAddMaterial = async () => {
    if (!newMaterialName.trim()) {
      setError('O nome do material não pode ser vazio.');
      return;
    }
    setError('');
    const result = await createMaterial({ nome: newMaterialName, quantidade_estoque: newMaterialEstoque });
    if (result.success) {
      setNewMaterialName('');
      setNewMaterialEstoque(0);
    } else {
      setError(result.message);
    }
  };

  const handleRemoveMaterial = async (id) => {
    if (confirm('Tem certeza que deseja remover este material?')) {
      const result = await deleteMaterial(id);
      if (!result.success) {
        setError(result.message);
      }
    }
  };

  const handleEditClick = (material) => {
    setEditingMaterial(material);
    setEditName(material.nome);
    setEditEstoque(material.quantidade_estoque);
  };

  const handleUpdateMaterial = async () => {
    if (!editName.trim()) {
      setError('O nome do material não pode ser vazio.');
      return;
    }
    setError('');
    const result = await updateMaterial(editingMaterial.id, { nome: editName, quantidade_estoque: editEstoque });
    if (result.success) {
      setEditingMaterial(null);
    } else {
      setError(result.message);
    }
  };

  const handleUpdateEstoque = async (id, quantidade, operacao) => {
    const result = await updateEstoque(id, quantidade, operacao);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Materiais</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {canManageMaterials && (
            <div className="flex items-center space-x-2 mb-4">
              <Input
                placeholder="Nome do novo material"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Estoque inicial"
                value={newMaterialEstoque}
                onChange={(e) => setNewMaterialEstoque(parseInt(e.target.value) || 0)}
                className="w-32"
              />
              <Button onClick={handleAddMaterial}>Adicionar Material</Button>
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="max-h-80 overflow-y-auto border rounded-md p-2">
            {materiais.length === 0 ? (
              <p className="text-gray-500 text-center">Nenhum material cadastrado.</p>
            ) : (
              materiais.map((material) => (
                <div key={material.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  {editingMaterial?.id === material.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={editEstoque}
                        onChange={(e) => setEditEstoque(parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                      <Button size="sm" onClick={handleUpdateMaterial}>Salvar</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingMaterial(null)}>Cancelar</Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex justify-between items-center">
                      <span>{material.nome} (Estoque: {material.quantidade_estoque})</span>
                      {canManageMaterials && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateEstoque(material.id, 1, 'adicionar')}
                          >
                            +1
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateEstoque(material.id, 1, 'remover')}
                            disabled={material.quantidade_estoque <= 0}
                          >
                            -1
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(material)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMaterial(material.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
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

export default ManageMaterialsModal;