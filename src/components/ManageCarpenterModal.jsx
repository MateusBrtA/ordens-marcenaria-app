import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx'
import { Trash2 } from 'lucide-react'

export function ManageCarpenterModal({ isOpen, onClose, carpenters, onAddCarpenter, onRemoveCarpenter, orders }) {
  const [newCarpenterName, setNewCarpenterName] = useState('')

  const handleAddCarpenter = () => {
    if (newCarpenterName.trim()) {
      onAddCarpenter(newCarpenterName.trim())
      setNewCarpenterName('')
    }
  }

  const getCarpenterStats = (carpenterName) => {
    const carpenterOrders = orders.filter(order => order.carpenter === carpenterName)
    const total = carpenterOrders.length
    const statusCounts = {
      atrasada: carpenterOrders.filter(o => o.status === 'atrasada').length,
      paraHoje: carpenterOrders.filter(o => o.status === 'paraHoje').length,
      emProcesso: carpenterOrders.filter(o => o.status === 'emProcesso').length,
      recebida: carpenterOrders.filter(o => o.status === 'recebida').length,
      concluida: carpenterOrders.filter(o => o.status === 'concluida').length
    }
    return { total, statusCounts }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Marceneiros</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Adicionar novo marceneiro */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Nome do novo marceneiro"
              value={newCarpenterName}
              onChange={(e) => setNewCarpenterName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCarpenter()}
              className="flex-1"
            />
            <Button 
              onClick={handleAddCarpenter}
              className="bg-green-500 hover:bg-green-600"
            >
              Adicionar
            </Button>
          </div>

          {/* Lista de marceneiros */}
          <div className="space-y-4">
            {carpenters.map(carpenter => {
              const stats = getCarpenterStats(carpenter)
              return (
                <div key={carpenter} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{carpenter}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveCarpenter(carpenter)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total de ordens: </span>
                      <span className="text-blue-600">{stats.total}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Atrasada:</span>
                        <span className="text-red-600">{stats.statusCounts.atrasada}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Para Hoje:</span>
                        <span className="text-orange-600">{stats.statusCounts.paraHoje}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Em Processo:</span>
                        <span className="text-yellow-600">{stats.statusCounts.emProcesso}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recebida:</span>
                        <span className="text-blue-600">{stats.statusCounts.recebida}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Concluída:</span>
                        <span className="text-gray-600">{stats.statusCounts.concluida}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {carpenters.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Nenhum marceneiro cadastrado ainda.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

