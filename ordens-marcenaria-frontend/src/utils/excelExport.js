import * as XLSX from 'xlsx'

export const exportToExcel = (orders, carpentersWithStats) => {
  console.log('📊 Exportando para Excel:', { orders: orders.length, carpenters: carpentersWithStats.length });

  // Preparar dados das ordens
  const ordersData = orders.map(order => ({
    'ID da Ordem': order.id,
    'Descrição': order.description,
    'Data de Entrada': formatDateForExcel(order.entryDate),
    'Data de Saída': formatDateForExcel(order.exitDate),
    'Encarregado': order.carpenter || 'Não atribuído',
    'Status': getStatusLabel(order.status),
    'Materiais': order.materials?.map(m => `${m.description} (${m.quantity})`).join('; ') || 'Nenhum',
    'Criado em': formatDateForExcel(order.created_at),
    'Atualizado em': formatDateForExcel(order.updated_at)
  }));

  // Preparar dados dos marceneiros - usar dados com estatísticas do servidor
  const carpentersData = carpentersWithStats.map(carpenter => {
    // Se carpenter for string (compatibilidade), criar objeto básico
    if (typeof carpenter === 'string') {
      const carpenterOrders = orders.filter(order => order.carpenter === carpenter);
      const statusCounts = {
        atrasada: carpenterOrders.filter(o => o.status === 'atrasada').length,
        paraHoje: carpenterOrders.filter(o => o.status === 'paraHoje').length,
        emProcesso: carpenterOrders.filter(o => o.status === 'emProcesso').length,
        recebida: carpenterOrders.filter(o => o.status === 'recebida').length,
        concluida: carpenterOrders.filter(o => o.status === 'concluida').length
      };

      return {
        'Nome': carpenter,
        'Total de Ordens': carpenterOrders.length,
        'Atrasadas': statusCounts.atrasada,
        'Para Hoje': statusCounts.paraHoje,
        'Em Processo': statusCounts.emProcesso,
        'Recebidas': statusCounts.recebida,
        'Concluídas': statusCounts.concluida,
        'Status': 'Ativo'
      };
    }

    // Usar dados com estatísticas do servidor
    return {
      'Nome': carpenter.name,
      'Total de Ordens': carpenter.stats?.total || 0,
      'Atrasadas': carpenter.stats?.atrasada || 0,
      'Para Hoje': carpenter.stats?.paraHoje || 0,
      'Em Processo': carpenter.stats?.emProcesso || 0,
      'Recebidas': carpenter.stats?.recebida || 0,
      'Concluídas': carpenter.stats?.concluida || 0,
      'Status': carpenter.is_active ? 'Ativo' : 'Inativo',
      'Criado em': formatDateForExcel(carpenter.created_at)
    };
  });

  // Preparar resumo geral
  const totalOrders = orders.length;
  const statusSummary = {
    'Atrasadas': orders.filter(o => o.status === 'atrasada').length,
    'Para Hoje': orders.filter(o => o.status === 'paraHoje').length,
    'Em Processo': orders.filter(o => o.status === 'emProcesso').length,
    'Recebidas': orders.filter(o => o.status === 'recebida').length,
    'Concluídas': orders.filter(o => o.status === 'concluida').length
  };

  const summaryData = [
    { 'Métrica': 'Total de Ordens', 'Valor': totalOrders },
    { 'Métrica': 'Total de Marceneiros', 'Valor': carpentersWithStats.length },
    ...Object.entries(statusSummary).map(([status, count]) => ({
      'Métrica': `Ordens ${status}`,
      'Valor': count
    }))
  ];

  // Criar workbook
  const workbook = XLSX.utils.book_new();

  // Adicionar planilha de resumo
  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumo');

  // Adicionar planilha de ordens
  const ordersWorksheet = XLSX.utils.json_to_sheet(ordersData);
  XLSX.utils.book_append_sheet(workbook, ordersWorksheet, 'Ordens');

  // Adicionar planilha de marceneiros
  const carpentersWorksheet = XLSX.utils.json_to_sheet(carpentersData);
  XLSX.utils.book_append_sheet(workbook, carpentersWorksheet, 'Marceneiros');

  // Gerar arquivo com timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const fileName = `ordens_marcenaria_${timestamp}.xlsx`;
  
  console.log('💾 Salvando arquivo:', fileName);
  XLSX.writeFile(workbook, fileName);
  
  console.log('✅ Arquivo Excel exportado com sucesso!');
}

const getStatusLabel = (status) => {
  const statusMap = {
    atrasada: 'Atrasada',
    paraHoje: 'Para Hoje',
    emProcesso: 'Em Processo',
    recebida: 'Recebida',
    concluida: 'Concluída'
  };
  return statusMap[status] || status;
}

const formatDateForExcel = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  } catch (error) {
    return dateString;
  }
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