import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AddOrderModal = ({ isOpen, onClose, onAddOrder, marceneiros, materiais }) => {
  const [numeroOrdem, setNumeroOrdem] = useState('');
  const [cliente, setCliente] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [status, setStatus] = useState('Pendente');
  const [marceneiroId, setMarceneiroId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setNumeroOrdem('');
      setCliente('');
      setDescricao('');
      setDataEntrega('');
      setStatus('Pendente');
      setMarceneiroId('');
      setObservacoes('');
      setSelectedMaterials([]);
      setMaterialSearchTerm('');
    }
  }, [isOpen]);

  const handleAddMaterial = (material) => {
    if (!selectedMaterials.some(m => m.id === material.id)) {
      setSelectedMaterials([...selectedMaterials, { ...material, quantidade: 1 }]);
    }
  };

  const handleUpdateMaterialQuantity = (id, quantidade) => {
    setSelectedMaterials(selectedMaterials.map(m => 
      m.id === id ? { ...m, quantidade: parseInt(quantidade) || 0 } : m
    ));
  };

  const handleRemoveMaterial = (id) => {
    setSelectedMaterials(selectedMaterials.filter(m => m.id !== id));
  };

  const handleSubmit = () => {
    const newOrder = {
      id: numeroOrdem, // Usado como numero_ordem no backend
      cliente,
      description: descricao,
      exitDate: dataEntrega,
      status,
      marceneiro_id: marceneiroId ? parseInt(marceneiroId) : null,
      observacoes,
      materials: selectedMaterials.map(m => ({ material_id: m.id, quantidade: m.quantidade }))
    };
    onAddOrder(newOrder);
  };

  const filteredMateriais = materiais.filter(material =>
    material.nome.toLowerCase().includes(materialSearchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Ordem de Serviço</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="numeroOrdem" className="text-right">Nº da Ordem</label>
            <Input id="numeroOrdem" value={numeroOrdem} onChange={(e) => setNumeroOrdem(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="cliente" className="text-right">Cliente</label>
            <Input id="cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="descricao" className="text-right">Descrição</label>
            <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="dataEntrega" className="text-right">Data de Entrega</label>
            <Input type="date" id="dataEntrega" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="status" className="text-right">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="marceneiro" className="text-right">Marceneiro</label>
            <Select value={marceneiroId} onValueChange={setMarceneiroId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o Marceneiro" />
              </SelectTrigger>
              <SelectContent>
                {marceneiros.map(carpenter => (
                  <SelectItem key={carpenter.id} value={carpenter.id.toString()}>{carpenter.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="observacoes" className="text-right">Observações</label>
            <Textarea id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="col-span-3" />
          </div>

          {/* Gerenciamento de Materiais na Ordem */}
          <div className="col-span-4">
            <h4 className="text-lg font-semibold mb-2">Materiais da Ordem</h4>
            <Input
              type="text"
              placeholder="Buscar material..."
              value={materialSearchTerm}
              onChange={(e) => setMaterialSearchTerm(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-40 overflow-y-auto border rounded p-2 mb-2">
              {filteredMateriais.length > 0 ? (
                filteredMateriais.map(material => (
                  <div key={material.id} className="flex justify-between items-center py-1">
                    <span>{material.nome} (Estoque: {material.quantidade_estoque})</span>
                    <Button size="sm" onClick={() => handleAddMaterial(material)} disabled={selectedMaterials.some(m => m.id === material.id)}>
                      Adicionar
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Nenhum material encontrado.</p>
              )}
            </div>
            <div className="border rounded p-2">
              {selectedMaterials.length > 0 ? (
                selectedMaterials.map(material => (
                  <div key={material.id} className="flex items-center gap-2 py-1">
                    <span>{material.nome}</span>
                    <Input
                      type="number"
                      value={material.quantidade}
                      onChange={(e) => handleUpdateMaterialQuantity(material.id, e.target.value)}
                      className="w-20"
                      min="1"
                    />
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveMaterial(material.id)}>
                      Remover
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Nenhum material adicionado à ordem.</p>
              )}
            </div>
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Adicionar Ordem</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderModal;