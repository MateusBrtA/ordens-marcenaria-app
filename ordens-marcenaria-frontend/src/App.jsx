import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import LoginPage from './components/LoginPage.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx'
import { Plus, Users, FileSpreadsheet, LayoutGrid, List, Trash2, X, LogOut, User } from 'lucide-react'
import { exportToExcel } from './utils/excelExport.js'
import { ordersAPI, carpentersAPI } from './services/api.js'
import './App.css'

function MainApp() {
  const { user, logout, canEdit, canAdmin } = useAuth()
  const [orders, setOrders] = useState([])
  const [carpenters, setCarpenters] = useState([])
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const statusColumns = [
    { key: 'atrasada', title: 'Atrasada', color: 'bg-red-500' },
    { key: 'paraHoje', title: 'Para Hoje', color: 'bg-orange-400' },
    { key: 'emProcesso', title: 'Em Processo', color: 'bg-yellow-400' },
    { key: 'recebida', title: 'Recebida', color: 'bg-blue-400' },
    { key: 'concluida', title: 'Concluída', color: 'bg-gray-500' }
  ]

  // Carregar dados iniciais
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [ordersResponse, carpentersResponse] = await Promise.all([
        ordersAPI.getAll(),
        carpentersAPI.getNames()
      ])
      
      setOrders(ordersResponse.data.orders || [])
      setCarpenters(carpentersResponse.data.carpenters || [])
    } catch (err) {
      setError('Erro ao carregar dados: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCarpenter = selectedCarpenter === 'Todos' || order.carpenter === selectedCarpenter
    const matchesStatus = statusFilters[order.status]
    return matchesSearch && matchesCarpenter && matchesStatus
  })

  const getOrdersByStatus = (status) => {
    return filteredOrders.filter(order => order.status === status)
  }

  const handleAddOrder = async (newOrder) => {
    try {
      const response = await ordersAPI.create(newOrder)
      setOrders(prev => [...prev, response.data.order])
      setShowAddOrderModal(false)
      loadData()
    } catch (err) {
      alert('Erro ao criar ordem: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await ordersAPI.update(orderId, { status: newStatus })
      setOrders(prev => prev.map(order =>
        order.id === orderId ? response.data.order : order
      ))
      loadData()
    } catch (err) {
      alert('Erro ao atualizar status: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleUpdateOrder = async (updatedOrder) => {
    try {
      const response = await ordersAPI.update(updatedOrder.id, updatedOrder)
      setOrders(prev => prev.map(order =>
        order.id === updatedOrder.id ? response.data.order : order
      ))
      loadData()
    } catch (err) {
      alert('Erro ao atualizar ordem: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (confirm('Tem certeza que deseja excluir esta ordem?')) {
      try {
        await ordersAPI.delete(orderId)
        setOrders(prev => prev.filter(order => order.id !== orderId))
        loadData()
      } catch (err) {
        alert('Erro ao excluir ordem: ' + (err.response?.data?.message || err.message))
      }
    }
  }

  const handleAddCarpenter = async (name) => {
    try {
      await carpentersAPI.create({ name })
      const response = await carpentersAPI.getNames()
      setCarpenters(response.data.carpenters || [])
      loadData()
    } catch (err) {
      alert('Erro ao adicionar marceneiro: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleRemoveCarpenter = async (name) => {
    if (confirm(`Tem certeza que deseja remover o marceneiro "${name}"?`)) {
      try {
        // Encontrar o ID do marceneiro
        const carpentersResponse = await carpentersAPI.getAll()
        const carpenter = carpentersResponse.data.carpenters.find(c => c.name === name)
        
        if (carpenter) {
          await carpentersAPI.delete(carpenter.id)
          const response = await carpentersAPI.getNames()
          setCarpenters(response.data.carpenters || [])
          
          // Recarregar ordens para atualizar marceneiros removidos
          loadData()
        }
      } catch (err) {
        alert('Erro ao remover marceneiro: ' + (err.response?.data?.message || err.message))
      }
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
        {canEdit() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteOrder(order.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      <p className="text-gray-700 text-sm mb-3">{order.description}</p>

      <div className="space-y-2 mb-3 text-sm">
        <div>
          <strong>Encarregado:</strong>
          {canEdit() ? (
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
          ) : (
            <span className="ml-2">{order.carpenter || '(Nenhum)'}</span>
          )}
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
        {canEdit() ? (
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
        ) : (
          <div className="text-sm font-medium">
            Status: {statusColumns.find(s => s.key === order.status)?.title || order.status}
          </div>
        )}

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Ordens de Serviço</h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={16} />
              <span>{user.username} ({user.role})</span>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          {canEdit() && (
            <Button
              onClick={() => setShowAddOrderModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={20} />
              Adicionar Ordem
            </Button>
          )}
          
          {canEdit() && (
            <Button
              onClick={() => setShowManageCarpenterModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <Users size={20} />
              Gerenciar Marceneiros
            </Button>
          )}
          
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
                    {canEdit() ? (
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
                    ) : (
                      <span className="text-sm">
                        {statusColumns.find(s => s.key === order.status)?.title || order.status}
                      </span>
                    )}
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
                    {canEdit() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {canEdit() && (
        <>
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
          />
        </>
      )}

      <MaterialsModal
        isOpen={showMaterialsModal}
        onClose={() => setShowMaterialsModal(false)}
        order={selectedOrder}
        onUpdateOrder={handleUpdateOrder}
        canEdit={canEdit()}
      />
    </div>
  )
}

// Componente AddOrderModal corrigido
function AddOrderModal({ isOpen, onClose, onAddOrder, carpenters }) {
  const [formData, setFormData] = useState({
    id: '',
    description: '',
    entryDate: new Date().toISOString().split('T')[0],
    exitDate: '',
    carpenter: 'none', // Valor padrão não vazio
    materials: []
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Converter 'none' para null antes de enviar
    const orderData = {
      ...formData,
      carpenter: formData.carpenter === 'none' ? null : formData.carpenter
    }
    
    onAddOrder(orderData)
    setFormData({
      id: '',
      description: '',
      entryDate: new Date().toISOString().split('T')[0],
      exitDate: '',
      carpenter: 'none',
      materials: []
    })
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Ordem</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID da Ordem</label>
            <Input
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
              placeholder="Ex: OS-123"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do serviço"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data de Entrada</label>
            <Input
              type="date"
              value={formData.entryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, entryDate: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estimativa de Saída</label>
            <Input
              type="date"
              value={formData.exitDate}
              onChange={(e) => setFormData(prev => ({ ...prev, exitDate: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Marceneiro</label>
            <Select
              value={formData.carpenter}
              onValueChange={(value) => setFormData(prev => ({ ...prev, carpenter: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um marceneiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">(Nenhum)</SelectItem>
                {carpenters.map(carpenter => (
                  <SelectItem key={carpenter} value={carpenter}>{carpenter}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Ordem
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ManageCarpenterModal({ isOpen, onClose, carpenters, onAddCarpenter, onRemoveCarpenter }) {
  const [newCarpenterName, setNewCarpenterName] = useState('')

  const handleAdd = () => {
    if (newCarpenterName.trim()) {
      onAddCarpenter(newCarpenterName.trim())
      setNewCarpenterName('')
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Marceneiros</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCarpenterName}
              onChange={(e) => setNewCarpenterName(e.target.value)}
              placeholder="Nome do marceneiro"
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd}>Adicionar</Button>
          </div>
          <div className="space-y-2">
            {carpenters.map(carpenter => (
              <div key={carpenter} className="flex justify-between items-center p-2 border rounded">
                <span>{carpenter}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveCarpenter(carpenter)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MaterialsModal({ isOpen, onClose, order, onUpdateOrder, canEdit }) {
  const [materials, setMaterials] = useState([])
  const [newMaterial, setNewMaterial] = useState({ description: '', quantity: 1 })

  useEffect(() => {
    if (order) {
      setMaterials(order.materials || [])
    }
  }, [order])

  const handleAddMaterial = () => {
    if (newMaterial.description.trim()) {
      const updatedMaterials = [...materials, { ...newMaterial, id: Date.now() }]
      setMaterials(updatedMaterials)
      onUpdateOrder({ ...order, materials: updatedMaterials })
      setNewMaterial({ description: '', quantity: 1 })
    }
  }

  const handleRemoveMaterial = (materialId) => {
    const updatedMaterials = materials.filter(m => m.id !== materialId)
    setMaterials(updatedMaterials)
    onUpdateOrder({ ...order, materials: updatedMaterials })
  }

  if (!isOpen || !order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Materiais - {order.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {canEdit && (
            <div className="flex gap-2">
              <Input
                value={newMaterial.description}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do material"
              />
              <Input
                type="number"
                value={newMaterial.quantity}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="w-20"
                min="1"
              />
              <Button onClick={handleAddMaterial}>Adicionar</Button>
            </div>
          )}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {materials.map(material => (
              <div key={material.id} className="flex justify-between items-center p-2 border rounded">
                <span>{material.description} (Qtd: {material.quantity})</span>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMaterial(material.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>
            ))}
            {materials.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum material cadastrado</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const { user, login, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={login} />
  }

  return <MainApp />
}

export default App

