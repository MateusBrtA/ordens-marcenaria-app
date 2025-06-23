import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx'
import { Plus, X } from 'lucide-react'

export function AddOrderModal({ isOpen, onClose, onAddOrder, carpenters }) {
  const [formData, setFormData] = useState({
    id: '',
    description: '',
    entryDate: '',
    exitDate: '',
    carpenter: '',
    materials: []
  })
  const [newMaterial, setNewMaterial] = useState({ description: '', quantity: 1 })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.id || !formData.description || !formData.entryDate || !formData.exitDate) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const order = {
      ...formData,
      status: 'recebida',
      createdAt: new Date().toISOString()
    }

    onAddOrder(order)
    setFormData({
      id: '',
      description: '',
      entryDate: '',
      exitDate: '',
      carpenter: '',
      materials: []
    })
    onClose()
  }

  const addMaterial = () => {
    if (newMaterial.description.trim()) {
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, { ...newMaterial, id: Date.now() }]
      }))
      setNewMaterial({ description: '', quantity: 1 })
    }
  }

  const removeMaterial = (materialId) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.id !== materialId)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Ordem</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nº da Ordem *</label>
            <Input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
              placeholder="Ex: OS-123"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descrição do Serviço *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o serviço a ser realizado..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Data de Entrada *</label>
              <Input
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, entryDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estimativa de Saída *</label>
              <Input
                type="date"
                value={formData.exitDate}
                onChange={(e) => setFormData(prev => ({ ...prev, exitDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Encarregado (Opcional)</label>
            <Select value={formData.carpenter} onValueChange={(value) => setFormData(prev => ({ ...prev, carpenter: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="(Nenhum)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">(Nenhum)</SelectItem>
                {carpenters.map(carpenter => (
                  <SelectItem key={carpenter} value={carpenter}>{carpenter}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Materiais Iniciais</label>
            
            {/* Lista de materiais */}
            {formData.materials.length > 0 && (
              <div className="space-y-2 mb-4">
                {formData.materials.map(material => (
                  <div key={material.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{material.description} (Qtd: {material.quantity})</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMaterial(material.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar novo material */}
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
              <Button type="button" onClick={addMaterial} size="sm">
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
              Salvar Ordem
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

