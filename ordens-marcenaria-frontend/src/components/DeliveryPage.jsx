import { useState, useEffect, useCallback } from 'react';
import { deliveriesAPI, ordersAPI } from '../services/api.js';
import { exportDeliveriesToExcel } from '../utils/excelExport.js';
import { AddDeliveryModal } from './AddDeliveryModal.jsx';
import { ViewEditDeliveryModal } from './ViewEditDeliveryModal.jsx';
import { DeliveryCard } from './DeliveryCard.jsx';
import { DeliveryListView } from './DeliveryListView.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Plus, FileSpreadsheet, LayoutGrid, List } from 'lucide-react';
import { CardSizeSlider } from './CardSizeSlider';
import { AdvancedFilters } from './AdvancedFilters';
import { applyAdvancedFilters, clearAllFilters } from '../utils/filterUtils';
import { WhatsAppMessageGenerator } from './WhatsAppMessageGenerator.jsx';

function DeliveryPage({ canEdit, showCustomAlert, showCustomConfirm, closeDialog, formatDate, dialog }) {
    const [deliveries, setDeliveries] = useState([]);
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilters, setStatusFilters] = useState({
        pendente: true,
        em_rota: true,
        entregue: true,
        cancelada: true
    });
    const [deliveryViewMode, setDeliveryViewMode] = useState('cards');
    const [showAddDeliveryModal, setShowAddDeliveryModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showViewEditDeliveryModal, setShowViewEditDeliveryModal] = useState(false);
    const [selectedDeliveryForView, setSelectedDeliveryForView] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const [cardGridClass, setCardGridClass] = useState('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4');
    const [advancedFilters, setAdvancedFilters] = useState(clearAllFilters());

    const statusColumns = [
        { key: 'pendente', title: 'Pendente', color: 'bg-yellow-500' },
        { key: 'em_rota', title: 'Em Rota', color: 'bg-blue-500' },
        { key: 'entregue', title: 'Entregue', color: 'bg-green-500' },
        { key: 'cancelada', title: 'Cancelada', color: 'bg-red-500' }
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

            console.log('🔄 Iniciando carregamento de entregas...');

            const [deliveriesResponse, ordersResponse] = await Promise.all([
                deliveriesAPI.getAll(),
                ordersAPI.getAll()
            ]);

            console.log('📦 Resposta de entregas:', deliveriesResponse.data);
            console.log('📦 Resposta de ordens:', ordersResponse.data);

            const deliveriesData = deliveriesResponse.data.deliveries || deliveriesResponse.data || [];
            setDeliveries(deliveriesData);

            const ordersData = ordersResponse.data.orders || ordersResponse.data || [];
            setOrders(ordersData);

            console.log('✅ Dados carregados:', {
                entregas: deliveriesData.length,
                ordens: ordersData.length
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

    // Função para atualizar dados (para o WhatsApp)
    const handleRefreshData = useCallback(async () => {
        console.log('🔄 Atualizando dados para WhatsApp...');
        await loadData(false);
    }, [loadData]);

    useEffect(() => {
        loadData();

        const interval = setInterval(() => {
            loadData(false);
        }, 30000);

        return () => clearInterval(interval);
    }, [loadData]);

    const filteredAndSortedDeliveries = applyAdvancedFilters(deliveries, advancedFilters).filter(delivery => {
        const matchesSearch = delivery.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilters[delivery.deliveryStatus];
        return matchesSearch && matchesStatus;
    });

    const getDeliveriesByStatus = (status) => {
        return filteredAndSortedDeliveries.filter(delivery => delivery.deliveryStatus === status);
    };

    const handleAddDelivery = async (newDelivery) => {
        try {
            console.log('➕ Criando nova entrega:', newDelivery);
            await deliveriesAPI.create(newDelivery);
            setShowAddDeliveryModal(false);
            console.log('✅ Entrega criada, recarregando dados...');
            await loadData(false);
            showCustomAlert('Sucesso', 'Entrega criada com sucesso!');
        } catch (err) {
            const errorMessage = 'Erro ao criar entrega: ' + (err.response?.data?.message || err.message);
            showCustomAlert('Erro', errorMessage);
            console.error('❌ Erro ao criar entrega:', err);
        }
    };

    const handleUpdateDeliveryStatus = async (deliveryId, newStatus) => {
        try {
            console.log('🔄 Atualizando status da entrega:', deliveryId, 'para:', newStatus);
            await deliveriesAPI.update(deliveryId, { deliveryStatus: newStatus });
            console.log('✅ Status atualizado, recarregando dados...');
            await loadData(false);
            showCustomAlert('Sucesso', 'Status da entrega atualizado!');
        } catch (err) {
            const errorMessage = 'Erro ao atualizar status: ' + (err.response?.data?.message || err.message);
            showCustomAlert('Erro', errorMessage);
            console.error('❌ Erro ao atualizar status:', err);
        }
    };

    const handleUpdateDelivery = async (updatedDelivery) => {
        try {
            console.log('🔄 Atualizando entrega:', updatedDelivery.id);

            const originalId = selectedDeliveryForView?.id || updatedDelivery.id;
            if (!originalId) {
                showCustomAlert('Erro', 'ID da entrega não encontrado');
                return;
            }

            const { id, ...deliveryDataWithoutId } = updatedDelivery;

            const formattedData = {
                ...deliveryDataWithoutId,
                deliveryDate: deliveryDataWithoutId.deliveryDate || '',
                deliveryStatus: deliveryDataWithoutId.deliveryStatus || 'pendente',
                deliveryAddress: deliveryDataWithoutId.deliveryAddress || '',
                notes: deliveryDataWithoutId.notes || '',
                orderId: deliveryDataWithoutId.orderId || '',
                order_id: deliveryDataWithoutId.orderId || deliveryDataWithoutId.order_id || ''
            };

            console.log('📤 Dados formatados para envio:', formattedData);

            const response = await deliveriesAPI.update(originalId, formattedData);

            setDeliveries(prevDeliveries =>
                prevDeliveries.map(delivery =>
                    delivery.id === originalId
                        ? {
                            ...delivery,
                            ...updatedDelivery,
                            order_id: updatedDelivery.orderId || updatedDelivery.order_id || ''
                        }
                        : delivery
                )
            );

            if (selectedDeliveryForView) {
                setIsEditMode(false);

                const updatedDeliveryForView = {
                    ...selectedDeliveryForView,
                    ...updatedDelivery,
                    order_id: updatedDelivery.orderId || updatedDelivery.order_id || ''
                };
                setSelectedDeliveryForView(updatedDeliveryForView);
            }

            console.log('✅ Entrega atualizada localmente e no backend');
            showCustomAlert('Sucesso', 'Entrega atualizada com sucesso!');

        } catch (err) {
            const errorMessage = 'Erro ao atualizar entrega: ' + (err.response?.data?.message || err.message);
            showCustomAlert('Erro', errorMessage);
            console.error('❌ Erro ao atualizar entrega:', err);
            console.error('📤 Dados que causaram erro:', updatedDelivery);
        }
    };

    const handleDeleteDelivery = (deliveryId) => {
        showCustomConfirm(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir esta entrega? Esta ação não pode ser desfeita.',
            async () => {
                try {
                    console.log('🗑️ Deletando entrega:', deliveryId);
                    await deliveriesAPI.delete(deliveryId);
                    console.log('✅ Entrega deletada, recarregando dados...');
                    await loadData(false);
                    showCustomAlert('Sucesso', 'Entrega excluída com sucesso!');
                } catch (err) {
                    const errorMessage = 'Erro ao excluir entrega: ' + (err.response?.data?.message || err.message);
                    showCustomAlert('Erro', errorMessage);
                    console.error('❌ Erro ao deletar entrega:', err);
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

    const handleViewDelivery = (delivery) => {
        setSelectedDeliveryForView(delivery);
        setIsEditMode(false);
        setShowViewEditDeliveryModal(true);
    };

    const handleEditDelivery = (delivery) => {
        setSelectedDeliveryForView(delivery);
        setIsEditMode(true);
        setShowViewEditDeliveryModal(true);
    };

    const handleCloseViewEditModal = () => {
        setShowViewEditDeliveryModal(false);
        setSelectedDeliveryForView(null);
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
            {/* Controles */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 mb-6">
                {canEdit() && (
                    <Button
                        onClick={() => setShowAddDeliveryModal(true)}
                        className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                    >
                        <Plus size={16} className="mr-2" />
                        Nova Entrega
                    </Button>
                )}

                <Button
                    onClick={() => exportDeliveriesToExcel(deliveries)}
                    className="bg-purple-500 hover:bg-purple-600 text-white w-full sm:w-auto"
                >
                    <FileSpreadsheet size={16} className="mr-2" />
                    Exportar Excel
                </Button>

                {/* Botão WhatsApp com função de atualização */}
                <WhatsAppMessageGenerator 
                    data={deliveries} 
                    type="deliveries" 
                    formatDate={formatDate}
                    onRefreshData={handleRefreshData}
                />

                <CardSizeSlider onSizeChange={handleCardSizeChange} />

                <AdvancedFilters onFiltersChange={setAdvancedFilters} currentFilters={advancedFilters} />

                <div className="flex gap-2">
                    <Button
                        onClick={() => setDeliveryViewMode("cards")}
                        variant={deliveryViewMode === "cards" ? "default" : "outline"}
                        size="sm"
                    >
                        <LayoutGrid size={16} />
                    </Button>
                    <Button
                        onClick={() => setDeliveryViewMode("list")}
                        variant={deliveryViewMode === "list" ? "default" : "outline"}
                        size="sm"
                    >
                        <List size={16} />
                    </Button>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 mb-6">
                <Input
                    placeholder="Buscar por ID da entrega..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:max-w-xs"
                />

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {statusColumns.map(status => {
                    const count = getDeliveriesByStatus(status.key).length;
                    return (
                        <div key={status.key} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className={`w-4 h-4 ${status.color} rounded mb-2`}></div>
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm text-gray-600">{status.title}</div>
                        </div>
                    );
                })}
            </div>

            {/* Conteúdo Principal */}
            {deliveryViewMode === "cards" ? (
                <div className={`grid ${cardGridClass} gap-4`}>
                    {filteredAndSortedDeliveries.map(delivery => (
                        <DeliveryCard
                            key={delivery.id}
                            delivery={delivery}
                            orders={orders}
                            onUpdateStatus={handleUpdateDeliveryStatus}
                            onView={handleViewDelivery}
                            onEdit={handleEditDelivery}
                            onDelete={handleDeleteDelivery}
                            canEdit={canEdit()}
                            formatDate={formatDate}
                            statusColumns={statusColumns}
                        />
                    ))}
                </div>
            ) : deliveryViewMode === "list" ? (
                <DeliveryListView
                    deliveries={filteredAndSortedDeliveries}
                    orders={orders}
                    onView={handleViewDelivery}
                    onEdit={handleEditDelivery}
                    onDelete={handleDeleteDelivery}
                    canEdit={canEdit()}
                    formatDate={formatDate}
                    statusColumns={statusColumns}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {statusColumns.map(status => (
                        <div key={status.key} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center mb-4">
                                <div className={`w-4 h-4 ${status.color} rounded mr-2`}></div>
                                <h3 className="font-bold">{status.title}</h3>
                                <span className="ml-auto text-sm text-gray-500">
                                    {getDeliveriesByStatus(status.key).length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {getDeliveriesByStatus(status.key).map(delivery => (
                                    <DeliveryCard
                                        key={delivery.id}
                                        delivery={delivery}
                                        orders={orders}
                                        onUpdateStatus={handleUpdateDeliveryStatus}
                                        onView={handleViewDelivery}
                                        onEdit={handleEditDelivery}
                                        onDelete={handleDeleteDelivery}
                                        canEdit={canEdit()}
                                        formatDate={formatDate}
                                        statusColumns={statusColumns}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredAndSortedDeliveries.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Nenhuma entrega encontrada</p>
                </div>
            )}

            {/* Modais */}
            <AddDeliveryModal
                isOpen={showAddDeliveryModal}
                onClose={() => setShowAddDeliveryModal(false)}
                onAddDelivery={handleAddDelivery}
                orders={orders}
            />

            <ViewEditDeliveryModal
                isOpen={showViewEditDeliveryModal}
                onClose={handleCloseViewEditModal}
                delivery={selectedDeliveryForView}
                onUpdateDelivery={handleUpdateDelivery}
                orders={orders}
                isEditMode={isEditMode}
                onToggleEditMode={handleToggleEditMode}
            />
        </div>
    );
}

export default DeliveryPage;

