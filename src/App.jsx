import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx'
import { Plus, Users, FileSpreadsheet, LayoutGrid, List, Trash2, X } from 'lucide-react'
import { exportToExcel } from './utils/excelExport.js'
import './App.css'

function App() {
  const [orders, setOrders] = useState(() => {
    const savedOrders = localStorage.getItem("orders")
    return savedOrders ? JSON.parse(savedOrders) : [
      {
        id: 'OS-001',
        description: 'Mesa de jantar em madeira maciça',
        entryDate: '2025-06-20',
        exitDate: '2025-06-25',
        carpenter: 'Jadir',
        status: 'recebida',
        materials: [
          { id: 1, description: 'Madeira de carvalho', quantity: 5 },
          { id: 2, description: 'Parafusos', quantity: 20 }
        ]
      }
    ]
  })
  const [carpenters, setCarpenters] = useState(() => {
    const savedCarpenters = localStorage.getItem("carpenters")
    return savedCarpenters ? JSON.parse(savedCarpenters) : ['Jadir']
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCarpenter, setSelectedCarpenter] = useState('Todos')
  const [statusFilters, setStatusFilters] = useState({
    atrasada: true,
    paraHoje: true,
    emProcesso: true,
    recebida: true,
    concluida: true
  })
  const [viewMode, setViewMode] = useState('cards')
  const [showAddOrderModal, setShowAddOrderModal] = useState(false)
  const [showManageCarpenterModal, setShowManageCarpenterModal] = useState(false)
  const [showMaterialsModal, setShowMaterialsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const statusColumns = [
    { key: 'atrasada', title: 'Atrasada', color: 'bg-red-500' },
    { key: 'paraHoje', title: 'Para Hoje', color: 'bg-orange-400' },
    { key: 'emProcesso', title: 'Em Processo', color: 'bg-yellow-400' },
    { key: 'recebida', title: 'Recebida', color: 'bg-blue-400' },
    { key: 'concluida', title: 'Concluída', color: 'bg-gray-500' }
  ]

  // Função para atualizar status automaticamente baseado na data
  const updateOrderStatus = (order) => {
    if (order.status === 'concluida') return order.status

    const today = new Date()
    const exitDate = new Date(order.exitDate)

    today.setHours(0, 0, 0, 0)
    exitDate.setHours(0, 0, 0, 0)

    if (exitDate < today) {
      return 'atrasada'
    } else if (exitDate.getTime() === today.getTime()) {
      return 'paraHoje'
    }

    return order.status
  }

  // Atualizar status das ordens automaticamente
  useEffect(() => {
    setOrders(prevOrders =>
      prevOrders.map(order => ({
        ...order,
        status: updateOrderStatus(order)
      }))
    )
  }, [])

  // Persistir ordens no localStorage
  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders))
  }, [orders])

  // Persistir marceneiros no localStorage
  useEffect(() => {
    localStorage.setItem("carpenters", JSON.stringify(carpenters))
  }, [carpenters])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCarpenter = selectedCarpenter === 'Todos' || order.carpenter === selectedCarpenter
    const matchesStatus = statusFilters[order.status]
    return matchesSearch && matchesCarpenter && matchesStatus
  })

  const getOrdersByStatus = (status) => {
    return filteredOrders.filter(order => order.status === status)
  }

  const handleAddOrder = (newOrder) => {
    const orderWithUpdatedStatus = {
      ...newOrder,
      status: updateOrderStatus(newOrder)
    }
    setOrders(prev => [...prev, orderWithUpdatedStatus])
  }

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ))
  }

  const handleUpdateOrder = (updatedOrder) => {
    const orderWithUpdatedStatus = {
      ...updatedOrder,
      status: updateOrderStatus(updatedOrder)
    }
    setOrders(prev => prev.map(order =>
      order.id === updatedOrder.id ? orderWithUpdatedStatus : order
    ))
  }

  const handleDeleteOrder = (orderId) => {
    if (confirm('Tem certeza que deseja excluir esta ordem?')) {
      setOrders(prev => prev.filter(order => order.id !== orderId))
    }
  }

  const handleAddCarpenter = (name) => {
    if (!carpenters.includes(name)) {
      setCarpenters(prev => [...prev, name])
    }
  }

  const handleRemoveCarpenter = (name) => {
    if (confirm(`Tem certeza que deseja remover o marceneiro "${name}"?`)) {
      setCarpenters(prev => prev.filter(c => c !== name))
      // Remover o marceneiro das ordens
      setOrders(prev => prev.map(order =>
        order.carpenter === name ? { ...order, carpenter: '' } : order
      ))
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const OrderCard = ({ order }) => (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow mb-3">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg">{order.id}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteOrder(order.id)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 size={16} />
        </Button>
      </div>

      <p className="text-gray-700 text-sm mb-3">{order.description}</p>

      <div className="space-y-2 mb-3 text-sm">
        <div>
          <strong>Encarregado:</strong>
          <Select
            value={order.carpenter || "none"}
            onValueChange={(value) => handleUpdateOrder({ ...order, carpenter: value === "none" ? null : value })}
          >
            <SelectTrigger className="h-8 text-sm w-40 inline-flex">
              <SelectValue placeholder="(Nenhum)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">(Nenhum)</SelectItem>
              {carpenters.map(carpenter => (
                <SelectItem key={carpenter} value={carpenter}>{carpenter}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <strong>Entrada:</strong> {formatDate(order.entryDate)}
        </div>
        <div>
          <strong>Saída:</strong> {formatDate(order.exitDate)}
        </div>
        <div>
          <strong>Materiais:</strong> {order.materials?.length || 0} itens
        </div>
      </div>

      <div className="space-y-2">
        <Select
          value={order.status}
          onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusColumns.map(option => (
              <SelectItem key={option.key} value={option.key}>
                {option.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => {
            setSelectedOrder(order)
            setShowMaterialsModal(true)
          }}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white h-8 text-sm"
        >
          Materiais
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Ordens de Serviço</h1>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            onClick={() => setShowAddOrderModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Adicionar Ordem
          </Button>
          <Button
            onClick={() => setShowManageCarpenterModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <Users size={20} />
            Gerenciar Marceneiros
          </Button>
          <Button
            onClick={() => {
              try {
                exportToExcel(orders, carpenters)
                alert('Arquivo Excel exportado com sucesso!')
              } catch (error) {
                alert('Erro ao exportar: ' + error.message)
                console.error('Erro na exportação:', error)
              }
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <FileSpreadsheet size={20} />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        {/* Search */}
        <div className="flex-1 min-w-64">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar por Nº da Ordem
          </label>
          <Input
            type="text"
            placeholder="Ex: OS-123"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Carpenter Filter */}
        <div className="flex-1 min-w-64">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Encarregado
          </label>
          <Select value={selectedCarpenter} onValueChange={setSelectedCarpenter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              {carpenters.map(carpenter => (
                <SelectItem key={carpenter} value={carpenter}>{carpenter}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filters */}
        <div className="flex-1 min-w-64">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Status
          </label>
          <div className="flex flex-wrap gap-2">
            {statusColumns.map(status => (
              <div key={status.key} className="flex items-center space-x-2">
                <Checkbox
                  id={status.key}
                  checked={statusFilters[status.key]}
                  onCheckedChange={(checked) =>
                    setStatusFilters(prev => ({ ...prev, [status.key]: checked }))
                  }
                />
                <label htmlFor={status.key} className="text-sm">
                  {status.title}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid size={16} />
          </Button>
          <Button
            variant={viewMode === 'lines' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('lines')}
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Orders Display */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {statusColumns.map(status => (
            <div key={status.key} className="bg-white rounded-lg shadow-sm">
              <div className={`${status.color} text-white p-3 rounded-t-lg flex justify-between items-center`}>
                <h3 className="font-semibold">{status.title}</h3>
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm text-black">
                  {getOrdersByStatus(status.key).length}
                </span>
              </div>
              <div className="p-4 min-h-96">
                {getOrdersByStatus(status.key).length === 0 ? (
                  <p className="text-gray-500 text-center">Nenhuma ordem aqui.</p>
                ) : (
                  getOrdersByStatus(status.key).map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4">
            <div className="grid grid-cols-6 gap-4 font-semibold text-gray-700 border-b pb-2 mb-4">
              <div>ID</div>
              <div>Descrição</div>
              <div>Encarregado</div>
              <div>Estimativa de Saída</div>
              <div>Status</div>
              <div>Ações</div>
            </div>
            {filteredOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma ordem encontrada.</p>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="grid grid-cols-6 gap-4 py-3 border-b items-center">
                  <div className="font-medium">{order.id}</div>
                  <div className="text-sm truncate" title={order.description}>
                    {order.description}
                  </div>
                  <div>{order.carpenter || 'Não atribuído'}</div>
                  <div>{formatDate(order.exitDate)}</div>
                  <div>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusColumns.map(option => (
                          <SelectItem key={option.key} value={option.key}>
                            {option.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowMaterialsModal(true)
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Materiais
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddOrderModal
        isOpen={showAddOrderModal}
        onClose={() => setShowAddOrderModal(false)}
        onAddOrder={handleAddOrder}
        carpenters={carpenters}
      />

      <ManageCarpenterModal
        isOpen={showManageCarpenterModal}
        onClose={() => setShowManageCarpenterModal(false)}
        carpenters={carpenters}
        onAddCarpenter={handleAddCarpenter}
        onRemoveCarpenter={handleRemoveCarpenter}
        orders={orders}
      />

      <MaterialsModal
        isOpen={showMaterialsModal}
        onClose={() => setShowMaterialsModal(false)}
        order={selectedOrder}
        onUpdateOrder={handleUpdateOrder}
      />
    </div>
  )
}

// Modal para adicionar ordem
function AddOrderModal({ isOpen, onClose, onAddOrder, carpenters }) {
  const [formData, setFormData] = useState({
    id: '',
    description: '',
    entryDate: '',
    exitDate: '',
    carpenter: 'none',
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
            {/* 1. O defaultValue foi mantido como "none". Ele define qual item 
       será selecionado inicialmente.
  */}
            <Select defaultValue="none" onValueChange={(value) => setFormData(prev => ({ ...prev, carpenter: value === "none" ? null : value }))}>
              <SelectTrigger>
                {/* O placeholder é exibido quando nenhum valor está selecionado */}
                <SelectValue placeholder="(Nenhum)" />
              </SelectTrigger>
              <SelectContent>
                {/* 2. O valor do SelectItem foi alterado de "" para "none".
           Agora ele é um valor válido.
      */}
                <SelectItem value="none">(Nenhum)</SelectItem>
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

// Modal para gerenciar marceneiros
function ManageCarpenterModal({ isOpen, onClose, carpenters, onAddCarpenter, onRemoveCarpenter, orders }) {
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

// Modal para gerenciar materiais
function MaterialsModal({ isOpen, onClose, order, onUpdateOrder }) {
  const [editingOrder, setEditingOrder] = useState(null)
  const [newMaterial, setNewMaterial] = useState({ description: '', quantity: 1 })

  useEffect(() => {
    if (order) {
      setEditingOrder({ ...order })
    }
  }, [order])

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
    onClose()
    setEditingOrder(null)
  }

  if (!editingOrder) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Materiais da Ordem #{editingOrder.id}</DialogTitle>
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
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={saveMaterials} className="bg-blue-500 hover:bg-blue-600">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default App

