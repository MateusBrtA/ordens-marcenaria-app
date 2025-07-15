import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Eye, Edit, Trash2 } from 'lucide-react';

export function DeliveryCard({ 
  delivery, 
  orders, 
  onUpdateStatus, 
  onView, 
  onEdit, 
  onDelete, 
  canEdit, 
  formatDate, 
  statusColumns 
}) {
  // Encontrar a ordem relacionada
  const relatedOrder = orders.find(order => order.id === delivery.order_id);

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow mb-3">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
        <h3 className="font-bold text-lg">{delivery.id}</h3>
        {canEdit && (
          <div className="flex gap-1 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(delivery)}
              className="text-blue-500 hover:text-blue-700"
            >
              <Eye size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(delivery)}
              className="text-green-500 hover:text-green-700"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(delivery.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-3 text-xs sm:text-sm">
        <div>
          <strong>Ordem:</strong> {delivery.order_id}
          {relatedOrder && (
            <span className="text-gray-600 ml-2">({relatedOrder.description?.substring(0, 30)}...)</span>
          )}
        </div>
        <div>
          <strong>Data de Entrega:</strong> {formatDate(delivery.deliveryDate)}
        </div>
        <div>
          <strong>Endereço:</strong> 
          <span className="ml-2 break-words">{delivery.deliveryAddress}</span>
        </div>
        {delivery.notes && (
          <div>
            <strong>Observações:</strong> 
            <span className="ml-2 break-words">{delivery.notes}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {canEdit ? (
          <Select
            value={delivery.deliveryStatus}
            onValueChange={(value) => onUpdateStatus(delivery.id, value)}
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
            Status: {statusColumns.find(s => s.key === delivery.deliveryStatus)?.title || delivery.deliveryStatus}
          </div>
        )}
      </div>
    </div>
  );
}