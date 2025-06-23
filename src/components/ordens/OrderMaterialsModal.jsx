
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrdens } from '../../hooks/useOrdens';
import { X } from 'lucide-react';

const OrderMaterialsModal = ({ isOpen, onClose, order, materiais, refetchOrdens }) => {
  const [currentMaterials, setCurrentMaterials] = useState([]);
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const { updateOrdem } = useOrdens();

  useEffect(() => {
    if (isOpen && order) {
      // Mapear materiais da ordem para incluir quantidade e detalhes do material
      const mappedMaterials = order.materials.map(orderMat => {
        const fullMaterial = materiais.find(m => m.id === orderMat.material_id);
        return fullMaterial ? { ...fullMaterial, quantidade: orderMat.quantidade } : null;
      }).filter(Boolean); // Remover nulos se algum material não for encontrado
      setCurrentMaterials(mappedMaterials);
    }
  }, [isOpen, order, materiais]);

  const handleAddMaterial = (material) => {
    if (!currentMaterials.find(m => m.id === material.id)) {
      setCurrentMaterials([...currentMaterials, { ...material, quantidade: 1 }]);
    }
  };

  const handleRemoveMaterial = (materialId) => {
    setCurrentMaterials(currentMaterials.filter(m => m.id !== materialId));
  };

  const handleQuantityChange = (materialId, quantidade) => {
    setCurrentMaterials(currentMaterials.map(m => 
      m.id === materialId ? { ...m, quantidade: parseInt(quantidade) || 0 } : m
    ));
  };

  const handleSaveMaterials = async () => {
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
      alert(result.message);
    }
  };

  const filteredMateriais = materiais.filter(material =>
    material.nome.toLowerCase().includes(materialSearchTerm.toLowerCase())
  );

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Materiais da Ordem: {order.id}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Material Selection */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right">Adicionar Material</Label>
            <div className="col-span-3 space-y-2">
              <Input 
                placeholder="Buscar material..."
                value={materialSearchTerm}
                onChange={(e) => setMaterialSearchTerm(e.target.value)}
              />
              <div className="max-h-40 overflow-y-auto border rounded p-2">
                {filteredMateriais.length === 0 ? (
                  <p className="text-gray-500">Nenhum material encontrado.</p>
                ) : (
                  filteredMateriais.map(material => (
                    <div key={material.id} className="flex justify-between items-center py-1">
                      <span>{material.nome} (Estoque: {material.quantidade_estoque})</span>
                      <Button variant="outline" size="sm" onClick={() => handleAddMaterial(material)}>
                        Adicionar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Selected Materials */}
          <div className="grid grid-cols-4 items-start gap-4 mt-4">
            <Label className="text-right">Materiais Utilizados</Label>
            <div className="col-span-3 space-y-2">
              {currentMaterials.length === 0 ? (
                <p className="text-gray-500">Nenhum material selecionado para esta ordem.</p>
              ) : (
                currentMaterials.map(material => (
                  <div key={material.id} className="flex items-center gap-2 mb-2 border p-2 rounded">
                    <span className="flex-1">{material.nome}</span>
                    <Input
                      type="number"
                      value={material.quantidade}
                      onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                      className="w-20 text-center"
                      min="1"
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveMaterial(material.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSaveMaterials}>Salvar Materiais</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderMaterialsModal;


