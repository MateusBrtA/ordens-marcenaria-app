import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Edit, Eye } from 'lucide-react';

export function ViewEditDeliveryModal({ 
  isOpen, 
  onClose, 
  delivery, 
  onUpdateDelivery, 
  orders, 
  isEditMode, 
  onToggleEditMode 
}) {
  const [formData, setFormData] = useState({
    id: '',
    orderId: '',
    deliveryDate: '',
    deliveryStatus: 'pendente',
    deliveryAddress: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (delivery) {
      setFormData({
        id: delivery.id || '',
        orderId: delivery.order_id || '',
        deliveryDate: delivery.deliveryDate ? delivery.deliveryDate.split('T')[0] : '',
        deliveryStatus: delivery.deliveryStatus || 'pendente',
        deliveryAddress: delivery.deliveryAddress || '',
        notes: delivery.notes || ''
      });
      setErrors({});
    }
  }, [delivery]);

  const validateForm = () => {
    const newErrors = {};

    // Ordem é OPCIONAL - não validar como obrigatória
    // A orderId pode ser vazia/null sem problemas

    if (!formData.deliveryDate) {
      newErrors.deliveryDate = 'Data de entrega é obrigatória';
    }

    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Endereço de entrega é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Converter "none" de volta para string vazia antes de enviar
    // Isso permite que a entrega seja editada sem ordem atrelada
    const dataToSubmit = {
      ...formData,
      orderId: formData.orderId === 'none' ? '' : formData.orderId,
      // Garantir que o order_id também seja atualizado para compatibilidade
      order_id: formData.orderId === 'none' ? '' : formData.orderId
    };

    onUpdateDelivery(dataToSubmit);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    if (dateString.includes('/')) return dateString;

    if (dateString.includes('-')) {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
      }
    }

    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    } catch (e) {
      console.warn('Erro ao formatar data:', dateString);
    }

    return dateString;
  };

  // Encontrar a ordem relacionada
  const relatedOrder = orders.find(order => order.id === delivery?.order_id);

  if (!delivery) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? <Edit size={20} /> : <Eye size={20} />}
            {isEditMode ? 'Editar' : 'Visualizar'} Entrega {delivery.id}
          </DialogTitle>
        </DialogHeader>

        {isEditMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="id">ID da Entrega</Label>
              <Input
                id="id"
                value={formData.id}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="orderId">Ordem (Opcional)</Label>
              <Select 
                value={formData.orderId || "none"} 
                onValueChange={(value) => handleInputChange("orderId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma ordem (Opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma Ordem</SelectItem>
                  {orders.map(order => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.id} - {order.description?.substring(0, 30)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Você pode deixar sem vincular a uma ordem específica</p>
            </div>

            <div>
              <Label htmlFor="deliveryDate">Data de Entrega *</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                className={errors.deliveryDate ? 'border-red-500' : ''}
              />
              {errors.deliveryDate && <p className="text-red-500 text-sm mt-1">{errors.deliveryDate}</p>}
            </div>

            <div>
              <Label htmlFor="deliveryStatus">Status</Label>
              <Select value={formData.deliveryStatus} onValueChange={(value) => handleInputChange('deliveryStatus', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_rota">Em Rota</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deliveryAddress">Endereço de Entrega *</Label>
              <Textarea
                id="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                placeholder="Digite o endereço completo de entrega"
                className={errors.deliveryAddress ? 'border-red-500' : ''}
                rows={3}
              />
              {errors.deliveryAddress && <p className="text-red-500 text-sm mt-1">{errors.deliveryAddress}</p>}
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações adicionais (opcional)"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onToggleEditMode}>
                Cancelar Edição
              </Button>
              <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>ID da Entrega</Label>
              <p className="text-sm font-medium">{delivery.id}</p>
            </div>

            <div>
              <Label>Ordem</Label>
              <p className="text-sm font-medium">
                {delivery.order_id || 'Nenhuma Ordem'}
                {relatedOrder && (
                  <span className="text-gray-600 ml-2">({relatedOrder.description?.substring(0, 50)}...)</span>
                )}
              </p>
            </div>

            <div>
              <Label>Data de Entrega</Label>
              <p className="text-sm font-medium">{formatDate(delivery.deliveryDate)}</p>
            </div>

            <div>
              <Label>Status</Label>
              <p className="text-sm font-medium">
                {delivery.deliveryStatus === 'pendente' && 'Pendente'}
                {delivery.deliveryStatus === 'em_rota' && 'Em Rota'}
                {delivery.deliveryStatus === 'entregue' && 'Entregue'}
                {delivery.deliveryStatus === 'cancelada' && 'Cancelada'}
              </p>
            </div>

            <div>
              <Label>Endereço de Entrega</Label>
              <p className="text-sm font-medium break-words">{delivery.deliveryAddress}</p>
            </div>

            {delivery.notes && (
              <div>
                <Label>Observações</Label>
                <p className="text-sm font-medium break-words">{delivery.notes}</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button onClick={onToggleEditMode} className="bg-green-500 hover:bg-green-600">
                <Edit size={16} className="mr-2" />
                Editar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

