import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';

export function AddDeliveryModal({ isOpen, onClose, onAddDelivery, orders }) {
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
    if (isOpen) {
      // Resetar formulário quando modal abrir
      setFormData({
        id: '',
        orderId: '',
        deliveryDate: '',
        deliveryStatus: 'pendente',
        deliveryAddress: '',
        notes: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.id.trim()) {
      newErrors.id = 'ID é obrigatório';
    }

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
    // Isso permite que a entrega seja criada sem ordem atrelada
    const dataToSubmit = {
      ...formData,
      orderId: formData.orderId === 'none' ? '' : formData.orderId
    };

    onAddDelivery(dataToSubmit);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Entrega</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="id">ID da Entrega *</Label>
            <Input
              id="id"
              value={formData.id}
              onChange={(e) => handleInputChange('id', e.target.value)}
              placeholder="Ex: ENT001"
              className={errors.id ? 'border-red-500' : ''}
            />
            {errors.id && <p className="text-red-500 text-sm mt-1">{errors.id}</p>}
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
            <p className="text-xs text-gray-500 mt-1">Você pode criar uma entrega sem vincular a uma ordem específica</p>
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-500 hover:bg-green-600">
              Criar Entrega
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

