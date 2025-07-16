import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Eye, Edit, Trash2 } from 'lucide-react';

export function OrderListView({ 
  orders, 
  carpenters, 
  onUpdateStatus, 
  onUpdateCarpenter, 
  onView, 
  onEdit, 
  onDelete, 
  canEdit, 
  formatDate, 
  statusColumns 
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entrada
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Saída
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Encarregado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Materiais
              </th>
              {canEdit && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order, index) => (
              <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.id}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="truncate" title={order.description}>
                    {order.description}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(order.entryDate)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(order.exitDate)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {canEdit ? (
                    <Select
                      value={order.carpenter || "none"}
                      onValueChange={(value) => onUpdateCarpenter(order, value === "none" ? null : value)}
                    >
                      <SelectTrigger className="h-8 text-xs w-32">
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
                    <span>{order.carpenter || '(Nenhum)'}</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {canEdit ? (
                    <Select
                      value={order.status}
                      onValueChange={(value) => onUpdateStatus(order.id, value)}
                    >
                      <SelectTrigger className="h-8 text-xs w-32">
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
                    <span className="inline-flex items-center">
                      <div 
                        className={`w-2 h-2 rounded-full mr-2 ${
                          statusColumns.find(s => s.key === order.status)?.color || 'bg-gray-400'
                        }`}
                      ></div>
                      {statusColumns.find(s => s.key === order.status)?.title || order.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {order.materials?.length || 0} itens
                  </span>
                </td>
                {canEdit && (
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(order)}
                        className="text-blue-500 hover:text-blue-700 h-8 w-8 p-0"
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(order)}
                        className="text-green-500 hover:text-green-700 h-8 w-8 p-0"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(order.id)}
                        className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhuma ordem encontrada</p>
        </div>
      )}
    </div>
  );
}