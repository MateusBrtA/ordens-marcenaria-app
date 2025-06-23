import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { useOrdens } from '../../hooks/useOrdens';
import { usePermissions } from '../../hooks/usePermissions';

const OrderMaterialsModal = ({ isOpen, onClose, order, materiais, refetchOrdens }) => {
  const { updateOrdem } = useOrdens();
  const { canEditOrders } = usePermissions();
  const [currentMaterials, setCurrentMaterials] = useState([]);
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && order) {
      // Mapeia os materiais da ordem para incluir detalhes do material completo
      const materialsWithDetails = order.materiais.map(orderMat => {
        const fullMaterial = materiais.find(m => m.id === orderMat.material_id);
        return fullMaterial ? { ...fullMaterial, quantidade: orderMat.quantidade } : orderMat;
      });
      setCurrentMaterials(materialsWithDetails);
      setMaterialSearchTerm('');
      setError('');
    }
  }, [isOpen, order, materiais]);

  const handleAddMaterial = (material) => {
    if (!currentMaterials.some(m => m.id === material.id)) {
      setCurrentMaterials([...currentMaterials, { ...material, quantidade: 1 }]);
    }
  };

  const handleUpdateMaterialQuantity = (id, quantidade) => {
    setCurrentMaterials(currentMaterials.map(m => 
      m.id === id ? { ...m, quantidade: parseInt(quantidade) || 0 } : m
    ));
  };

  const handleRemoveMaterial = (id) => {
    setCurrentMaterials(currentMaterials.filter(m => m.id !== id));
  };

  const handleSaveMaterials = async () => {
    setError('');
    if (!order) return;

    const materialsToSave = currentMaterials.map(m => ({
      material_id: m.id,
      quantidade: m.quantidade
    }));

    const result = await updateOrdem(order.id, { materiais: materialsToSave });
    if (result.success) {
      refetchOrdens();
      onClose();
    } else {
      setError(result.message);
    }
  };

  const filteredAvailableMaterials = materiais.filter(material =>
    material.nome.toLowerCase().includes(materialSearchTerm.toLowerCase()) &&
    !currentMaterials.some(m => m.id === material.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Materiais da Ordem: {order?.numero_ordem}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {canEditOrders && (
            <div className="col-span-4">
              <h4 className="text-lg font-semibold mb-2">Adicionar Materiais</h4>
              <Input
                type="text"
                placeholder="Buscar material..."
                value={materialSearchTerm}
                onChange={(e) => setMaterialSearchTerm(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-40 overflow-y-auto border rounded p-2 mb-2">
                {filteredAvailableMaterials.length > 0 ? (
                  filteredAvailableMaterials.map(material => (
                    <div key={material.id} className="flex justify-between items-center py-1">
                      <span>{material.nome} (Estoque: {material.quantidade_estoque})</span>
                      <Button size="sm" onClick={() => handleAddMaterial(material)}>
                        Adicionar
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Nenhum material disponível para adicionar.</p>
                )}
              </div>
            </div>
          )}

          <div className="col-span-4">
            <h4 className="text-lg font-semibold mb-2">Materiais na Ordem</h4>
            <div className="border rounded p-2 max-h-60 overflow-y-auto">
              {currentMaterials.length > 0 ? (
                currentMaterials.map(material => (
                  <div key={material.id} className="flex items-center gap-2 py-1">
                    <span>{material.nome}</span>
                    {canEditOrders ? (
                      <Input
                        type="number"
                        value={material.quantidade}
                        onChange={(e) => handleUpdateMaterialQuantity(material.id, e.target.value)}
                        className="w-20"
                        min="1"
                      />
                    ) : (
                      <span>Quantidade: {material.quantidade}</span>
                    )}
                    {canEditOrders && (
                      <Button variant="destructive" size="sm" onClick={() => handleRemoveMaterial(material.id)}>
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Nenhum material associado a esta ordem.</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          {canEditOrders && <Button onClick={handleSaveMaterials}>Salvar Alterações</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderMaterialsModal;