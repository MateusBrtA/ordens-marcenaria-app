import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Dialog } from '@/components/ui/dialog.jsx';
import { Plus, Users, FileSpreadsheet, LayoutGrid, List, Trash2, X, Edit, Eye } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport.js';
import { ordersAPI, carpentersAPI } from '../services/api.js';

// Importar os modais
import { AddOrderModal } from './AddOrderModal.jsx';
import { ManageCarpenterModal } from './ManageCarpenterModal.jsx';
import { OrderCard } from './OrderCard.jsx';
import { ViewEditOrderModal } from './ViewEditOrderModal.jsx';
import { CardSizeSlider } from './CardSizeSlider';
import { AdvancedFilters } from './AdvancedFilters';
import { applyAdvancedFilters, clearAllFilters } from '../utils/filterUtils';
import { OrderListView } from './OrderListView.jsx';

function OrderPage({ canEdit, showCustomAlert, showCustomConfirm, closeDialog, formatDate }) {
  const [orders, setOrders] = useState([]);
  const [carpenters, setCarpentersList] = useState([]);
  const [carpentersWithStats, setCarpentersWithStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCarpenter, setSelectedCarpenter] = useState('Todos');
  const [statusFilters, setStatusFilters] = useState({
    atrasada: true,
    paraHoje: true,
    emProcesso: true,
    recebida: true,
    concluida: true
  });
  const [viewMode, setViewMode] = useState('cards');
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [showManageCarpenterModal, setShowManageCarpenterModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showViewEditOrderModal, setShowViewEditOrderModal] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [cardGridClass, setCardGridClass] = useState('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4');
  const [advancedFilters, setAdvancedFilters] = useState(clearAllFilters());

  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);

  const statusColumns = [
    { key: 'atrasada', title: 'Atrasada', color: 'bg-red-500' },
    { key: 'paraHoje', title: 'Para Hoje', color: 'bg-orange-400' },
    { key: 'emProcesso', title: 'Em Processo', color: 'bg-yellow-400' },
    { key: 'recebida', title: 'Recebida', color: 'bg-blue-400' },
    { key: 'concluida', title: 'Concluída', color: 'bg-gray-500' }
  ];

  const handleCardSizeChange = useCallback((newGridClass) => {
    setCardGridClass(newGridClass);
  }, []);

  const loadData = useCallback(async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true);
      }
      setError('');

      console.log('🔄 Iniciando carregamento de dados...');

      const [ordersResponse, carpentersResponse] = await Promise.all([
        ordersAPI.getAll(),
        carpentersAPI.getAll()
      ]);

      console.log('📦 Resposta de ordens:', ordersResponse.data);
      console.log('👷 Resposta de marceneiros:', carpentersResponse.data);

      const ordersData = ordersResponse.data.orders || ordersResponse.data || [];
      setOrders(ordersData);

      const carpentersData = carpentersResponse.data.carpenters || carpentersResponse.data || [];
      setCarpentersWithStats(carpentersData);

      const carpenterNames = carpentersData.map(c => typeof c === 'string' ? c : c.name);
      setCarpentersList(carpenterNames);

      console.log('✅ Dados carregados:', {
        ordens: ordersData.length,
        marceneiros: carpenterNames.length,
        marceneirosComStats: carpentersData.length
      });

    } catch (err) {
      const errorMessage = 'Erro ao carregar dados: ' + (err.response?.data?.message || err.message);
      setError(errorMessage);
      console.error('❌ Erro no carregamento:', err);
      showCustomAlert('Erro de Carregamento', errorMessage);
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  }, [showCustomAlert]);

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (orders.length >= 0 && carpenters.length > 0) {
      const updatedCarpentersWithStats = carpenters.map((carpenterName, index) => {
        const carpenterOrders = orders.filter(order => order.carpenter === carpenterName);
        const total = carpenterOrders.length;
        const completed = carpenterOrders.filter(order => order.status === 'concluida').length;
        const inProgress = total - completed;

        const statusCounts = {
          atrasada: carpenterOrders.filter(o => o.status === 'atrasada').length,
          paraHoje: carpenterOrders.filter(o => o.status === 'paraHoje').length,
          emProcesso: carpenterOrders.filter(o => o.status === 'emProcesso').length,
          recebida: carpenterOrders.filter(o => o.status === 'recebida').length,
          concluida: completed
        };

        return {
          id: index + 1,
          name: carpenterName,
          stats: { total, completed, inProgress, statusCounts }
        };
      });

      setCarpentersWithStats(updatedCarpentersWithStats);
    }
  }, [orders, carpenters]);

  const filteredAndSortedOrders = applyAdvancedFilters(orders, advancedFilters).filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCarpenter = selectedCarpenter === 'Todos' || order.carpenter === selectedCarpenter;
    const matchesStatus = statusFilters[order.status];
    return matchesSearch && matchesCarpenter && matchesStatus;
  });

  const getOrdersByStatus = (status) => {
    return filteredAndSortedOrders.filter(order => order.status === status);
  };

  const handleAddOrder = async (newOrder) => {
    try {
      console.log('➕ Criando nova ordem:', newOrder);
      await ordersAPI.create(newOrder);
      setShowAddOrderModal(false);
      console.log('✅ Ordem criada, recarregando dados...');
      await loadData(false);
      showCustomAlert('Sucesso', 'Ordem criada com sucesso!');
    } catch (err) {
      const errorMessage = 'Erro ao criar ordem: ' + (err.response?.data?.message || err.message);
      showCustomAlert('Erro', errorMessage);
      console.error('❌ Erro ao criar ordem:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log('🔄 Atualizando status da ordem:', orderId, 'para:', newStatus);
      await ordersAPI.update(orderId, { status: newStatus });
      console.log('✅ Status atualizado, recarregando dados...');
      await loadData(false);
      showCustomAlert('Sucesso', 'Status da ordem atualizado!');
    } catch (err) {
      const errorMessage = 'Erro ao atualizar status: ' + (err.response?.data?.message || err.message);
      showCustomAlert('Erro', errorMessage);
      console.error('❌ Erro ao atualizar status:', err);
    }
  };

  const handleUpdateOrder = async (updatedOrder) => {
    try {
      console.log('🔄 Atualizando ordem:', updatedOrder.id);

      const originalId = selectedOrderForView?.id || updatedOrder.id;
      if (!originalId) {
        showCustomAlert('Erro', 'ID da ordem não encontrado');
        return;
      }

      const { id, ...orderDataWithoutId } = updatedOrder;

      const formattedData = {
        ...orderDataWithoutId,
        entryDate: orderDataWithoutId.entryDate || '',
        exitDate: orderDataWithoutId.exitDate || '',
        materials: orderDataWithoutId.materials || [],
        description: orderDataWithoutId.description || '',
        status: orderDataWithoutId.status || 'recebida',
        carpenter: orderDataWithoutId.carpenter || null
      };

      console.log('📤 Dados formatados para envio:', formattedData);

      const response = await ordersAPI.update(originalId, formattedData);

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === originalId
            ? { ...order, ...updatedOrder }
            : order
        )
      );

      if (selectedOrderForView) {
        setIsEditMode(false);

        const updatedOrderForView = { ...selectedOrderForView, ...updatedOrder };
        setSelectedOrderForView(updatedOrderForView);
      }

      console.log('✅ Ordem atualizada localmente e no backend');
      showCustomAlert('Sucesso', 'Ordem atualizada com sucesso!');

    } catch (err) {
      const errorMessage = 'Erro ao atualizar ordem: ' + (err.response?.data?.message || err.message);
      showCustomAlert('Erro', errorMessage);
      console.error('❌ Erro ao atualizar ordem:', err);
      console.error('📤 Dados que causaram erro:', updatedOrder);
    }
  };

  const handleUpdateOrderCarpenter = async (order, newCarpenter) => {
    try {
      console.log('🔄 Atualizando marceneiro da ordem:', order.id, 'para:', newCarpenter);
      await ordersAPI.update(order.id, { carpenter: newCarpenter });
      console.log('✅ Marceneiro atualizado, recarregando dados...');
      await loadData(false);
      showCustomAlert('Sucesso', 'Marceneiro atualizado com sucesso!');
    } catch (err) {
      const errorMessage = 'Erro ao atualizar marceneiro: ' + (err.response?.data?.message || err.message);
      showCustomAlert('Erro', errorMessage);
      console.error('❌ Erro ao atualizar marceneiro:', err);
    }
  };

  const handleDeleteOrder = (orderId) => {
    showCustomConfirm(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta ordem? Esta ação não pode ser desfeita.',
      async () => {
        try {
          console.log('🗑️ Deletando ordem:', orderId);
          await ordersAPI.delete(orderId);
          console.log('✅ Ordem deletada, recarregando dados...');
          await loadData(false);
          showCustomAlert('Sucesso', 'Ordem excluída com sucesso!');
        } catch (err) {
          const errorMessage = 'Erro ao excluir ordem: ' + (err.response?.data?.message || err.message);
          showCustomAlert('Erro', errorMessage);
          console.error('❌ Erro ao deletar ordem:', err);
        } finally {
          closeDialog();
        }
      },
      () => {
        console.log('Exclusão cancelada.');
        closeDialog();
      }
    );
  };

  const handleAddCarpenter = async (name) => {
    try {
      console.log('➕ Criando novo marceneiro:', name);
      await carpentersAPI.create({ name });
      console.log('✅ Marceneiro criado, recarregando dados...');
      await loadData(false);
      showCustomAlert('Sucesso', `Marceneiro "${name}" adicionado!`);
    } catch (err) {
      const errorMessage = 'Erro ao adicionar marceneiro: ' + (err.response?.data?.message || err.message);
      showCustomAlert('Erro', errorMessage);
      console.error('❌ Erro ao criar marceneiro:', err);
    }
  };

  const handleRemoveCarpenter = (name) => {
    showCustomConfirm(
      'Confirmar Remoção',
      `Tem certeza que deseja remover o marceneiro "${name}"?`,
      async () => {
        try {
          console.log('🗑️ Removendo marceneiro:', name);

          const carpenter = carpentersWithStats.find(c =>
            (typeof c === 'string' ? c : c.name) === name
          );

          if (carpenter) {
            const carpenterId = typeof carpenter === 'string' ? carpenter : carpenter.id;
            await carpentersAPI.delete(carpenterId);
            console.log('✅ Marceneiro removido, recarregando dados...');
            await loadData(false);
            showCustomAlert('Sucesso', `Marceneiro "${name}" removido!`);
          } else {
            showCustomAlert('Erro', `Marceneiro "${name}" não encontrado.`);
          }
        } catch (err) {
          const errorMessage = 'Erro ao remover marceneiro: ' + (err.response?.data?.message || err.message);
          showCustomAlert('Erro', errorMessage);
          console.error('❌ Erro ao remover marceneiro:', err);
        } finally {
          closeDialog();
        }
      },
      () => {
        console.log('Remoção de marceneiro cancelada.');
        closeDialog();
      }
    );
  };

  const handleViewOrder = (order) => {
    setSelectedOrderForView(order);
    setIsEditMode(false);
    setShowViewEditOrderModal(true);
  };

  const handleEditOrder = (order) => {
    setSelectedOrderForView(order);
    setIsEditMode(true);
    setShowViewEditOrderModal(true);
  };

  const handleCloseViewEditModal = () => {
    setShowViewEditOrderModal(false);
    setSelectedOrderForView(null);
    setIsEditMode(false);
  };

  const handleToggleEditMode = () => {
    setIsEditMode(prev => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 font-inter">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 mb-6">
        {canEdit() && (
          <Button
            onClick={() => setShowAddOrderModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
          >
            <Plus size={16} className="mr-2" />
            Nova Ordem
          </Button>
        )}

        <Button
          onClick={() => setShowManageCarpenterModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"
        >
          <Users size={16} className="mr-2" />
          Marceneiros
        </Button>

        <Button
          onClick={() => exportToExcel(orders, carpentersWithStats)}
          className="bg-purple-500 hover:bg-purple-600 text-white w-full sm:w-auto"
        >
          <FileSpreadsheet size={16} className="mr-2" />
          Exportar Excel
        </Button>

        <CardSizeSlider onSizeChange={handleCardSizeChange} />

        <AdvancedFilters onFiltersChange={setAdvancedFilters} currentFilters={advancedFilters} />

        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('cards')}
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
          >
            <LayoutGrid size={16} />
          </Button>
          <Button
            onClick={() => setViewMode('columns')}
            variant={viewMode === 'columns' ? 'default' : 'outline'}
            size="sm"
          >
            <List size={16} />
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
          >
            <List size={16} />
            Lista
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 mb-6">
        <Input
          placeholder="Buscar por ID da ordem..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-xs"
        />

        <Select value={selectedCarpenter} onValueChange={setSelectedCarpenter}>
          <SelectTrigger className="w-full sm:max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Marceneiros</SelectItem>
            {carpenters.map(carpenter => (
              <SelectItem key={carpenter} value={carpenter}>{carpenter}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 flex-wrap">
          {statusColumns.map(status => (
            <div key={status.key} className="flex items-center space-x-2">
              <Checkbox
                id={status.key}
                checked={statusFilters[status.key]}
                onCheckedChange={(checked) =>
                  setStatusFilters(prev => ({ ...prev, [status.key]: checked }))
                }
              />
              <label htmlFor={status.key} className="text-sm font-medium">
                {status.title}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {statusColumns.map(status => {
          const count = getOrdersByStatus(status.key).length;
          return (
            <div key={status.key} className="bg-white rounded-lg p-4 shadow-sm">
              <div className={`w-4 h-4 ${status.color} rounded mb-2`}></div>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-gray-600">{status.title}</div>
            </div>
          );
        })}
      </div>

      {/* Conteúdo das Ordens */}
      {viewMode === 'list' ? (
        <OrderListView
          orders={filteredAndSortedOrders}
          carpenters={carpenters}
          onUpdateStatus={handleUpdateOrderStatus}
          onUpdateCarpenter={handleUpdateOrderCarpenter}
          onView={handleViewOrder}
          onEdit={handleEditOrder}
          onDelete={handleDeleteOrder}
          canEdit={canEdit()}
          formatDate={formatDate}
          statusColumns={statusColumns}
        />
      ) : viewMode === 'cards' ? (
        <div className={`grid ${cardGridClass} gap-4`}>
          {filteredAndSortedOrders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              carpenters={carpenters}
              onUpdateOrder={handleUpdateOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statusColumns.map(status => (
            <div key={status.key} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-4">
                <div className={`w-4 h-4 ${status.color} rounded mr-2`}></div>
                <h3 className="font-bold">{status.title}</h3>
                <span className="ml-auto text-sm text-gray-500">
                  {getOrdersByStatus(status.key).length}
                </span>
              </div>
              <div className="space-y-2">
                {getOrdersByStatus(status.key).map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    carpenters={carpenters}
                    onUpdateOrder={handleUpdateOrder}
                    onDeleteOrder={handleDeleteOrder}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredAndSortedOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhuma ordem encontrada</p>
        </div>
      )}

      {/* Modais */}
      <AddOrderModal
        isOpen={showAddOrderModal}
        onClose={() => setShowAddOrderModal(false)}
        onAddOrder={handleAddOrder}
        carpenters={carpenters}
      />

      <ManageCarpenterModal
        isOpen={showManageCarpenterModal}
        onClose={() => setShowManageCarpenterModal(false)}
        carpenters={carpentersWithStats}
        onAddCarpenter={handleAddCarpenter}
        onRemoveCarpenter={handleRemoveCarpenter}
        canEdit={canEdit()}
        orders={orders}
      />

      <ViewEditOrderModal
        isOpen={showViewEditOrderModal}
        onClose={handleCloseViewEditModal}
        order={selectedOrderForView}
        onUpdateOrder={handleUpdateOrder}
        carpenters={carpenters}
        isEditMode={isEditMode}
        onToggleEditMode={handleToggleEditMode}
      />

      {isEditOrderModalOpen && orderToEdit && (
        <Dialog open={isEditOrderModalOpen} onOpenChange={setIsEditOrderModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Ordem {orderToEdit?.id}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p>Funcionalidade de edição de ordem em desenvolvimento.</p>
              <p>ID da Ordem: {orderToEdit?.id}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsEditOrderModalOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Materiais */}
      {showMaterialsModal && selectedOrder && (
        <Dialog open={showMaterialsModal} onOpenChange={setShowMaterialsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Materiais - Ordem {selectedOrder.id}</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {selectedOrder.materials && selectedOrder.materials.length > 0 ? (
                <div className="space-y-2">
                  {selectedOrder.materials.map((material, index) => (
                    <div key={material.id || index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{material.description}</span>
                      <span className="text-sm text-gray-600">Qtd: {material.quantity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum material cadastrado</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowMaterialsModal(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default OrderPage;


