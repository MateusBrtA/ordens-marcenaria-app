import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
      // Resetar estados ao fechar o modal
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
    if (!selectedMaterials.find(m => m.id === material.id)) {
      setSelectedMaterials([...selectedMaterials, { ...material, quantidade: 1 }]);
    }
  };

  const handleRemoveMaterial = (materialId) => {
    setSelectedMaterials(selectedMaterials.filter(m => m.id !== materialId));
  };

  const handleQuantityChange = (materialId, quantidade) => {
    setSelectedMaterials(selectedMaterials.map(m => 
      m.id === materialId ? { ...m, quantidade: parseInt(quantidade) || 0 } : m
    ));
  };

  const handleSubmit = () => {
    const newOrder = {
      id: numeroOrdem,
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
            <Label htmlFor="numeroOrdem" className="text-right">Nº da Ordem</Label>
            <Input id="numeroOrdem" value={numeroOrdem} onChange={(e) => setNumeroOrdem(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cliente" className="text-right">Cliente</Label>
            <Input id="cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="descricao" className="text-right">Descrição</Label>
            <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dataEntrega" className="text-right">Data de Entrega</Label>
            <Input type="date" id="dataEntrega" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
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
            <Label htmlFor="marceneiro" className="text-right">Marceneiro</Label>
            <Select value={marceneiroId} onValueChange={setMarceneiroId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o Marceneiro" />
              </SelectTrigger>
              <SelectContent>
                {marceneiros.map(m => (
                  <SelectItem key={m.id} value={m.id.toString()}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="observacoes" className="text-right">Observações</Label>
            <Textarea id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="col-span-3" />
          </div>

          {/* Material Selection */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right">Materiais</Label>
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
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Materiais Selecionados:</h4>
                {selectedMaterials.length === 0 ? (
                  <p className="text-gray-500">Nenhum material selecionado.</p>
                ) : (
                  selectedMaterials.map(material => (
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


