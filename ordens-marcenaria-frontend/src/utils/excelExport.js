import * as XLSX from 'xlsx'

export const exportToExcel = (orders, carpenters) => {
  // Preparar dados das ordens
  const ordersData = orders.map(order => ({
    'ID da Ordem': order.id,
    'Descrição': order.description,
    'Data de Entrada': order.entryDate,
    'Data de Saída': order.exitDate,
    'Encarregado': order.carpenter || 'Não atribuído',
    'Status': getStatusLabel(order.status),
    'Materiais': order.materials?.map(m => `${m.description} (${m.quantity})`).join('; ') || 'Nenhum'
  }))

  // Preparar dados dos marceneiros
  const carpentersData = carpenters.map(carpenter => {
    const carpenterOrders = orders.filter(order => order.carpenter === carpenter)
    const statusCounts = {
      atrasada: carpenterOrders.filter(o => o.status === 'atrasada').length,
      paraHoje: carpenterOrders.filter(o => o.status === 'paraHoje').length,
      emProcesso: carpenterOrders.filter(o => o.status === 'emProcesso').length,
      recebida: carpenterOrders.filter(o => o.status === 'recebida').length,
      concluida: carpenterOrders.filter(o => o.status === 'concluida').length
    }

    return {
      'Nome': carpenter,
      'Total de Ordens': carpenterOrders.length,
      'Atrasadas': statusCounts.atrasada,
      'Para Hoje': statusCounts.paraHoje,
      'Em Processo': statusCounts.emProcesso,
      'Recebidas': statusCounts.recebida,
      'Concluídas': statusCounts.concluida
    }
  })

  // Criar workbook
  const workbook = XLSX.utils.book_new()

  // Adicionar planilha de ordens
  const ordersWorksheet = XLSX.utils.json_to_sheet(ordersData)
  XLSX.utils.book_append_sheet(workbook, ordersWorksheet, 'Ordens')

  // Adicionar planilha de marceneiros
  const carpentersWorksheet = XLSX.utils.json_to_sheet(carpentersData)
  XLSX.utils.book_append_sheet(workbook, carpentersWorksheet, 'Marceneiros')

  // Gerar arquivo
  const fileName = `ordens_marcenaria_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

const getStatusLabel = (status) => {
  const statusMap = {
    atrasada: 'Atrasada',
    paraHoje: 'Para Hoje',
    emProcesso: 'Em Processo',
    recebida: 'Recebida',
    concluida: 'Concluída'
  }
  return statusMap[status] || status
}

export const exportDeliveriesToExcel = (deliveries) => {
  console.log('📊 Exportando entregas para Excel:', { deliveries: deliveries.length });

  // Preparar dados das entregas
  const deliveriesData = deliveries.map(delivery => ({
    'ID da Entrega': delivery.id,
    'ID da Ordem': delivery.order_id,
    'Data de Entrega': formatDateForExcel(delivery.deliveryDate),
    'Status': getDeliveryStatusLabel(delivery.deliveryStatus),
    'Endereço de Entrega': delivery.deliveryAddress,
    'Observações': delivery.notes || 'Nenhuma',
    'Criado em': formatDateForExcel(delivery.createdAt),
    'Atualizado em': formatDateForExcel(delivery.updatedAt)
  }));

  // Preparar resumo das entregas
  const totalDeliveries = deliveries.length;
  const statusSummary = {
    'Pendentes': deliveries.filter(d => d.deliveryStatus === 'pendente').length,
    'Em Rota': deliveries.filter(d => d.deliveryStatus === 'em_rota').length,
    'Entregues': deliveries.filter(d => d.deliveryStatus === 'entregue').length,
    'Canceladas': deliveries.filter(d => d.deliveryStatus === 'cancelada').length
  };

  const summaryData = [
    { 'Métrica': 'Total de Entregas', 'Valor': totalDeliveries },
    ...Object.entries(statusSummary).map(([status, count]) => ({
      'Métrica': `Entregas ${status}`,
      'Valor': count
    }))
  ];

  // Criar workbook
  const workbook = XLSX.utils.book_new();

  // Adicionar planilha de resumo
  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumo');

  // Adicionar planilha de entregas
  const deliveriesWorksheet = XLSX.utils.json_to_sheet(deliveriesData);
  XLSX.utils.book_append_sheet(workbook, deliveriesWorksheet, 'Entregas');

  // Gerar arquivo com timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const fileName = `entregas_marcenaria_${timestamp}.xlsx`;
  
  console.log('💾 Salvando arquivo:', fileName);
  XLSX.writeFile(workbook, fileName);
  
  console.log('✅ Arquivo Excel de entregas exportado com sucesso!');
}

const getDeliveryStatusLabel = (status) => {
  const statusMap = {
    pendente: 'Pendente',
    em_rota: 'Em Rota',
    entregue: 'Entregue',
    cancelada: 'Cancelada'
  };
  return statusMap[status] || status;
}

