# Análise do Projeto Original

## Estrutura de Dados

### Ordens de Serviço
```javascript
{
  id: 'OS-001',
  description: 'Mesa de jantar em madeira maciça',
  entryDate: '2025-06-20',
  exitDate: '2025-06-25',
  carpenter: 'Jadir',
  status: 'recebida', // atrasada, paraHoje, emProcesso, recebida, concluida
  materials: [
    { id: 1, description: 'Madeira de carvalho', quantity: 5 },
    { id: 2, description: 'Parafusos', quantity: 20 }
  ]
}
```

### Marceneiros
```javascript
['Jadir', 'João', 'Pedro']
```

## Funcionalidades Identificadas

1. **Gerenciamento de Ordens**
   - Criar, editar, excluir ordens
   - Status automático baseado em datas
   - Atribuição de marceneiros

2. **Gerenciamento de Materiais**
   - Lista de materiais por ordem
   - Adicionar/remover materiais

3. **Filtros e Busca**
   - Busca por ID da ordem
   - Filtro por marceneiro
   - Filtro por status

4. **Visualização**
   - Modo cards (Kanban)
   - Modo tabela

5. **Exportação**
   - Exportar para Excel

## Problemas Atuais
- Dados armazenados apenas no localStorage
- Sem sistema de autenticação
- Sem persistência online
- Sem diferentes níveis de acesso

## Solução Proposta
- Backend Flask com SQLite/PostgreSQL
- Sistema de autenticação JWT
- Níveis de acesso: Administrador, Marceneiro, Visitante
- API REST para integração com frontend

