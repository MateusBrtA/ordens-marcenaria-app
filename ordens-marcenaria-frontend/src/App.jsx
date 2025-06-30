import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import LoginPage from './components/LoginPage.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Plus, Users, FileSpreadsheet, LayoutGrid, List, Trash2, X, LogOut, User, Edit } from 'lucide-react';
import { exportToExcel } from './utils/excelExport.js';
import { ordersAPI, carpentersAPI } from './services/api.js';
import './App.css';

// Importar os modais
import AddOrderModal from './components/AddOrderModal.jsx';
import ManageCarpenterModal from './components/ManageCarpenterModal.jsx';
import EditOrderModal from './components/EditOrderModal.jsx'; // Importe o novo modal de edição

function MainApp() {
  const { user, logout, canEdit, canAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [carpenters, setCarpenters] = useState([]);
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
  const [selectedOrder, setSelectedOrder] = useState(null); // Usado para o modal de materiais
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para os novos modais de alerta/confirmação
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert', // 'alert' or 'confirm'
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

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Limpar erros anteriores

      console.log('🔄 Iniciando carregamento de dados...');

      const [ordersResponse, carpentersResponse] = await Promise.all([
        ordersAPI.getAll(),
        carpentersAPI.getAll()
      ]);

      console.log('📦 Resposta de ordens:', ordersResponse.data);
      console.log('👷 Resposta de marceneiros:', carpentersResponse.data);

      // Processar ordens
      const ordersData = ordersResponse.data.orders || ordersResponse.data || [];
      setOrders(ordersData);

      // Processar marceneiros - extrair apenas os nomes para o dropdown
      const carpentersData = carpentersResponse.data.carpenters || carpentersResponse.data || [];
      const carpenterNames = carpentersData.map(c => typeof c === 'string' ? c : c.name);
      setCarpenters(carpenterNames);

      console.log('✅ Dados carregados:', {
        ordens: ordersData.length,
        marceneiros: carpenterNames.length
      });

    } catch (err) {
      const errorMessage = 'Erro ao carregar dados: ' + (err.response?.data?.message || err.message);
      setError(errorMessage);
      console.error('❌ Erro no carregamento:', err);
      console.error('❌ Detalhes do erro:', err.response?.data || err.message);
      showCustomAlert('Erro de Carregamento', errorMessage); // Exibir alerta personalizado
    } finally {
      setLoading(false);
    }
  }, [showCustomAlert]); // Adicionar showCustomAlert como dependência

  useEffect(() => {
    loadData();
  }, [loadData]); // Adicionar loadData como dependência

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
      await loadData(); // Recarregar todos os dados do servidor
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
      await loadData(); // Recarregar todos os dados do servidor
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
      setIsEditOrderModalOpen(false); // Fechar o modal de edição
      console.log('✅ Ordem atualizada, recarregando dados...');
      await loadData(); // Recarregar todos os dados do servidor
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
          await loadData(); // Recarregar todos os dados do servidor
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
      await loadData(); // Recarregar todos os dados do servidor
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
          // Encontrar o ID do marceneiro
          const carpentersResponse = await carpentersAPI.getAll();
          const carpenter = carpentersResponse.data.carpenters.find(c => c.name === name);

          if (carpenter) {
            await carpentersAPI.delete(carpenter.id);
            console.log('✅ Marceneiro removido, recarregando dados...');
            await loadData(); // Recarregar todos os dados do servidor
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
    <div className="min-h-screen bg-gray-100 p-6 font-inter"> {/* Adicionado font-inter */}
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

        {/* Seção de Debug Visual */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-yellow-800 mb-2">🔍 Debug - Status dos Dados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Ordens carregadas:</strong> {orders.length} itens
              {orders.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-blue-600">Ver detalhes</summary>
                  <pre className="text-xs bg-white p-2 mt-1 rounded border max-h-32 overflow-auto">
                    {JSON.stringify(orders.slice(0, 2), null, 2)}
                  </pre>
                </details>
              )}
            </div>
            <div>
              <strong>Marceneiros carregados:</strong> {carpenters.length} itens
              {carpenters.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-blue-600">Ver detalhes</summary>
                  <pre className="text-xs bg-white p-2 mt-1 rounded border max-h-32 overflow-auto">
                    {JSON.stringify(carpenters, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-yellow-700">
            💡 Esta seção pode ser removida após confirmar que os dados estão carregando corretamente
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
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
                exportToExcel(orders, carpenters);
                showCustomAlert('Sucesso', 'Arquivo Excel exportado com sucesso!');
              } catch (error) {
                showCustomAlert('Erro', 'Erro ao exportar: ' + error.message);
                console.error('Erro na exportação:', error);
              }
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <FileSpreadsheet size={20} />
            Exportar Excel
          </Button>

          {/* Botão de Debug Temporário */}
          <Button
            onClick={() => {
              console.log('🔄 Forçando recarregamento de dados...');
              loadData();
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            🔄 Recarregar (Debug)
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
            className="w-full rounded-md"
          />
        </div>

        {/* Carpenter Filter */}
        <div className="flex-1 min-w-64">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Encarregado
          </label>
          <Select value={selectedCarpenter} onValueChange={setSelectedCarpenter}>
            <SelectTrigger className="rounded-md">
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
            className="rounded-md"
          >
            <LayoutGrid size={16} />
          </Button>
          <Button
            variant={viewMode === 'lines' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('lines')}
            className="rounded-md"
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Orders Display */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"> {/* Ajustado para 4 colunas em XL */}
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
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto"> {/* Adicionado overflow-x-auto */}
          <div className="p-4 min-w-[700px]"> {/* Largura mínima para evitar quebra em telas menores */}
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
                  <div className="text-sm">{order.carpenter || '(Nenhum)'}</div>
                  <div className="text-sm">{formatDate(order.exitDate)}</div>
                  <div className="text-sm">
                    {statusColumns.find(s => s.key === order.status)?.title || order.status}
                  </div>
                  <div className="flex gap-2">
                    {canEdit() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOrderToEdit(order);
                          setIsEditOrderModalOpen(true);
                        }}
                        className="rounded-md"
                      >
                        <Edit size={16} className="mr-1" /> Editar
                      </Button>
                    )}
                    {canEdit() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-500 hover:text-red-700 rounded-md"
                      >
                        <Trash2 size={16} className="mr-1" /> Excluir
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
      {showAddOrderModal && (
        <AddOrderModal
          isOpen={showAddOrderModal}
          onClose={() => setShowAddOrderModal(false)}
          onAddOrder={handleAddOrder}
          carpenters={carpenters} // Passar apenas os nomes dos marceneiros
        />
      )}

      {showManageCarpenterModal && (
        <ManageCarpenterModal
          isOpen={showManageCarpenterModal}
          onClose={() => setShowManageCarpenterModal(false)}
          onAddCarpenter={handleAddCarpenter}
          onRemoveCarpenter={handleRemoveCarpenter}
          carpenters={carpenters} // Passar apenas os nomes dos marceneiros
        />
      )}

      {/* Modal de Edição de Ordem */}
      {isEditOrderModalOpen && orderToEdit && (
        <EditOrderModal
          isOpen={isEditOrderModalOpen}
          onClose={() => setIsEditOrderModalOpen(false)}
          order={orderToEdit}
          onUpdateOrder={handleUpdateOrder}
          carpenters={carpenters}
        />
      )}

      {/* Modal de Materiais (inline, poderia ser um componente MaterialsModal.jsx) */}
      {showMaterialsModal && selectedOrder && (
        <Dialog open={showMaterialsModal} onOpenChange={setShowMaterialsModal}>
          <DialogContent className="sm:max-w-[425px] rounded-lg">
            <DialogHeader>
              <DialogTitle>Materiais da Ordem: {selectedOrder.id}</DialogTitle>
              <DialogDescription>
                Lista de materiais associados à ordem de serviço.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-96 overflow-y-auto">
              {selectedOrder.materials && selectedOrder.materials.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2">
                  {selectedOrder.materials.map((material, index) => (
                    <li key={index} className="text-gray-700">
                      <span className="font-medium">{material.description}</span> ({material.quantity})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center">Nenhum material cadastrado para esta ordem.</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowMaterialsModal(false)} className="rounded-md">Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Alerta/Confirmação Personalizado */}
      <Dialog open={dialog.isOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-lg">
          <DialogHeader>
            <DialogTitle>{dialog.title}</DialogTitle>
            <DialogDescription>{dialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            {dialog.type === 'confirm' && (
              <Button variant="outline" onClick={dialog.onCancel} className="rounded-md">
                Cancelar
              </Button>
            )}
            <Button onClick={dialog.onConfirm || closeDialog} className="rounded-md">
              {dialog.type === 'confirm' ? 'Confirmar' : 'Ok'}
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
      <MainApp />
    </AuthProvider>
  );
}

export default App;
