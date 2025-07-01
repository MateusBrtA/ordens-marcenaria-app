import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import LoginPage from './components/LoginPage.jsx';
import BackendConfig from './components/BackendConfig.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Plus, Users, FileSpreadsheet, LayoutGrid, List, Trash2, X, LogOut, User, Edit, RefreshCw } from 'lucide-react';
import { exportToExcel } from './utils/excelExport.js';
import { ordersAPI, carpentersAPI } from './services/api.js';
import './App.css';

// Importar os modais
//import AddOrderModal from './components/ui/AddOrderModal.jsx';
//import ManageCarpenterModal from './components/ui/ManageCarpenterModal.jsx';
//import EditOrderModal from './components/ui/edit-order-modal.jsx';

function MainApp() {
  const { user, logout, canEdit, canAdmin } = useAuth();
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

  // Estados para os novos modais de alerta/confirmação
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Estados para o modal de edição de ordem
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);

  const statusColumns = [
    { key: 'atrasada', title: 'Atrasada', color: 'bg-red-500' },
    { key: 'paraHoje', title: 'Para Hoje', color: 'bg-orange-400' },
    { key: 'emProcesso', title: 'Em Processo', color: 'bg-yellow-400' },
    { key: 'recebida', title: 'Recebida', color: 'bg-blue-400' },
    { key: 'concluida', title: 'Concluída', color: 'bg-gray-500' }
  ];

  // Funções para exibir modais personalizados
  const showCustomAlert = useCallback((title, message) => {
    setDialog({ isOpen: true, title, message, type: 'alert', onConfirm: () => {}, onCancel: () => {} });
  }, []);

  const showCustomConfirm = useCallback((title, message, onConfirmCallback, onCancelCallback) => {
    setDialog({ isOpen: true, title, message, type: 'confirm', onConfirm: onConfirmCallback, onCancel: onCancelCallback });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Carregar dados iniciais - CORRIGIDO para sempre buscar do servidor
  const loadData = useCallback(async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true);
      }
      setError('');

      console.log('🔄 Iniciando carregamento de dados...');

      // Buscar ordens e marceneiros em paralelo
      const [ordersResponse, carpentersResponse] = await Promise.all([
        ordersAPI.getAll(),
        carpentersAPI.getAll()
      ]);

      console.log('📦 Resposta de ordens:', ordersResponse.data);
      console.log('👷 Resposta de marceneiros:', carpentersResponse.data);

      // Processar ordens
      const ordersData = ordersResponse.data.orders || ordersResponse.data || [];
      setOrders(ordersData);

      // Processar marceneiros - manter dados completos e extrair nomes
      const carpentersData = carpentersResponse.data.carpenters || carpentersResponse.data || [];
      setCarpentersWithStats(carpentersData); // Dados completos com estatísticas
      
      // Extrair apenas os nomes para o dropdown
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

  // Carregar dados na inicialização e configurar recarregamento automático
  useEffect(() => {
    loadData();
    
    // Recarregar dados a cada 30 segundos para manter sincronizado
    const interval = setInterval(() => {
      loadData(false); // Não mostrar loading indicator no recarregamento automático
    }, 30000);

    return () => clearInterval(interval);
  }, [loadData]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCarpenter = selectedCarpenter === 'Todos' || order.carpenter === selectedCarpenter;
    const matchesStatus = statusFilters[order.status];
    return matchesSearch && matchesCarpenter && matchesStatus;
  });

  const getOrdersByStatus = (status) => {
    return filteredOrders.filter(order => order.status === status);
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
      await ordersAPI.update(updatedOrder.id, updatedOrder);
      setIsEditOrderModalOpen(false);
      console.log('✅ Ordem atualizada, recarregando dados...');
      await loadData(false);
      showCustomAlert('Sucesso', 'Ordem atualizada com sucesso!');
    } catch (err) {
      const errorMessage = 'Erro ao atualizar ordem: ' + (err.response?.data?.message || err.message);
      showCustomAlert('Erro', errorMessage);
      console.error('❌ Erro ao atualizar ordem:', err);
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
          const carpenter = carpentersWithStats.find(c => c.name === name);

          if (carpenter) {
            await carpentersAPI.delete(carpenter.id);
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const OrderCard = ({ order }) => (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow mb-3">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg">{order.id}</h3>
        {canEdit() && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOrderToEdit(order);
                setIsEditOrderModalOpen(true);
              }}
              className="text-blue-500 hover:text-blue-700"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteOrder(order.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </Button>
          </div>
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
              <SelectTrigger className="h-8 text-sm w-40 inline-flex ml-2">
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
            setSelectedOrder(order);
            setShowMaterialsModal(true);
          }}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white h-8 text-sm"
        >
          Materiais
        </Button>
      </div>
    </div>
  );

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
    <div className="min-h-screen bg-gray-100 p-6 font-inter">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Ordens de Serviço</h1>

          <div className="flex items-center gap-4">
            <BackendConfig />
            <Button
              onClick={() => loadData(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Atualizar
            </Button>
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

        {/* Controles */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {canEdit() && (
            <Button
              onClick={() => setShowAddOrderModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus size={16} className="mr-2" />
              Nova Ordem
            </Button>
          )}

          <Button
            onClick={() => setShowManageCarpenterModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Users size={16} className="mr-2" />
            Marceneiros
          </Button>

          <Button
            onClick={() => exportToExcel(orders, carpentersWithStats)}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <FileSpreadsheet size={16} className="mr-2" />
            Exportar Excel
          </Button>

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
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <Input
            placeholder="Buscar por ID da ordem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />

          <Select value={selectedCarpenter} onValueChange={setSelectedCarpenter}>
            <SelectTrigger className="max-w-xs">
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
      </div>

      {/* Conteúdo Principal */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhuma ordem encontrada</p>
        </div>
      )}

      {/* Modais */}
      <AddOrderModal
        isOpen={showAddOrderModal}
        onClose={() => setShowAddOrderModal(false)}
        onAdd={handleAddOrder}
        carpenters={carpenters}
      />

      <ManageCarpenterModal
        isOpen={showManageCarpenterModal}
        onClose={() => setShowManageCarpenterModal(false)}
        carpenters={carpentersWithStats}
        onAdd={handleAddCarpenter}
        onRemove={handleRemoveCarpenter}
        canEdit={canEdit()}
      />

      {isEditOrderModalOpen && orderToEdit && (
        <EditOrderModal
          isOpen={isEditOrderModalOpen}
          onClose={() => {
            setIsEditOrderModalOpen(false);
            setOrderToEdit(null);
          }}
          order={orderToEdit}
          onUpdate={handleUpdateOrder}
          carpenters={carpenters}
        />
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

      {/* Modal de Diálogo Personalizado */}
      <Dialog open={dialog.isOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.title}</DialogTitle>
            <DialogDescription>{dialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {dialog.type === 'confirm' && (
              <Button variant="outline" onClick={dialog.onCancel}>
                Cancelar
              </Button>
            )}
            <Button onClick={dialog.type === 'confirm' ? dialog.onConfirm : closeDialog}>
              {dialog.type === 'confirm' ? 'Confirmar' : 'OK'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

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

  return user ? <MainApp /> : <LoginPage />;
}

export default App;

