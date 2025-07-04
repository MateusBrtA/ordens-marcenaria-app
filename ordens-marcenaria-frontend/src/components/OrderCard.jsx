import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx'
import { Calendar, User, Package, Trash2, Plus, X } from 'lucide-react'

export function OrderCard({ order, onUpdateOrder, onDeleteOrder, carpenters }) {
  const [showMaterialsModal, setShowMaterialsModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [newMaterial, setNewMaterial] = useState({ description: '', quantity: 1 })

  const statusOptions = [
    { value: 'atrasada', label: 'Atrasada' },
    { value: 'paraHoje', label: 'Para Hoje' },
    { value: 'emProcesso', label: 'Em Processo' },
    { value: 'recebida', label: 'Recebida' },
    { value: 'concluida', label: 'Concluída' }
  ]

  const handleUpdateField = (field, value) => {
    const updatedOrder = { ...order, [field]: value }
    onUpdateOrder(updatedOrder)
  }

  const handleShowMaterials = () => {
    setEditingOrder({ ...order })
    setShowMaterialsModal(true)
  }

  const addMaterial = () => {
    if (newMaterial.description.trim()) {
      setEditingOrder(prev => ({
        ...prev,
        materials: [...(prev.materials || []), { ...newMaterial, id: Date.now() }]
      }))
      setNewMaterial({ description: '', quantity: 1 })
    }
  }

  const removeMaterial = (materialId) => {
    setEditingOrder(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.id !== materialId)
    }))
  }

  const saveMaterials = () => {
    onUpdateOrder(editingOrder)
    setShowMaterialsModal(false)
    setEditingOrder(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';

    // Se já é uma data formatada, retorna como está
    if (dateString.includes('/')) return dateString;

    // Se contém horário, extrair apenas a data
    let dateOnly = dateString;
    if (dateString.includes('T')) {
      dateOnly = dateString.split('T')[0];
    }

    // Criar data local ao invés de UTC
    const [year, month, day] = dateOnly.split('-');
    const date = new Date(year, month - 1, day, 12, 0, 0); // Meio-dia para evitar problemas de timezone

    // Verificar se a data é válida
    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString('pt-BR');
  }

  return (
    <>
      <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg">{order.id}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteOrder(order.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={16} />
          </Button>
        </div>

        <p className="text-gray-700 text-sm mb-3 line-clamp-2">{order.description}</p>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <User size={14} className="text-gray-500" />
            <Select
              value={order.carpenter || ''}
              onValueChange={(value) => handleUpdateField('carpenter', value)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Não atribuído" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">(Nenhum)</SelectItem>
                {carpenters.map(carpenter => (
                  <SelectItem key={carpenter} value={carpenter}>{carpenter}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-gray-500" />
            <span>Entrada: {formatDate(order.entryDate)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-gray-500" />
            <Input
              type="date"
              value={order.exitDate}
              onChange={(e) => handleUpdateField('exitDate', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="mb-3">
          <Select
            value={order.status}
            onValueChange={(value) => handleUpdateField('status', value)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleShowMaterials}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white h-8 text-sm"
        >
          <Package size={14} className="mr-2" />
          Materiais
        </Button>
      </div>

      {/* Modal de Materiais */}
      <Dialog open={showMaterialsModal} onOpenChange={setShowMaterialsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Materiais da Ordem #{order.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Lista de materiais */}
            {editingOrder?.materials?.length > 0 ? (
              <div className="space-y-2">
                {editingOrder.materials.map(material => (
                  <div key={material.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <span>{material.description} (Qtd: {material.quantity})</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMaterial(material.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum material adicionado ainda.</p>
            )}

            {/* Adicionar novo material */}
            <div>
              <h4 className="font-medium mb-2">Adicionar Novo Material</h4>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Descrição do material"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="1"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-20"
                />
                <Button onClick={addMaterial} className="bg-blue-500 hover:bg-blue-600">
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMaterialsModal(false)}>
              Cancelar
            </Button>
            <Button onClick={saveMaterials} className="bg-blue-500 hover:bg-blue-600">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

