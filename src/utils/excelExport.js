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

