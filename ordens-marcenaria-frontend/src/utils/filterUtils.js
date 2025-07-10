// Utilitários para filtros avançados de ordens

/**
 * Aplica filtros avançados a uma lista de ordens
 * @param {Array} orders - Lista de ordens
 * @param {Object} filters - Objeto com os filtros a serem aplicados
 * @returns {Array} - Lista de ordens filtradas
 */
export function applyAdvancedFilters(orders, filters) {
  if (!orders || !Array.isArray(orders)) return [];
  
  let filteredOrders = [...orders];

  // Filtro por ID
  if (filters.idSearch && filters.idSearch.trim()) {
    const searchTerm = filters.idSearch.toLowerCase().trim();
    filteredOrders = filteredOrders.filter(order => 
      order.id.toLowerCase().includes(searchTerm)
    );
  }

  // Filtro por data de entrada
  if (filters.entryDateFrom || filters.entryDateTo) {
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = parseDate(order.entryDate);
      if (!orderDate) return true; // Se não conseguir parsear, mantém na lista
      
      let matchesFrom = true;
      let matchesTo = true;
      
      if (filters.entryDateFrom) {
        const fromDate = parseDate(filters.entryDateFrom);
        if (fromDate) {
          matchesFrom = orderDate >= fromDate;
        }
      }
      
      if (filters.entryDateTo) {
        const toDate = parseDate(filters.entryDateTo);
        if (toDate) {
          matchesTo = orderDate <= toDate;
        }
      }
      
      return matchesFrom && matchesTo;
    });
  }

  // Filtro por data de saída
  if (filters.exitDateFrom || filters.exitDateTo) {
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = parseDate(order.exitDate);
      if (!orderDate) return true; // Se não conseguir parsear, mantém na lista
      
      let matchesFrom = true;
      let matchesTo = true;
      
      if (filters.exitDateFrom) {
        const fromDate = parseDate(filters.exitDateFrom);
        if (fromDate) {
          matchesFrom = orderDate >= fromDate;
        }
      }
      
      if (filters.exitDateTo) {
        const toDate = parseDate(filters.exitDateTo);
        if (toDate) {
          matchesTo = orderDate <= toDate;
        }
      }
      
      return matchesFrom && matchesTo;
    });
  }

  // Aplicar ordenação
  if (filters.sortBy && filters.sortOrder) {
    filteredOrders = sortOrders(filteredOrders, filters.sortBy, filters.sortOrder);
  }

  return filteredOrders;
}

/**
 * Converte string de data para objeto Date
 * @param {string} dateString - String da data em formato dd/mm/yyyy ou yyyy-mm-dd
 * @returns {Date|null} - Objeto Date ou null se inválido
 */
function parseDate(dateString) {
  if (!dateString) return null;
  
  try {
    // Se está no formato dd/mm/yyyy
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Se está no formato yyyy-mm-dd
    if (dateString.includes('-')) {
      return new Date(dateString);
    }
    
    // Tentar parsear diretamente
    return new Date(dateString);
  } catch (error) {
    console.warn('Erro ao parsear data:', dateString, error);
    return null;
  }
}

/**
 * Ordena lista de ordens por campo específico
 * @param {Array} orders - Lista de ordens
 * @param {string} sortBy - Campo para ordenação
 * @param {string} sortOrder - Ordem (asc/desc)
 * @returns {Array} - Lista ordenada
 */
function sortOrders(orders, sortBy, sortOrder) {
  const sortedOrders = [...orders];
  
  sortedOrders.sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'id':
        valueA = a.id.toLowerCase();
        valueB = b.id.toLowerCase();
        break;
        
      case 'entryDate':
      case 'exitDate':
        valueA = parseDate(a[sortBy]) || new Date(0);
        valueB = parseDate(b[sortBy]) || new Date(0);
        break;
        
      case 'status':
        // Ordenação por prioridade de status
        const statusPriority = {
          'atrasada': 1,
          'paraHoje': 2,
          'emProcesso': 3,
          'recebida': 4,
          'concluida': 5
        };
        valueA = statusPriority[a.status] || 999;
        valueB = statusPriority[b.status] || 999;
        break;
        
      case 'carpenter':
        valueA = (a.carpenter || '').toLowerCase();
        valueB = (b.carpenter || '').toLowerCase();
        break;
        
      default:
        valueA = a[sortBy] || '';
        valueB = b[sortBy] || '';
    }
    
    // Comparação
    let comparison = 0;
    if (valueA > valueB) {
      comparison = 1;
    } else if (valueA < valueB) {
      comparison = -1;
    }
    
    // Aplicar ordem
    return sortOrder === 'desc' ? comparison * -1 : comparison;
  });
  
  return sortedOrders;
}

/**
 * Verifica se há filtros ativos
 * @param {Object} filters - Objeto com filtros
 * @returns {boolean} - True se há filtros ativos
 */
export function hasActiveFilters(filters) {
  if (!filters) return false;
  
  return !!(
    filters.idSearch ||
    filters.entryDateFrom ||
    filters.entryDateTo ||
    filters.exitDateFrom ||
    filters.exitDateTo ||
    (filters.sortBy && filters.sortBy !== 'id') ||
    (filters.sortOrder && filters.sortOrder !== 'asc')
  );
}

/**
 * Limpa todos os filtros
 * @returns {Object} - Objeto com filtros limpos
 */
export function clearAllFilters() {
  return {
    entryDateFrom: '',
    entryDateTo: '',
    exitDateFrom: '',
    exitDateTo: '',
    idSearch: '',
    sortBy: 'id',
    sortOrder: 'asc'
  };
}

