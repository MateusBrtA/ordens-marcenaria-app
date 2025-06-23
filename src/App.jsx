import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx'
import { Plus, Users, FileSpreadsheet, LayoutGrid, List, Trash2, X, LogOut } from 'lucide-react'
import { exportToExcel } from './utils/excelExport.js'
import './App.css'

import { useAuth } from './contexts/AuthContext'
import { usePermissions } from './hooks/usePermissions'
import { useOrdens } from './hooks/useOrdens'
import { useMarceneiros } from './hooks/useMarceneiros'
import { useMateriais } from './hooks/useMateriais'

import AddOrderModal from './components/ordens/AddOrderModal'
import ManageCarpenterModal from './components/marceneiros/ManageCarpenterModal'
import ManageMaterialsModal from './components/materiais/ManageMaterialsModal'
import OrderMaterialsModal from './components/ordens/OrderMaterialsModal'
import HistoricoModal from './components/historico/HistoricoModal'

function App() {
  const { user, logout } = useAuth()
  const { 
    isAdmin, 
    isMarceneiro, 
    isVisitante, 
    canManageOrders, 
    canEditOrders, 
    canDeleteOrders, 
    canManageMaterials, 
    canManageMarceneiros, 
    canViewHistory 
  } = usePermissions()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCarpenterFilter, setSelectedCarpenterFilter] = useState("Todos")
  const [statusFilters, setStatusFilters] = useState({
    Pendente: true,
    "Em Andamento": true,
    Concluída: true,
    Atrasada: true, // Adicionado para o backend
    "Para Hoje": true // Adicionado para o backend
  })
  const [viewMode, setViewMode] = useState("cards")

  const [showAddOrderModal, setShowAddOrderModal] = useState(false)
  const [showManageCarpenterModal, setShowManageCarpenterModal] = useState(false)
  const [showManageMaterialsModal, setShowManageMaterialsModal] = useState(false)
  const [showOrderMaterialsModal, setShowOrderMaterialsModal] = useState(false)
  const [showHistoricoModal, setShowHistoricoModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Hooks de dados
  const { ordens, loading: loadingOrdens, error: errorOrdens, refetch: refetchOrdens, createOrdem, updateOrdem, deleteOrdem } = useOrdens({
    status: Object.keys(statusFilters).filter(key => statusFilters[key]).join(","),
    marceneiro_id: selectedCarpenterFilter !== "Todos" ? selectedCarpenterFilter : undefined,
    numero_ordem: searchTerm || undefined
  })
  const { marceneiros, loading: loadingMarceneiros, error: errorMarceneiros, refetch: refetchMarceneiros } = useMarceneiros()
  const { materiais, loading: loadingMateriais, error: errorMateriais, refetch: refetchMateriais } = useMateriais()

  const statusColumns = [
    { key: 'Atrasada', title: 'Atrasada', color: 'bg-red-500' },
    { key: 'Para Hoje', title: 'Para Hoje', color: 'bg-orange-400' },
    { key: 'Em Andamento', title: 'Em Processo', color: 'bg-yellow-400' },
    { key: 'Pendente', title: 'Pendente', color: 'bg-blue-400' },
    { key: 'Concluída', title: 'Concluída', color: 'bg-gray-500' }
  ]

  // Função para atualizar status automaticamente baseado na data (mantida para compatibilidade visual, mas o backend já faz isso)
  const updateOrderStatusFrontend = (order) => {
    if (order.status === 'Concluída') return order.status

    const today = new Date()
    const exitDate = new Date(order.data_entrega)

    today.setHours(0, 0, 0, 0)
    exitDate.setHours(0, 0, 0, 0)

    if (exitDate < today) {
      return 'Atrasada'
    } else if (exitDate.getTime() === today.getTime()) {
      return 'Para Hoje'
    }

    return order.status
  }

  // Ajustar ordens para exibição no frontend (mapear para o formato antigo se necessário)
  const mappedOrders = ordens.map(order => ({
    ...order,
    id: order.numero_ordem, // Usar numero_ordem como ID para compatibilidade com o frontend antigo
    description: order.descricao,
    entryDate: order.data_criacao ? new Date(order.data_criacao).toISOString().split('T')[0] : '',
    exitDate: order.data_entrega ? new Date(order.data_entrega).toISOString().split('T')[0] : '',
    carpenter: order.marceneiro ? order.marceneiro.nome : 'Não atribuído',
    status: updateOrderStatusFrontend(order), // Atualiza status para exibição no frontend
    materials: order.materiais // Já vem do backend
  }))

  const filteredOrders = mappedOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCarpenter = selectedCarpenterFilter === 'Todos' || order.marceneiro_id === parseInt(selectedCarpenterFilter)
    const matchesStatus = statusFilters[order.status]
    return matchesSearch && matchesCarpenter && matchesStatus
  })

  const getOrdersByStatus = (status) => {
    return filteredOrders.filter(order => order.status === status)
  }

  const handleAddOrder = async (newOrder) => {
    const result = await createOrdem({
      numero_ordem: newOrder.id,
      cliente: newOrder.cliente || 'N/A',
      descricao: newOrder.description,
      data_entrega: newOrder.exitDate,
      status: newOrder.status,
      marceneiro_id: newOrder.marceneiro_id,
      observacoes: newOrder.observacoes,
      materiais: newOrder.materials // Passar materiais para o backend
    })
    if (result.success) {
      setShowAddOrderModal(false)
      refetchOrdens()
    } else {
      alert(result.message)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const orderToUpdate = ordens.find(o => o.numero_ordem === orderId)
    if (orderToUpdate) {
      const result = await updateOrdem(orderToUpdate.id, { status: newStatus })
      if (result.success) {
        refetchOrdens()
      } else {
        alert(result.message)
      }
    }
  }

  const handleUpdateOrder = async (updatedOrder) => {
    const orderToUpdate = ordens.find(o => o.numero_ordem === updatedOrder.id)
    if (orderToUpdate) {
      const result = await updateOrdem(orderToUpdate.id, {
        cliente: updatedOrder.cliente,
        descricao: updatedOrder.description,
        data_entrega: updatedOrder.exitDate,
        status: updatedOrder.status,
        marceneiro_id: updatedOrder.marceneiro_id,
        observacoes: updatedOrder.observacoes
      })
      if (result.success) {
        refetchOrdens()
      } else {
        alert(result.message)
      }
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (confirm('Tem certeza que deseja excluir esta ordem?')) {
      const orderToDelete = ordens.find(o => o.numero_ordem === orderId)
      if (orderToDelete) {
        const result = await deleteOrdem(orderToDelete.id)
        if (result.success) {
          refetchOrdens()
        } else {
          alert(result.message)
        }
      }
    }
  }

  const handleUpdateCarpenterInOrder = async (orderId, newCarpenterId) => {
    const orderToUpdate = ordens.find(o => o.numero_ordem === orderId)
    if (orderToUpdate) {
      const result = await updateOrdem(orderToUpdate.id, { marceneiro_id: newCarpenterId })
      if (result.success) {
        refetchOrdens()
      } else {
        alert(result.message)
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
        {canDeleteOrders && (
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
          <Select
            value={order.marceneiro_id || "none"}
            onValueChange={(value) => handleUpdateCarpenterInOrder(order.id, value === "none" ? null : parseInt(value))}
            disabled={!canEditOrders} // Desabilita se não tiver permissão
          >
            <SelectTrigger className="h-8 text-sm w-40 inline-flex">
              <SelectValue placeholder="(Nenhum)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">(Nenhum)</SelectItem>
              {marceneiros.map(carpenter => (
                <SelectItem key={carpenter.id} value={carpenter.id.toString()}>{carpenter.nome}</SelectItem>
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
          <strong>Materiais:</strong> {order.materiais?.length || 0} itens
        </div>
      </div>

      <div className="space-y-2">
        <Select
          value={order.status}
          onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
          disabled={!canEditOrders} // Desabilita se não tiver permissão
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
            setShowOrderMaterialsModal(true)
          }}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white h-8 text-sm"
        >
          Materiais
        </Button>
      </div>
    </div>
  )

  if (loadingOrdens || loadingMarceneiros || loadingMateriais) {
    return <div className="flex justify-center items-center min-h-screen">Carregando dados...</div>
  }

  if (errorOrdens || errorMarceneiros || errorMateriais) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Erro ao carregar dados: {errorOrdens || errorMarceneiros || errorMateriais}</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Ordens de Serviço</h1>
        <p className="text-gray-600 mb-4">Bem-vindo, {user?.username} ({user?.tipo_acesso})!</p>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          {canManageOrders && (
            <Button
              onClick={() => setShowAddOrderModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={20} />
              Adicionar Ordem
            </Button>
          )}
          
          {canManageMarceneiros && (
            <Button
              onClick={() => setShowManageCarpenterModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <Users size={20} />
              Gerenciar Marceneiros
            </Button>
          )}

          {canManageMaterials && (
            <Button
              onClick={() => setShowManageMaterialsModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <FileSpreadsheet size={20} />
              Gerenciar Materiais
            </Button>
          )}

          {canViewHistory && (
            <Button
              onClick={() => setShowHistoricoModal(true)}
              className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <List size={20} />
              Histórico
            </Button>
          )}

          <Button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <LogOut size={20} />
            Sair
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
          <Select value={selectedCarpenterFilter} onValueChange={setSelectedCarpenterFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              {marceneiros.map(carpenter => (
                <SelectItem key={carpenter.id} value={carpenter.id.toString()}>{carpenter.nome}</SelectItem>
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
                      disabled={!canEditOrders}
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
                        setShowOrderMaterialsModal(true)
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Materiais
                    </Button>
                    {canDeleteOrders && (
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
      <AddOrderModal
        isOpen={showAddOrderModal}
        onClose={() => setShowAddOrderModal(false)}
        onAddOrder={handleAddOrder}
        marceneiros={marceneiros}
        materiais={materiais}
      />

      <ManageCarpenterModal
        isOpen={showManageCarpenterModal}
        onClose={() => setShowManageCarpenterModal(false)}
        marceneiros={marceneiros}
        refetchMarceneiros={refetchMarceneiros}
      />

      <ManageMaterialsModal
        isOpen={showManageMaterialsModal}
        onClose={() => setShowManageMaterialsModal(false)}
        materiais={materiais}
        refetchMateriais={refetchMateriais}
      />

      <OrderMaterialsModal
        isOpen={showOrderMaterialsModal}
        onClose={() => setShowOrderMaterialsModal(false)}
        order={selectedOrder}
        materiais={materiais}
        refetchOrdens={refetchOrdens}
      />

      <HistoricoModal
        isOpen={showHistoricoModal}
        onClose={() => setShowHistoricoModal(false)}
      />
    </div>
  )
}

export default App


