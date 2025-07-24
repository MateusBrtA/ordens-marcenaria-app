import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Copy, Calendar, Clock, CalendarDays, RefreshCw } from "lucide-react";

export function WhatsAppMessageGenerator({ data, type = "orders", formatDate, onRefreshData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Função para obter datas da semana (segunda a domingo)
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return { monday, sunday };
  };

  // Função para obter data de hoje
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar para início do dia
    return today;
  };

  // Função para obter data de amanhã
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Normalizar para início do dia
    return tomorrow;
  };

  // Função para formatar data no padrão brasileiro
  const formatDateBR = (date) => {
    return date.toLocaleDateString('pt-BR');
  };

  // Função para verificar se uma data está dentro do período
  const isDateInPeriod = (itemDate, startDate, endDate) => {
    if (!itemDate) return false;
    
    let date;
    if (typeof itemDate === 'string') {
      // Tentar diferentes formatos de data
      if (itemDate.includes('/')) {
        const [day, month, year] = itemDate.split('/');
        date = new Date(year, month - 1, day);
      } else if (itemDate.includes('-')) {
        // Formato YYYY-MM-DD ou DD-MM-YYYY
        const parts = itemDate.split('-');
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          date = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          // DD-MM-YYYY
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else {
        return false;
      }
    } else {
      date = new Date(itemDate);
    }
    
    if (isNaN(date.getTime())) return false;
    
    // Normalizar as datas para comparação (apenas dia/mês/ano)
    const normalizeDate = (d) => {
      const normalized = new Date(d);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };
    
    const normalizedDate = normalizeDate(date);
    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);
    
    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
  };

  // Função para filtrar dados por período
  const filterDataByPeriod = (period) => {
    if (!data || data.length === 0) return [];
    
    let startDate, endDate;
    
    switch (period) {
      case 'week':
        const { monday, sunday } = getWeekDates();
        startDate = monday;
        endDate = sunday;
        break;
      case 'today':
        startDate = endDate = getToday();
        break;
      case 'tomorrow':
        startDate = endDate = getTomorrow();
        break;
      default:
        return [];
    }
    
    console.log(`🔍 Filtrando dados para ${period}:`, {
      startDate: formatDateBR(startDate),
      endDate: formatDateBR(endDate),
      totalItems: data.length
    });
    
    const filteredData = data.filter(item => {
      const dateField = type === 'orders' ? item.exitDate : item.deliveryDate;
      const isInPeriod = isDateInPeriod(dateField, startDate, endDate);
      
      if (isInPeriod) {
        console.log(`✅ Item incluído:`, {
          id: item.id,
          date: dateField,
          period: period
        });
      }
      
      return isInPeriod;
    });
    
    // Para "Para Hoje", incluir também ordens atrasadas
    if (period === 'today' && type === 'orders') {
      const today = getToday();
      const overdueOrders = data.filter(item => {
        const dateField = item.exitDate;
        if (!dateField) return false;
        
        let date;
        if (typeof dateField === 'string') {
          if (dateField.includes('/')) {
            const [day, month, year] = dateField.split('/');
            date = new Date(year, month - 1, day);
          } else if (dateField.includes('-')) {
            const parts = dateField.split('-');
            if (parts[0].length === 4) {
              date = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
              date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
          } else {
            return false;
          }
        } else {
          date = new Date(dateField);
        }
        
        if (isNaN(date.getTime())) return false;
        
        date.setHours(0, 0, 0, 0);
        const isOverdue = date < today;
        
        if (isOverdue) {
          console.log(`⚠️ Ordem atrasada incluída:`, {
            id: item.id,
            date: dateField,
            daysOverdue: Math.floor((today - date) / (1000 * 60 * 60 * 24))
          });
        }
        
        return isOverdue;
      });
      
      // Adicionar ordens atrasadas que não estão já incluídas
      overdueOrders.forEach(overdueOrder => {
        if (!filteredData.find(item => item.id === overdueOrder.id)) {
          filteredData.push(overdueOrder);
        }
      });
    }
    
    console.log(`📊 Resultado da filtragem:`, {
      period: period,
      filteredCount: filteredData.length,
      items: filteredData.map(item => ({ id: item.id, date: type === 'orders' ? item.exitDate : item.deliveryDate }))
    });
    
    return filteredData;
  };

  // Função para gerar mensagem para ordens
  const generateOrdersMessage = (period, filteredData) => {
    let title = "";
    let dateInfo = "";
    
    switch (period) {
      case 'week':
        const { monday, sunday } = getWeekDates();
        title = "📋 ORDENS PARA A SEMANA";
        dateInfo = `${formatDateBR(monday)} a ${formatDateBR(sunday)}`;
        break;
      case 'today':
        title = "📋 ORDENS PARA HOJE";
        dateInfo = formatDateBR(getToday());
        break;
      case 'tomorrow':
        title = "📋 ORDENS PARA AMANHÃ";
        dateInfo = formatDateBR(getTomorrow());
        break;
    }
    
    let message = `${title}\n${dateInfo}\n\n`;
    
    if (filteredData.length === 0) {
      message += "✅ Nenhuma ordem programada para este período.";
      return message;
    }
    
    // Separar ordens atrasadas das normais (apenas para "Para Hoje")
    let normalOrders = filteredData;
    let overdueOrders = [];
    
    if (period === 'today') {
      const today = getToday();
      overdueOrders = filteredData.filter(order => {
        const dateField = order.exitDate;
        if (!dateField) return false;
        
        let date;
        if (typeof dateField === 'string') {
          if (dateField.includes('/')) {
            const [day, month, year] = dateField.split('/');
            date = new Date(year, month - 1, day);
          } else if (dateField.includes('-')) {
            const parts = dateField.split('-');
            if (parts[0].length === 4) {
              date = new Date(parts[0], parts[1] - 1, parts[2]);
            } else {
              date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
          } else {
            return false;
          }
        } else {
          date = new Date(dateField);
        }
        
        if (isNaN(date.getTime())) return false;
        date.setHours(0, 0, 0, 0);
        return date < today;
      });
      
      normalOrders = filteredData.filter(order => !overdueOrders.find(o => o.id === order.id));
    }
    
    // Função para agrupar e gerar mensagem para um conjunto de ordens
    const generateOrdersSection = (orders, sectionTitle = null) => {
      if (orders.length === 0) return "";
      
      let sectionMessage = "";
      if (sectionTitle) {
        sectionMessage += `${sectionTitle}\n\n`;
      }
      
      // Agrupar por marceneiro
      const ordersByCarpenter = {};
      orders.forEach(order => {
        const carpenter = order.carpenter || "Não atribuído";
        if (!ordersByCarpenter[carpenter]) {
          ordersByCarpenter[carpenter] = [];
        }
        ordersByCarpenter[carpenter].push(order);
      });
      
      // Gerar mensagem por marceneiro
      Object.keys(ordersByCarpenter).forEach(carpenter => {
        sectionMessage += `👷‍♂️ *${carpenter}*\n`;
        
        ordersByCarpenter[carpenter].forEach(order => {
          const exitDate = order.exitDate ? formatDate(order.exitDate) : "Data não definida";
          sectionMessage += `• Ordem ${order.id} - ${exitDate}\n`;
          sectionMessage += `  📝 ${order.description || "Sem descrição"}\n`;
        });
        
        sectionMessage += "\n";
      });
      
      return sectionMessage;
    };
    
    // Adicionar ordens atrasadas primeiro (se houver)
    if (overdueOrders.length > 0) {
      message += generateOrdersSection(overdueOrders, "⚠️ *ORDENS ATRASADAS*");
    }
    
    // Adicionar ordens normais
    if (normalOrders.length > 0) {
      const sectionTitle = overdueOrders.length > 0 ? "📅 *ORDENS PROGRAMADAS*" : null;
      message += generateOrdersSection(normalOrders, sectionTitle);
    }
    
    message += `📊 *Total: ${filteredData.length} ordem(ns)*`;
    if (overdueOrders.length > 0) {
      message += ` (${overdueOrders.length} atrasada(s))`;
    }
    
    return message;
  };

  // Função para gerar mensagem para entregas
  const generateDeliveriesMessage = (period, filteredData) => {
    let title = "";
    let dateInfo = "";
    
    switch (period) {
      case 'week':
        const { monday, sunday } = getWeekDates();
        title = "🚚 ENTREGAS PARA A SEMANA";
        dateInfo = `${formatDateBR(monday)} a ${formatDateBR(sunday)}`;
        break;
      case 'today':
        title = "🚚 ENTREGAS PARA HOJE";
        dateInfo = formatDateBR(getToday());
        break;
      case 'tomorrow':
        title = "🚚 ENTREGAS PARA AMANHÃ";
        dateInfo = formatDateBR(getTomorrow());
        break;
    }
    
    let message = `${title}\n${dateInfo}\n\n`;
    
    if (filteredData.length === 0) {
      message += "✅ Nenhuma entrega programada para este período.";
      return message;
    }
    
    // Agrupar por status
    const deliveriesByStatus = {};
    filteredData.forEach(delivery => {
      const status = delivery.deliveryStatus || "pendente";
      if (!deliveriesByStatus[status]) {
        deliveriesByStatus[status] = [];
      }
      deliveriesByStatus[status].push(delivery);
    });
    
    // Mapear status para emojis e nomes
    const statusMap = {
      'pendente': { emoji: '⏳', name: 'Pendentes' },
      'em_rota': { emoji: '🚛', name: 'Em Rota' },
      'entregue': { emoji: '✅', name: 'Entregues' },
      'cancelada': { emoji: '❌', name: 'Canceladas' }
    };
    
    // Gerar mensagem por status
    Object.keys(deliveriesByStatus).forEach(status => {
      const statusInfo = statusMap[status] || { emoji: '📦', name: status };
      message += `${statusInfo.emoji} *${statusInfo.name}*\n`;
      
      deliveriesByStatus[status].forEach(delivery => {
        const deliveryDate = delivery.deliveryDate ? formatDate(delivery.deliveryDate) : "Data não definida";
        message += `• Entrega ${delivery.id} - ${deliveryDate}\n`;
        if (delivery.deliveryAddress) {
          message += `  📍 ${delivery.deliveryAddress}\n`;
        }
        if (delivery.notes) {
          message += `  📝 ${delivery.notes}\n`;
        }
      });
      
      message += "\n";
    });
    
    message += `📊 *Total: ${filteredData.length} entrega(s)*`;
    
    return message;
  };

  // Função para gerar mensagem
  const generateMessage = (period) => {
    console.log(`🔄 Gerando mensagem para período: ${period}`);
    console.log(`📦 Dados disponíveis:`, data?.length || 0, 'itens');
    
    const filteredData = filterDataByPeriod(period);
    
    let message = "";
    if (type === 'orders') {
      message = generateOrdersMessage(period, filteredData);
    } else {
      message = generateDeliveriesMessage(period, filteredData);
    }
    
    setGeneratedMessage(message);
    setSelectedPeriod(period);
  };

  // Função para atualizar dados
  const handleRefreshData = async () => {
    if (!onRefreshData) return;
    
    setIsRefreshing(true);
    try {
      await onRefreshData();
      // Regenerar mensagem se havia uma selecionada
      if (selectedPeriod) {
        setTimeout(() => generateMessage(selectedPeriod), 500);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Função para copiar mensagem
  const copyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    // Você pode adicionar uma notificação aqui se desejar
  };

  // Função para abrir WhatsApp Web
  const openWhatsApp = () => {
    const encodedMessage = encodeURIComponent(generatedMessage);
    window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, '_blank');
  };

  const buttonTitle = type === 'orders' ? 'Mensagem WhatsApp - Ordens' : 'Mensagem WhatsApp - Entregas';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
        >
          <MessageCircle size={16} className="mr-2" />
          Mensagem WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {buttonTitle}
            {onRefreshData && (
              <Button
                onClick={handleRefreshData}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Atualizando..." : "Atualizar"}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Botões de período */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              onClick={() => generateMessage('week')}
              variant={selectedPeriod === 'week' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <CalendarDays size={16} />
              Semanal
            </Button>
            
            <Button
              onClick={() => generateMessage('today')}
              variant={selectedPeriod === 'today' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Calendar size={16} />
              Para Hoje
            </Button>
            
            <Button
              onClick={() => generateMessage('tomorrow')}
              variant={selectedPeriod === 'tomorrow' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Clock size={16} />
              Para Amanhã
            </Button>
          </div>
          
          {/* Informações de debug (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <strong>Debug:</strong> {data?.length || 0} itens carregados | 
              Hoje: {formatDateBR(getToday())} | 
              Amanhã: {formatDateBR(getTomorrow())}
            </div>
          )}
          
          {/* Área da mensagem */}
          {generatedMessage && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem Gerada:</label>
              <Textarea
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                placeholder="A mensagem aparecerá aqui..."
              />
              
              {/* Botões de ação */}
              <div className="flex gap-2">
                <Button
                  onClick={copyMessage}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Copy size={16} />
                  Copiar
                </Button>
                
                <Button
                  onClick={openWhatsApp}
                  className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                >
                  <MessageCircle size={16} />
                  Abrir WhatsApp
                </Button>
              </div>
            </div>
          )}
          
          {!generatedMessage && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
              <p>Selecione um período para gerar a mensagem</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

