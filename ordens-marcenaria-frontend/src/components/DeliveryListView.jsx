import { Button } from '@/components/ui/button.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Edit, Eye, Trash2 } from 'lucide-react';

export function DeliveryListView({
  deliveries,
  orders,
  onView,
  onEdit,
  onDelete,
  canEdit,
  formatDate,
  statusColumns
}) {
  const getStatusTitle = (statusKey) => {
    const status = statusColumns.find(s => s.key === statusKey);
    return status ? status.title : statusKey;
  };

  const getStatusColorClass = (statusKey) => {
    const status = statusColumns.find(s => s.key === statusKey);
    return status ? status.color : '';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Ordem Relacionada</TableHead>
            <TableHead>Data de Entrega</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Endereço</TableHead>
            <TableHead>Observações</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.map(delivery => {
            const relatedOrder = orders.find(order => order.id === delivery.order_id);
            return (
              <TableRow key={delivery.id}>
                <TableCell className="font-medium">{delivery.id}</TableCell>
                <TableCell>
                  {delivery.order_id ? (
                    <span className="text-blue-600 hover:underline cursor-pointer"
                          onClick={() => onView(relatedOrder)}>
                      {delivery.order_id}
                    </span>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(delivery.deliveryDate)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColorClass(delivery.deliveryStatus)} text-white`}>
                    {getStatusTitle(delivery.deliveryStatus)}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs truncate">{delivery.deliveryAddress}</TableCell>
                <TableCell className="max-w-xs truncate">{delivery.notes || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onView(delivery)}>
                      <Eye size={16} />
                    </Button>
                    {canEdit && (
                      <Button variant="outline" size="sm" onClick={() => onEdit(delivery)}>
                        <Edit size={16} />
                      </Button>
                    )}
                    {canEdit && (
                      <Button variant="destructive" size="sm" onClick={() => onDelete(delivery.id)}>
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}


